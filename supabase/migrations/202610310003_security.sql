-- Public grants remain constrained by RLS. Financial writes use audited RPCs only.
do $$ declare target text; begin
 foreach target in array array['profiles','admin_roles','staff_permissions','customer_addresses','product_categories','product_collections','products','product_collection_links','product_images','product_sizes','product_colours','product_variants','inventory','inventory_movements','product_reviews','carts','cart_items','wishlists','wishlist_items','coupons','discounts','shipping_zones','shipping_rates','orders','shipping_addresses','order_items','order_status_history','shipments','coupon_usage','payments','payment_transactions','returns','return_items','refunds','website_settings','store_settings','homepage_sections','banners','featured_products','policies','admin_notifications','notifications','contact_messages','newsletter_subscribers','activity_logs'] loop
  execute format('revoke all on public.%I from public,anon,authenticated',target);
  execute format('grant all on public.%I to service_role',target);
  execute format('grant select on public.%I to anon,authenticated',target);
 end loop;
end $$;
grant usage on schema public to anon, authenticated;
-- Public grants above remain constrained by the table-specific RLS policies.
grant insert,update,delete on public.customer_addresses,public.carts,public.cart_items,public.wishlists,public.wishlist_items to authenticated;
grant update("firstName","lastName",name,phone,"avatarUrl") on public.profiles to authenticated;
grant update("isRead") on public.notifications,public.admin_notifications to authenticated;

