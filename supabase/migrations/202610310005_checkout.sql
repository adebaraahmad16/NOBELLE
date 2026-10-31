create function private.release_order(target uuid, explanation text) returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders; i record;
begin
 select * into strict o from public.orders where id=target for update;
 if o.status<>'PENDING' or o."stockCommitted" then return; end if;
 for i in select * from public.order_items where "orderId"=o.id order by "variantId" loop
  update public.inventory set reserved=reserved-i.quantity where "variantId"=i."variantId";
  insert into public.inventory_movements("variantId",delta,"reservedDelta",type,reason,"orderId","actorId") values(i."variantId",0,-i.quantity,'CANCELLATION',explanation,o.id,auth.uid());
 end loop;
 update public.orders set status='CANCELLED' where id=o.id;
 delete from public.coupon_usage where "orderId"=o.id;
 insert into public.order_status_history("orderId",status,note,"actorId") values(o.id,'CANCELLED',explanation,auth.uid());
 insert into public.notifications("customerId",title,message,"linkUrl") values(o."customerId",'Order cancelled',explanation,'/account/orders/'||o.id);
 perform private.notify('cancelledOrder','Order cancelled',o."orderNumber"||': '||explanation,'VIEW_ORDERS','/admin/orders?view='||o.id);
end; $$;
create function public.expire_orders() returns integer language plpgsql security definer set search_path = '' as $$
declare o record; n integer=0;
begin
 for o in select id from public.orders where status='PENDING' and "expiresAt"<now() order by id for update skip locked loop
  perform private.release_order(o.id,'Payment reservation expired'); n=n+1;
 end loop;
 return n;
end; $$;
revoke execute on function public.expire_orders() from public,anon,authenticated;
grant execute on function public.expire_orders() to service_role;

