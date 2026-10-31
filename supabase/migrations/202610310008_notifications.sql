alter table public.refunds add column "dispatchStartedAt" timestamptz;
create function private.contact_alert() returns trigger language plpgsql security definer set search_path = '' as $$
begin perform private.notify('newEnquiry','New customer enquiry',new.subject,'VIEW_CUSTOMERS','/admin/messages');return new;end; $$;
create trigger contact_alert after insert on public.contact_messages for each row execute function private.contact_alert();
create function private.cart_lock() returns trigger language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
 select "customerId" into uid from public.carts where id=case when tg_op='DELETE' then old."cartId" else new."cartId" end;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if tg_op='DELETE' then return old; end if;
 if not exists(select 1 from public.product_variants v join public.products p on p.id=v."productId" join public.inventory i on i."variantId"=v.id where v.id=new."variantId" and v."isActive" and p."isActive" and p."archivedAt" is null and i.quantity-i.reserved>=new.quantity) then raise exception 'Requested quantity is not available'; end if;
 return new;
end; $$;
create trigger cart_lock before insert or update or delete on public.cart_items for each row execute function private.cart_lock();
