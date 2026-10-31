create function public.admin_report(date_from timestamptz default '-infinity', date_to timestamptz default 'infinity') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
 perform private.require_permission('VIEW_ANALYTICS');
 with paid as (select o.*,greatest(0,o."totalAmount"-coalesce((select sum(r.amount) from public.refunds r join public.payments p on p.id=r."paymentId" where p."orderId"=o.id and r.status='SUCCESS'),0)) net
 from public.orders o where o."paidAt" between date_from and date_to and o."stockCommitted"),
 daily as (select ("paidAt" at time zone 'Africa/Lagos')::date as date,sum(net) revenue,count(*) orders from paid group by 1 order by 1),
 net_items as (select i.*,i.quantity-coalesce((select sum(ri.quantity) from public.return_items ri join public.returns r on r.id=ri."returnId" where ri."orderItemId"=i.id and r.status in ('REFUNDED','COMPLETED')),0) net_quantity,p.subtotal,p."discountTotal" from public.order_items i join paid p on p.id=i."orderId"),
 best as (select i."productId",i."productName",sum(i.net_quantity) quantity,sum(i."unitPrice"*i.net_quantity*(i.subtotal-i."discountTotal")/nullif(i.subtotal,0)) revenue from net_items i group by 1,2 order by sum(i.net_quantity) desc),
 cats as (select coalesce(c.name,'Uncategorised') name,sum(i.net_quantity) quantity,sum(i."unitPrice"*i.net_quantity*(i.subtotal-i."discountTotal")/nullif(i.subtotal,0)) revenue from net_items i join public.products pr on pr.id=i."productId" left join public.product_categories c on c.id=pr."categoryId" group by 1),
 growth as (select ("createdAt" at time zone 'Africa/Lagos')::date date,count(*) customers from public.profiles where "createdAt" between date_from and date_to group by 1 order by 1),
 movements as (select type,jsonb_build_object('delta',sum(delta)) "_sum",count(*) "_count" from public.inventory_movements where "createdAt" between date_from and date_to group by type)
 select jsonb_build_object('revenue',coalesce((select sum(net) from paid),0),'orders',(select count(*) from paid),
 'averageOrderValue',coalesce((select avg(net) from paid),0),'productsSold',coalesce((select sum(net_quantity) from net_items),0),
 'daily',coalesce((select jsonb_agg(daily) from daily),'[]'),'bestSellers',coalesce((select jsonb_agg(best) from best),'[]'),
 'categories',coalesce((select jsonb_agg(cats) from cats),'[]'),'customerGrowth',coalesce((select jsonb_agg(growth) from growth),'[]'),
 'inventoryMovement',coalesce((select jsonb_agg(movements) from movements),'[]')) into result;
 return result;
end; $$;
create function public.admin_dashboard() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 perform private.require_permission('VIEW_ANALYTICS');
 return jsonb_build_object('totalOrders',(select count(*) from public.orders),'totalCustomers',(select count(*) from public.profiles p where not exists(select 1 from public.admin_roles a where a."userId"=p.id)),
 'totalProducts',(select count(*) from public.products where "archivedAt" is null),'totalStock',(select coalesce(sum(quantity-reserved),0) from public.inventory),
 'lowStockCount',(select count(*) from public.inventory where quantity-reserved between 1 and "lowStockThreshold"),
 'outOfStockCount',(select count(*) from public.inventory where quantity=reserved),
 'statusCounts',(select coalesce(jsonb_agg(s),'[]') from (select status,count(*) "_count" from public.orders group by status) s),
 'recentOrders',(select coalesce(jsonb_agg(r),'[]') from (select o.*,jsonb_build_object('firstName',p."firstName",'lastName',p."lastName",'email',p.email) customer,
 coalesce((select jsonb_agg(jsonb_build_object('status',pay.status)) from public.payments pay where pay."orderId"=o.id),'[]') payments
 from public.orders o join public.profiles p on p.id=o."customerId" order by o."createdAt" desc limit 10) r));