create function public.create_checkout(payload jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid=auth.uid(); cart_id uuid; o public.orders; z public.shipping_zones; c public.coupons;
 cfg jsonb; general jsonb; ship jsonb; addr jsonb=payload->'shippingAddress'; it record; sub numeric=0; discount numeric=0; fee numeric;
 oid uuid=gen_random_uuid(); item_price numeric; n integer=0; line jsonb; lines jsonb='[]'; existing uuid; v integer; threshold numeric;
begin
 if uid is null or not public.is_customer() then raise exception 'Please sign in to checkout' using errcode='42501'; end if;
 -- Per-customer serialization ensures retry and cart mutation cannot create duplicate orders.
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select id into existing from public.orders where "customerId"=uid and "idempotencyKey"=(payload->>'idempotencyKey')::uuid;
 if existing is not null then return (select to_jsonb(x.*) from public.orders x where id=existing); end if;
 select values into cfg from public.store_settings where section='orders';
 select values into general from public.store_settings where section='general';
 select values into ship from public.store_settings where section='shipping';
 if general->>'status'<>'ACTIVE' then raise exception 'Store checkout is paused'; end if;
 if general->>'currency'<>'NGN' then raise exception 'Checkout supports NGN only'; end if;
 foreach line in array array[addr] loop
  if jsonb_typeof(line)<>'object' then raise exception 'Delivery address required'; end if;
 end loop;
 if exists(select 1 from unnest(array['recipient','phoneNumber','street','city','state','country']) k where length(trim(coalesce(addr->>k,''))) not between 1 and 500) then raise exception 'Complete your delivery address'; end if;
 select * into strict z from public.shipping_zones where id=(payload->>'deliveryZoneId')::uuid and "isActive";
 if lower(z.country)<>lower(addr->>'country') or not exists(select 1 from unnest(z.states) s where lower(s)=lower(addr->>'state')) then raise exception 'Delivery zone does not match address'; end if;
 insert into public.carts("customerId") values(uid) on conflict("customerId") do nothing;
 select id into cart_id from public.carts where "customerId"=uid for update;
 -- Lock variants/products against price changes, then inventory in deterministic order.
 for it in select ci.quantity,ci."variantId",p.id as product_id,p.name,p.price,v.sku,v.size,v.color,v."priceDiff",p."isActive" as published,p."archivedAt",v."isActive" as enabled
  from public.cart_items ci join public.product_variants v on v.id=ci."variantId" join public.products p on p.id=v."productId"
  where ci."cartId"=cart_id order by ci."variantId" for share of ci,v,p loop
  n=n+1;
  if not it.published or not it.enabled or it."archivedAt" is not null then raise exception 'An item is no longer available'; end if;
  select quantity-reserved into v from public.inventory where "variantId"=it."variantId" for update;
  if v is null or v<it.quantity then raise exception 'Insufficient stock for % / % / %',it.name,it.size,it.color; end if;
  item_price=it.price+it."priceDiff";
  if item_price<0 then raise exception 'Invalid variant price'; end if;
  select greatest(0,item_price-coalesce(max(case when d."discountType"='PERCENTAGE' then round(item_price*d.value/100,2) else d.value end),0)) into item_price
   from public.discounts d where d."productId"=it.product_id and d."isActive" and (d."startsAt" is null or d."startsAt"<=now()) and (d."expiresAt" is null or d."expiresAt">now());
  if item_price<0 then raise exception 'Invalid variant price'; end if;
  sub=sub+item_price*it.quantity;
  lines=lines||jsonb_build_array(jsonb_build_object('variantId',it."variantId",'productId',it.product_id,'productName',it.name,'sku',it.sku,'size',it.size,'color',it.color,'quantity',it.quantity,'unitPrice',item_price));
 end loop;
 if n=0 then raise exception 'Your cart is empty'; end if;
 if coalesce(payload->>'couponCode','')<>'' then
  select * into c from public.coupons where code=upper(trim(payload->>'couponCode')) for update;
  if c.id is null or not c."isActive" or c."startsAt">now() or c."expiresAt"<=now() or sub<c."minSpend" then raise exception 'Coupon is not valid for this order'; end if;
  if c."usageLimit" is not null and (select count(*) from public.coupon_usage where "couponId"=c.id)>=c."usageLimit" then raise exception 'Coupon usage limit reached'; end if;
  if (select count(*) from public.coupon_usage where "couponId"=c.id and "customerId"=uid)>=c."perCustomerLimit" then raise exception 'You have already used this coupon'; end if;
  discount=case when c."discountType"='PERCENTAGE' then round(sub*c.value/100,2) else c.value end;
  discount=least(sub,discount,coalesce(c."maxDiscount",sub));
 end if;
 threshold=coalesce(z."freeDeliveryThreshold",(ship->>'freeDeliveryThreshold')::numeric);
 fee=case when threshold is not null and sub-discount>=threshold then 0 else z.fee end;
 if sub-discount+fee<=0 then raise exception 'This checkout requires a positive total. Contact NOBELLE for fully discounted orders.'; end if;
 insert into public.orders(id,"customerId","orderNumber","idempotencyKey",subtotal,"discountTotal","deliveryFee","totalAmount",currency,"deliveryZoneId","expiresAt","settingsSnapshot")
 values(oid,uid,coalesce(cfg->>'prefix','NBL-')||upper(replace(oid::text,'-','')),(payload->>'idempotencyKey')::uuid,sub,discount,fee,sub-discount+fee,'NGN',z.id,now()+make_interval(mins=>(cfg->>'cancellationPeriodMinutes')::integer),cfg) returning * into o;
 insert into public.shipping_addresses("orderId",recipient,"phoneNumber",street,city,state,country,"postalCode") values(oid,addr->>'recipient',addr->>'phoneNumber',addr->>'street',addr->>'city',addr->>'state',addr->>'country',addr->>'postalCode');
 for line in select value from jsonb_array_elements(lines) loop
  insert into public.order_items("orderId","productId","variantId","productName",sku,size,color,quantity,"unitPrice","totalPrice") values(oid,(line->>'productId')::uuid,(line->>'variantId')::uuid,line->>'productName',line->>'sku',line->>'size',line->>'color',(line->>'quantity')::integer,(line->>'unitPrice')::numeric,(line->>'unitPrice')::numeric*(line->>'quantity')::integer);
  update public.inventory set reserved=reserved+(line->>'quantity')::integer where "variantId"=(line->>'variantId')::uuid;
  insert into public.inventory_movements("variantId",delta,"reservedDelta",type,reason,"orderId","actorId") values((line->>'variantId')::uuid,0,(line->>'quantity')::integer,'RESERVATION','Checkout reservation',oid,uid);
 end loop;
 if c.id is not null then insert into public.coupon_usage("couponId","customerId","orderId") values(c.id,uid,oid); end if;
 delete from public.cart_items where "cartId"=cart_id;
 insert into public.order_status_history("orderId",status,"actorId") values(oid,'PENDING',uid);
 perform private.notify('newOrder','New order',o."orderNumber",'VIEW_ORDERS','/admin/orders?view='||oid);
 return to_jsonb(o);
end; $$;

create function public.cancel_order(order_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
 select * into strict o from public.orders where id=order_id for update;
 if not public.has_permission('CANCEL_ORDERS') and not (o."customerId"=auth.uid() and public.is_customer() and (o."settingsSnapshot"->>'allowCancellation')::boolean and o."expiresAt">now()) then raise exception 'Cancellation not permitted' using errcode='42501'; end if;
 if o.status<>'PENDING' or o."stockCommitted" then raise exception 'Only unpaid pending orders can be cancelled'; end if;
 perform private.release_order(order_id,'Cancelled by customer or staff');
end; $$;

create function public.transition_order(order_id uuid, next_status text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
 if next_status='CANCELLED' then perform public.cancel_order(order_id); return (select to_jsonb(x.*) from public.orders x where id=order_id); end if;
 perform private.require_permission('UPDATE_ORDERS');
 select * into strict o from public.orders where id=order_id for update;
 if o."paymentStatus"<>'SUCCESS' then raise exception 'Payment must be verified before fulfilment'; end if;
 if not ((o.status='PENDING' and next_status='CONFIRMED') or (o.status='CONFIRMED' and next_status='PROCESSING') or (o.status='PROCESSING' and next_status='SHIPPED') or (o.status='SHIPPED' and next_status='DELIVERED')) then raise exception 'Invalid order status transition'; end if;
 update public.orders set status=next_status,"deliveredAt"=case when next_status='DELIVERED' then now() else "deliveredAt" end where id=order_id returning * into o;
 insert into public.order_status_history("orderId",status,"actorId") values(order_id,next_status,auth.uid());
 insert into public.notifications("customerId",title,message,"linkUrl") values(o."customerId",'Order update',o."orderNumber"||': '||next_status,'/account/orders/'||o.id);
 return to_jsonb(o);
end; $$;

create function public.save_shipment(order_id uuid, carrier_name text, tracking_number text) returns void language plpgsql security definer set search_path = '' as $$
begin
 perform private.require_permission('UPDATE_ORDERS');
 if length(trim(carrier_name))=0 or length(trim(tracking_number))=0 then raise exception 'Carrier and tracking number required'; end if;
 if not exists(select 1 from public.orders where id=order_id and status in ('PROCESSING','SHIPPED')) then raise exception 'Order is not ready for shipping'; end if;
 insert into public.shipments("orderId",carrier,"trackingNumber") values(order_id,carrier_name,tracking_number) on conflict("orderId") do update set carrier=excluded.carrier,"trackingNumber"=excluded."trackingNumber";
end; $$;

-- Service-role only: the Edge Function verifies Paystack, including exact amount,
-- currency, reference, gateway ID and test/live domain before invoking this.
create function public.settle_payment(payment_reference text, gateway_id text, amount_minor bigint, payment_currency text, gateway_mode text, successful boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.payments; o public.orders; i record;
begin
 -- Lock order first everywhere to avoid cancellation/webhook lock inversion.
 select o1.* into strict o from public.orders o1 join public.payments p1 on p1."orderId"=o1.id where p1.reference=payment_reference for update of o1;
 select * into strict p from public.payments where reference=payment_reference for update;
 if round(p.amount*100)::bigint<>amount_minor or p.currency<>payment_currency or p.mode<>gateway_mode then raise exception 'Payment amount, currency or mode mismatch'; end if;
 if p.status in ('SUCCESS','REFUNDED') then return to_jsonb(p); end if;
 if successful and (o.status='CANCELLED' or o."expiresAt"<now()) then
  -- Preserve funds received after expiry as a verified payment requiring staff refund.
  update public.payments set status='SUCCESS',"gatewayId"=gateway_id where id=p.id returning * into p;
  insert into public.payment_transactions("paymentId","eventId",status,amount) values(p.id,'charge:'||gateway_id,'SUCCESS',p.amount) on conflict("eventId") do nothing;
  perform private.release_order(o.id,'Late payment received; staff refund required');
  perform private.notify('successfulPayment','Late payment requires refund',o."orderNumber",'PROCESS_REFUNDS','/admin/payments');
  return to_jsonb(p);
 end if;
 if successful then
  for i in select * from public.order_items where "orderId"=o.id order by "variantId" loop
   update public.inventory set quantity=quantity-i.quantity,reserved=reserved-i.quantity where "variantId"=i."variantId";
   update public.products set "soldCount"="soldCount"+i.quantity where id=i."productId";
   insert into public.inventory_movements("variantId",delta,"reservedDelta",type,reason,"orderId") values(i."variantId",-i.quantity,-i.quantity,'SALE','Verified Paystack payment',o.id);
  end loop;
  update public.orders set "paymentStatus"='SUCCESS',"stockCommitted"=true,"paidAt"=now(),status=case when "settingsSnapshot"->>'confirmation'='AUTOMATIC' then 'CONFIRMED' else 'PENDING' end where id=o.id returning * into o;
  insert into public.order_status_history("orderId",status,note) values(o.id,o.status,'Payment verified');
  update public.payments set status='SUCCESS',"gatewayId"=gateway_id where id=p.id returning * into p;
  perform private.notify('successfulPayment','Payment received',o."orderNumber",'VIEW_PAYMENTS','/admin/payments');
 else
  update public.payments set status='FAILED',"gatewayId"=gateway_id where id=p.id returning * into p;
  update public.orders set "paymentStatus"='FAILED' where id=o.id;
  perform private.release_order(o.id,'Payment failed');
  perform private.notify('failedPayment','Payment failed',o."orderNumber",'VIEW_PAYMENTS','/admin/payments');
 end if;
 insert into public.payment_transactions("paymentId","eventId",status,amount) values(p.id,'charge:'||gateway_id||':'||p.status,p.status,p.amount) on conflict("eventId") do nothing;
 insert into public.notifications("customerId",title,message,"linkUrl") values(o."customerId",'Payment update',o."orderNumber"||': '||p.status,'/account/orders/'||o.id);
 return to_jsonb(p);
end; $$;
revoke execute on function public.settle_payment(text,text,bigint,text,text,boolean) from public,anon,authenticated;
grant execute on function public.settle_payment(text,text,bigint,text,text,boolean) to service_role;

create function public.request_return(payload jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; ri jsonb; oi public.order_items; rid uuid; prior integer; result jsonb;
begin
 select * into strict o from public.orders where id=(payload->>'orderId')::uuid for update;
 if o."customerId"<>auth.uid() or not public.is_customer() or o.status<>'DELIVERED' then raise exception 'Return not permitted' using errcode='42501'; end if;
 if (o."settingsSnapshot"->>'returnPeriodDays')::integer=0 or o."deliveredAt"+make_interval(days=>(o."settingsSnapshot"->>'returnPeriodDays')::integer)<now() then raise exception 'Return period has ended'; end if;
 if jsonb_array_length(payload->'items')<1 then raise exception 'Select return items'; end if;
 insert into public.returns("orderId","customerId",reason) values(o.id,auth.uid(),payload->>'reason') returning id into rid;
 for ri in select value from jsonb_array_elements(payload->'items') loop
  select * into strict oi from public.order_items where id=(ri->>'orderItemId')::uuid and "orderId"=o.id;
  select coalesce(sum(i.quantity),0) into prior from public.return_items i join public.returns r on r.id=i."returnId" where i."orderItemId"=oi.id and r.status<>'REJECTED';
  if (ri->>'quantity')::integer+prior>oi.quantity then raise exception 'Return exceeds purchased quantity'; end if;
  insert into public.return_items("returnId","orderItemId",quantity) values(rid,oi.id,(ri->>'quantity')::integer);
 end loop;
 perform private.notify('returnRequest','Return requested',o."orderNumber",'VIEW_ORDERS','/admin/returns');
 return (select to_jsonb(r.*) from public.returns r where id=rid);
end; $$;
create function public.transition_return(return_id uuid, next_status text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.returns;
begin
 perform private.require_permission('UPDATE_ORDERS'); select * into strict r from public.returns where id=return_id for update;
 if not ((r.status='REQUESTED' and next_status in ('UNDER_REVIEW','APPROVED','REJECTED')) or (r.status='UNDER_REVIEW' and next_status in ('APPROVED','REJECTED')) or (r.status='APPROVED' and next_status='RECEIVED') or (r.status='REFUNDED' and next_status='COMPLETED')) then raise exception 'Invalid return transition'; end if;
 update public.returns set status=next_status where id=return_id returning * into r; return to_jsonb(r);
end; $$;

create function public.prepare_refund(return_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.returns; o public.orders; p public.payments; amount numeric; ref public.refunds;
begin
 perform private.require_permission('PROCESS_REFUNDS');
 select * into strict r from public.returns where id=return_id for update;
 select * into strict o from public.orders where id=r."orderId" for update;
 if r.status not in ('RECEIVED','REFUNDED') or o."settingsSnapshot"->>'refundRule'='DISABLED' then raise exception 'Return must be received and refunds enabled'; end if;
 select * into strict p from public.payments where "orderId"=o.id and status='SUCCESS' for update;
 select round(sum(i.quantity*oi."unitPrice")*(o.subtotal-o."discountTotal")/nullif(o.subtotal,0),2) into amount from public.return_items i join public.order_items oi on oi.id=i."orderItemId" where i."returnId"=r.id;
 amount=least(amount,o.subtotal-o."discountTotal"-coalesce((select sum(f.amount) from public.refunds f where f."paymentId"=p.id and f."returnId"<>r.id),0));
 if amount is null or amount<=0 then raise exception 'Invalid refund total'; end if;
 insert into public.refunds("returnId","paymentId",amount) values(r.id,p.id,amount) on conflict("returnId") do nothing;
 select * into strict ref from public.refunds where "returnId"=r.id;
 return to_jsonb(ref)||jsonb_build_object('reference',p.reference);
end; $$;
create function public.settle_refund(refund_id uuid, gateway_id text, refund_status text) returns void language plpgsql security definer set search_path = '' as $$
declare ref public.refunds; r public.returns; p public.payments; item record;
begin
 select * into strict ref from public.refunds where id=refund_id for update;
 if ref.status='SUCCESS' then return; end if;
 if refund_status not in ('PENDING','FAILED','SUCCESS') then raise exception 'Invalid refund status'; end if;
 update public.refunds set status=refund_status,"gatewayId"=gateway_id where id=ref.id;
 if refund_status<>'SUCCESS' then return; end if;
 select * into strict r from public.returns where id=ref."returnId" for update;
 select * into strict p from public.payments where id=ref."paymentId" for update;
 for item in select i.quantity,oi."variantId" from public.return_items i join public.order_items oi on oi.id=i."orderItemId" where i."returnId"=r.id order by oi."variantId" loop
  update public.inventory set quantity=quantity+item.quantity where "variantId"=item."variantId";
  update public.products set "soldCount"=greatest(0,"soldCount"-item.quantity) where id=(select "productId" from public.product_variants where id=item."variantId");
  insert into public.inventory_movements("variantId",delta,type,reason,"orderId") values(item."variantId",item.quantity,'RETURN','Verified refund for received goods',r."orderId");
 end loop;
 update public.refunds set "restockedAt"=now() where id=ref.id;
 update public.returns set status='REFUNDED' where id=r.id;
 if not exists(select 1 from public.order_items oi where oi."orderId"=r."orderId" and oi.quantity>(select coalesce(sum(ri.quantity),0) from public.return_items ri join public.returns rr on rr.id=ri."returnId" where ri."orderItemId"=oi.id and rr.status in ('REFUNDED','COMPLETED'))) then
  update public.orders set status='REFUNDED',"paymentStatus"='REFUNDED' where id=r."orderId";
  update public.payments set status='REFUNDED' where id=p.id;
  insert into public.order_status_history("orderId",status,note) values(r."orderId",'REFUNDED','All purchased items refunded');
 end if;
 insert into public.notifications("customerId",title,message,"linkUrl") values(r."customerId",'Refund completed','Your returned items have been refunded.','/account/orders/'||r."orderId");
end; $$;
revoke execute on function public.settle_refund(uuid,text,text) from public,anon,authenticated;
grant execute on function public.settle_refund(uuid,text,text) to service_role;

-- Optional managed cron is installed separately (see SETUP.md); checkout also expires
-- old reservations via the service Edge Function before creating a new order.