create policy own_profile on public.profiles for select to authenticated using(id=auth.uid() or public.has_permission('VIEW_CUSTOMERS') or public.has_permission('MANAGE_STAFF'));
create policy edit_own_profile on public.profiles for update to authenticated using(id=auth.uid() and public.is_customer()) with check(id=auth.uid());
create policy own_role on public.admin_roles for select to authenticated using("userId"=auth.uid() or public.has_permission('MANAGE_STAFF'));
create policy role_permissions on public.staff_permissions for select to authenticated using(public.is_customer());
create policy own_addresses on public.customer_addresses for all to authenticated using(("customerId"=auth.uid() and public.is_customer()) or public.has_permission('VIEW_CUSTOMERS')) with check("customerId"=auth.uid() and public.is_customer());
create policy own_cart on public.carts for all to authenticated using("customerId"=auth.uid() and public.is_customer()) with check("customerId"=auth.uid() and public.is_customer());
create policy own_cart_items on public.cart_items for all to authenticated using(exists(select 1 from public.carts c where c.id="cartId" and c."customerId"=auth.uid() and public.is_customer())) with check(exists(select 1 from public.carts c where c.id="cartId" and c."customerId"=auth.uid() and public.is_customer()));
create policy own_wishlist on public.wishlists for all to authenticated using("customerId"=auth.uid() and public.is_customer()) with check("customerId"=auth.uid() and public.is_customer());
create policy own_wishlist_items on public.wishlist_items for all to authenticated using(exists(select 1 from public.wishlists w where w.id="wishlistId" and w."customerId"=auth.uid() and public.is_customer())) with check(exists(select 1 from public.wishlists w where w.id="wishlistId" and w."customerId"=auth.uid() and public.is_customer()));
create policy published_products on public.products for select using(("isActive" and "archivedAt" is null) or public.has_permission('VIEW_PRODUCTS'));
create policy published_categories on public.product_categories for select using("isActive" or public.has_permission('VIEW_PRODUCTS'));
create policy published_collections on public.product_collections for select using("isActive" or public.has_permission('VIEW_PRODUCTS'));
create policy visible_images on public.product_images for select using(exists(select 1 from public.products p where p.id="productId"));
create policy visible_variants on public.product_variants for select using(("isActive" or public.has_permission('VIEW_PRODUCTS')) and exists(select 1 from public.products p where p.id="productId"));
create policy visible_stock on public.inventory for select using(exists(select 1 from public.product_variants v where v.id="variantId"));
create policy visible_links on public.product_collection_links for select using(exists(select 1 from public.products p where p.id="productId"));
create policy sizes_public on public.product_sizes for select using(true);
create policy colours_public on public.product_colours for select using(active or public.has_permission('VIEW_PRODUCTS'));
create policy reviews_public on public.product_reviews for select using("isApproved" or "customerId"=auth.uid() or public.has_permission('EDIT_PRODUCTS'));
create policy own_orders on public.orders for select to authenticated using(("customerId"=auth.uid() and public.is_customer()) or public.has_permission('VIEW_ORDERS') or public.has_permission('VIEW_ANALYTICS'));
create policy own_order_items on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id="orderId"));
create policy own_shipping_address on public.shipping_addresses for select to authenticated using(exists(select 1 from public.orders o where o.id="orderId"));
create policy own_order_history on public.order_status_history for select to authenticated using(exists(select 1 from public.orders o where o.id="orderId"));
create policy own_shipments on public.shipments for select to authenticated using(exists(select 1 from public.orders o where o.id="orderId"));
create policy own_payments on public.payments for select to authenticated using(exists(select 1 from public.orders o where o.id="orderId" and o."customerId"=auth.uid() and public.is_customer()) or public.has_permission('VIEW_PAYMENTS'));
create policy payment_events on public.payment_transactions for select to authenticated using(public.has_permission('VIEW_PAYMENTS'));
create policy own_returns on public.returns for select to authenticated using(("customerId"=auth.uid() and public.is_customer()) or public.has_permission('VIEW_ORDERS'));
create policy own_return_items on public.return_items for select to authenticated using(exists(select 1 from public.returns r where r.id="returnId"));
create policy own_refunds on public.refunds for select to authenticated using(exists(select 1 from public.returns r where r.id="returnId" and r."customerId"=auth.uid() and public.is_customer()) or public.has_permission('PROCESS_REFUNDS'));
create policy own_coupon_usage on public.coupon_usage for select to authenticated using(("customerId"=auth.uid() and public.is_customer()) or public.has_permission('MANAGE_PROMOTIONS'));
create policy coupons_staff on public.coupons for select to authenticated using(public.has_permission('MANAGE_PROMOTIONS'));
create policy discounts_public on public.discounts for select using("isActive" or public.has_permission('MANAGE_PROMOTIONS'));
create policy inventory_history_staff on public.inventory_movements for select to authenticated using(public.has_permission('MANAGE_INVENTORY'));
create policy public_settings on public.store_settings for select using(section in ('general','store','payments','shipping','orders','products','website') or public.has_permission('MANAGE_SETTINGS'));
create policy published_content on public.website_settings for select using("isActive" or public.has_permission('MANAGE_WEBSITE'));
create policy published_sections on public.homepage_sections for select using("isActive" or public.has_permission('MANAGE_WEBSITE'));
create policy published_banners on public.banners for select using("isActive" or public.has_permission('MANAGE_WEBSITE'));
create policy public_featured on public.featured_products for select using(exists(select 1 from public.products p where p.id="productId"));
-- Policy drafts must never be exposed through table SELECT. Published content uses RPC.
create policy policy_staff on public.policies for select to authenticated using(public.has_permission('MANAGE_SETTINGS'));
create policy shipping_public on public.shipping_zones for select using("isActive" or public.has_permission('MANAGE_SETTINGS'));
create policy shipping_rates_public on public.shipping_rates for select using("isActive" or public.has_permission('MANAGE_SETTINGS'));
create policy allowed_admin_notifications on public.admin_notifications for select to authenticated using(public.has_permission(permission));
create policy read_admin_notifications on public.admin_notifications for update to authenticated using(public.has_permission(permission)) with check(public.has_permission(permission));
create policy own_notifications on public.notifications for select to authenticated using("customerId"=auth.uid() and public.is_customer());
create policy read_notifications on public.notifications for update to authenticated using("customerId"=auth.uid() and public.is_customer()) with check("customerId"=auth.uid());
create policy messages_staff on public.contact_messages for select to authenticated using(public.has_permission('VIEW_CUSTOMERS'));
create policy subscribers_staff on public.newsletter_subscribers for select to authenticated using(public.has_permission('MANAGE_PROMOTIONS'));
create policy audit_staff on public.activity_logs for select to authenticated using(public.has_permission('MANAGE_STAFF'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('store-assets','store-assets',true,5242880,array['image/jpeg','image/png','image/webp','image/x-icon','image/vnd.microsoft.icon']),
 ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists public_assets on storage.objects;
create policy public_assets on storage.objects for select using(bucket_id in ('product-images','store-assets','avatars'));
drop policy if exists staff_upload on storage.objects;
create policy staff_upload on storage.objects for insert to authenticated with check(
 (bucket_id='product-images' and public.has_permission('EDIT_PRODUCTS')) or
 (bucket_id='store-assets' and (public.has_permission('MANAGE_SETTINGS') or public.has_permission('MANAGE_WEBSITE'))) or
 (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text and public.is_customer()));
drop policy if exists staff_remove on storage.objects;
create policy staff_remove on storage.objects for delete to authenticated using(
 (bucket_id='product-images' and public.has_permission('EDIT_PRODUCTS')) or
 (bucket_id='store-assets' and public.has_permission('MANAGE_SETTINGS')) or
 (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text));

do $$ declare target text; begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach target in array array['products','product_images','inventory','orders','admin_notifications','notifications','store_settings','website_settings','homepage_sections','banners'] loop
   if to_regclass('public.'||target) is not null and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=target) then
    execute format('alter publication supabase_realtime add table public.%I',target);
   end if;
  end loop;
 end if;
end $$;