end; $$;

create function public.admin_customer(customer_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare p public.profiles;
begin
 perform private.require_permission('VIEW_CUSTOMERS'); select * into strict p from public.profiles where id=customer_id;
 return to_jsonb(p)||jsonb_build_object('orders',(select coalesce(jsonb_agg(o),'[]') from (select * from public.orders where "customerId"=customer_id order by "createdAt" desc limit 50) o),
 '_count',jsonb_build_object('orders',(select count(*) from public.orders where "customerId"=customer_id)),
 'totalSpent',(select coalesce(sum(o."totalAmount"-coalesce((select sum(f.amount) from public.refunds f join public.payments p1 on p1.id=f."paymentId" where p1."orderId"=o.id and f.status='SUCCESS'),0)),0) from public.orders o where o."customerId"=customer_id and o."stockCommitted"),
 'addresses',(select coalesce(jsonb_agg(a),'[]') from (select * from public.customer_addresses where "customerId"=customer_id limit 20) a),
 'returns',(select coalesce(jsonb_agg(r),'[]') from (select * from public.returns where "customerId"=customer_id limit 20) r),
 'wishlist',jsonb_build_object('items',(select coalesce(jsonb_agg(x),'[]') from (select wi.id,jsonb_build_object('id',pr.id,'name',pr.name) product from public.wishlist_items wi join public.wishlists w on w.id=wi."wishlistId" join public.products pr on pr.id=wi."productId" where w."customerId"=customer_id limit 50) x)));
end; $$;

-- Guard against a staff member removing the last administrator, including via the
-- service-only staff management Edge Function.
create function private.protect_super_admin() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 perform pg_advisory_xact_lock(731934);
 if old.role='SUPER_ADMIN' and old."isActive" and (tg_op='DELETE' or new.role<>'SUPER_ADMIN' or not new."isActive")
 and not exists(select 1 from public.admin_roles where id<>old.id and role='SUPER_ADMIN' and "isActive") then raise exception 'Keep at least one active Super Admin'; end if;
 if tg_op='DELETE' then return old; end if; return new;
end; $$;
create trigger protect_super_admin before update or delete on public.admin_roles for each row execute function private.protect_super_admin();

-- Functions default to EXECUTE for PUBLIC in PostgreSQL. Restrict application
-- operations explicitly; only the published policy reader is available anonymously.
do $$ declare routine record; begin
 for routine in select p.oid::regprocedure identity from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=any(array['has_permission','is_customer','admin_write','adjust_inventory','save_content','save_settings','published_policy','save_policy','submit_review','consume_rate_limit','expire_orders','create_checkout','cancel_order','transition_order','save_shipment','settle_payment','request_return','transition_return','prepare_refund','settle_refund','admin_report','admin_dashboard','admin_customer']) loop
  execute format('revoke execute on function %s from public,anon',routine.identity);
 end loop;
end $$;
grant execute on function public.has_permission(text),public.is_customer(),public.published_policy(text) to anon,authenticated;
grant execute on function public.admin_write(text,uuid,jsonb,text),public.adjust_inventory(uuid,integer,text),public.save_content(text,jsonb),public.save_settings(text,jsonb,integer),public.save_policy(text,jsonb),public.submit_review(uuid,integer,text),public.create_checkout(jsonb),public.cancel_order(uuid),public.transition_order(uuid,text),public.save_shipment(uuid,text,text),public.request_return(jsonb),public.transition_return(uuid,text),public.prepare_refund(uuid),public.admin_report(timestamptz,timestamptz),public.admin_dashboard(),public.admin_customer(uuid) to authenticated;
-- Repeat service-only grants after revoking default PUBLIC grants.
grant execute on function public.consume_rate_limit(text,integer,integer),public.expire_orders(),public.settle_payment(text,text,bigint,text,text,boolean),public.settle_refund(uuid,text,text) to service_role;
