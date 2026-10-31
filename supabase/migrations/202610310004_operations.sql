create function public.admin_write(resource text, record_id uuid, payload jsonb, operation text default 'PATCH') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare tbl text; perm text; cols text; vals text; assignments text; result jsonb; clean jsonb; k text; item jsonb; vid uuid;
begin
 tbl=case resource when 'categories' then 'product_categories' when 'collections' then 'product_collections'
 when 'products' then 'products' when 'images' then 'product_images' when 'variants' then 'product_variants'
 when 'coupons' then 'coupons' when 'discounts' then 'discounts' when 'delivery-zones' then 'shipping_zones'
 when 'shipping-rates' then 'shipping_rates' when 'homepage-sections' then 'homepage_sections' when 'banners' then 'banners'
 when 'messages' then 'contact_messages' when 'reviews' then 'product_reviews' when 'customers' then 'profiles'
 when 'sizes' then 'product_sizes' when 'colours' then 'product_colours' end;
 if tbl is null then raise exception 'Unknown management resource'; end if;
 perm=case when tbl in ('product_categories','product_collections','products','product_images','product_variants','product_sizes','product_colours') then
 case when operation='DELETE' then 'DELETE_PRODUCTS' when operation='POST' and tbl='products' then 'CREATE_PRODUCTS' else 'EDIT_PRODUCTS' end
 when tbl in ('coupons','discounts') then 'MANAGE_PROMOTIONS'
 when tbl in ('shipping_zones','shipping_rates') then 'MANAGE_SETTINGS'
 when tbl in ('homepage_sections','banners') then 'MANAGE_WEBSITE'
 when tbl='contact_messages' then 'VIEW_CUSTOMERS' when tbl='profiles' then 'MANAGE_CUSTOMERS' else 'EDIT_PRODUCTS' end;
 perform private.require_permission(perm);
 if operation not in ('POST','PATCH','DELETE') then raise exception 'Unsupported operation'; end if;
 if operation='DELETE' then
  if tbl='products' then update public.products set "isActive"=false,"archivedAt"=now() where id=record_id returning to_jsonb(products.*) into result;
  elsif tbl in ('product_categories','product_collections','shipping_zones','coupons','homepage_sections','banners','discounts') then
   execute format('update public.%I set "isActive"=false where id=$1 returning to_jsonb(%I.*)',tbl,tbl) into result using record_id;
  elsif tbl='contact_messages' then update public.contact_messages set status='ARCHIVED' where id=record_id returning to_jsonb(contact_messages.*) into result;
  elsif tbl in ('product_images','product_reviews') then execute format('delete from public.%I where id=$1 returning to_jsonb(%I.*)',tbl,tbl) into result using record_id;
  else raise exception 'Archive this record instead'; end if;
 else
  clean=payload - array['id','createdAt','updatedAt','archivedAt','soldCount','variants','collectionIds','quantity'];
  if tbl in ('products','product_categories','product_collections') and clean ? 'name' then
   clean=clean||jsonb_build_object('slug',trim(both '-' from regexp_replace(lower(clean->>'name'),'[^a-z0-9]+','-','g'))||case when tbl='products' then '-'||left(coalesce(record_id,gen_random_uuid())::text,8) else '' end);
  end if;
  if tbl in ('products','product_variants') and coalesce(clean->>'sku','')='' then clean=clean||jsonb_build_object('sku','NBL-'||gen_random_uuid()::text); end if;
  if tbl='coupons' and clean ? 'code' then clean=clean||jsonb_build_object('code',upper(clean->>'code')); end if;
  if tbl='profiles' then
   if exists(select 1 from public.admin_roles where "userId"=record_id) then raise exception 'Manage staff in permissions'; end if;
   clean=jsonb_build_object('isActive',(payload->>'isActive')::boolean);
  end if;
  if tbl='product_reviews' then clean=jsonb_build_object('isApproved',(payload->>'isApproved')::boolean); end if;
  if tbl='contact_messages' then clean=payload-array['name','email','subject','message','id','createdAt','updatedAt']; end if;
  if tbl='product_variants' and operation='PATCH' then clean=clean-'productId'; end if;
  if tbl='product_images' and operation='PATCH' then clean=clean-array['productId','path','url']; end if;
  select string_agg(format('%I',c.column_name),','), string_agg(format('(jsonb_populate_record(null::public.%I,$1)).%I',tbl,c.column_name),','),
   string_agg(format('%I=(jsonb_populate_record(null::public.%I,$1)).%I',c.column_name,tbl,c.column_name),',')
   into cols,vals,assignments from information_schema.columns c where c.table_schema='public' and c.table_name=tbl and clean ? c.column_name;
  if cols is null then raise exception 'No editable fields'; end if;
  if operation='POST' then
   execute format('insert into public.%I (%s) select %s returning to_jsonb(%I.*)',tbl,cols,vals,tbl) into result using clean;
  else
   execute format('update public.%I set %s where id=$2 returning to_jsonb(%I.*)',tbl,assignments,tbl) into result using clean,record_id;
  end if;
  if tbl='products' and result is not null then
   if payload ? 'collectionIds' then
    delete from public.product_collection_links where "productId"=(result->>'id')::uuid;
    insert into public.product_collection_links("productId","collectionId") select (result->>'id')::uuid,value::uuid from jsonb_array_elements_text(payload->'collectionIds');
   end if;
   if operation='POST' then
    for item in select value from jsonb_array_elements(coalesce(payload->'variants','[]')) loop
     insert into public.product_variants("productId",sku,size,color,"priceDiff") values((result->>'id')::uuid,coalesce(nullif(item->>'sku',''),'NBL-'||gen_random_uuid()::text),item->>'size',item->>'color',coalesce((item->>'priceDiff')::numeric,0)) returning id into vid;
     insert into public.inventory("variantId",quantity,"lowStockThreshold") values(vid,coalesce((item->>'quantity')::integer,0),coalesce((select (values->>'lowStockThreshold')::integer from public.store_settings where section='products'),5));
     insert into public.inventory_movements("variantId",delta,type,reason,"actorId") values(vid,coalesce((item->>'quantity')::integer,0),'RESTOCK','Initial stock',auth.uid());
    end loop;
   end if;
  elsif tbl='product_variants' and operation='POST' then
   insert into public.inventory("variantId",quantity,"lowStockThreshold") values((result->>'id')::uuid,coalesce((payload->>'quantity')::integer,0),coalesce((select (values->>'lowStockThreshold')::integer from public.store_settings where section='products'),5));
   insert into public.inventory_movements("variantId",delta,type,reason,"actorId") values((result->>'id')::uuid,coalesce((payload->>'quantity')::integer,0),'RESTOCK','Initial stock',auth.uid());
  end if;
 end if;
 if result is null then raise exception 'Record not found' using errcode='P0002'; end if;
 insert into public.activity_logs("adminId",action,entity,"entityId") values(auth.uid(),operation,tbl,result->>'id');
 return result;
end; $$;

create function public.adjust_inventory(variant_id uuid, new_quantity integer, note text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare old public.inventory; result jsonb;
begin
 perform private.require_permission('MANAGE_INVENTORY');
 if length(trim(note))<1 then raise exception 'A stock adjustment reason is required'; end if;
 select * into strict old from public.inventory where "variantId"=variant_id for update;
 if new_quantity<old.reserved then raise exception 'Quantity cannot be less than reserved stock'; end if;
 update public.inventory set quantity=new_quantity where "variantId"=variant_id returning to_jsonb(inventory.*) into result;
 insert into public.inventory_movements("variantId",delta,type,reason,"actorId") values(variant_id,new_quantity-old.quantity,'ADJUSTMENT',note,auth.uid());
 return result;
end; $$;

create function public.save_content(content_slug text, content_data jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
 perform private.require_permission('MANAGE_WEBSITE');
 if content_slug not in ('homepage','about','contact') then raise exception 'Unknown content section'; end if;
 insert into public.website_settings(slug,data) values(content_slug,content_data) on conflict(slug) do update set data=excluded.data;
 if content_slug='homepage' and content_data ? 'featuredProductIds' then
  delete from public.featured_products;
  insert into public.featured_products("productId","sortOrder") select value::uuid,ordinality::integer from jsonb_array_elements_text(content_data->'featuredProductIds') with ordinality;
 end if;
 return content_data;
end; $$;

create function public.save_settings(setting_section text, setting_values jsonb, expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb; item jsonb; role_name text; permission_name text; old public.store_settings;
begin
 if setting_section='permissions' then
  if not public.has_permission('MANAGE_STAFF') or not exists(select 1 from public.admin_roles where "userId"=auth.uid() and role='SUPER_ADMIN' and "isActive") then raise exception 'Super Admin required' using errcode='42501'; end if;
  delete from public.staff_permissions;
  for role_name,item in select key,value from jsonb_each(setting_values->'roles') loop
   if role_name not in ('SUPER_ADMIN','MANAGER','ORDER_MANAGER','INVENTORY_MANAGER','MARKETING_MANAGER','SUPPORT') then raise exception 'Invalid role'; end if;
   for permission_name in select jsonb_array_elements_text(item) loop
    insert into public.staff_permissions(role,permission) values(role_name,permission_name) on conflict do nothing;
   end loop;
  end loop;
  return setting_values;
 end if;
 perform private.require_permission('MANAGE_SETTINGS');
 select * into strict old from public.store_settings where section=setting_section for update;
 if old.version is distinct from expected_version then raise exception 'Settings changed in another session. Reload before saving.'; end if;
 if setting_section='general' then
  if coalesce(setting_values->>'storeName','')='' then raise exception 'Store name is required'; end if;
  if setting_values->>'currency'<>old.values->>'currency' and exists(select 1 from public.orders) then raise exception 'Currency is locked after the first order'; end if;
  if setting_values->>'currency'<>'NGN' then raise exception 'This checkout currently supports NGN only'; end if;
 end if;
 if setting_section='orders' then
  if (setting_values->>'cancellationPeriodMinutes')::integer not between 1 and 10080 or (setting_values->>'returnPeriodDays')::integer not between 0 and 365 then raise exception 'Invalid order periods'; end if;
  -- A single, consistent stock lifecycle: reserve at checkout, deduct after verification.
  if setting_values->>'stockDeduction'<>'PAYMENT' then raise exception 'Inventory deduction is supported after verified payment'; end if;
 end if;
 if setting_section='products' then
  if (setting_values->>'allowOutOfStockPurchases')::boolean then raise exception 'Backorders are not supported; stock is reserved atomically'; end if;
  if jsonb_array_length(setting_values->'sizes')<1 then raise exception 'At least one size is required'; end if;
  delete from public.product_sizes;
  insert into public.product_sizes(name,"sortOrder") select value,ordinality::integer from jsonb_array_elements_text(setting_values->'sizes') with ordinality;
  delete from public.product_colours;
  insert into public.product_colours(name,hex,active) select value->>'name',value->>'hex',(value->>'active')::boolean from jsonb_array_elements(setting_values->'colours');
 end if;
 update public.store_settings set values=setting_values,version=version+1 where section=setting_section returning values into result;
 insert into public.activity_logs("adminId",action,entity,"entityId") values(auth.uid(),'UPDATE','store_settings',setting_section);
 return result;
end; $$;

create function public.published_policy(policy_id text) returns jsonb language sql stable security definer set search_path = '' as $$
 select published from public.policies where id=policy_id and published is not null; $$;
create function public.save_policy(policy_id text, payload jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb; old public.policies;
begin
 perform private.require_permission('MANAGE_SETTINGS');
 select * into strict old from public.policies where id=policy_id for update;
 if payload ? 'version' and payload->>'version' is distinct from old."updatedAt"::text and (payload->>'version')::timestamptz is distinct from old."updatedAt" then raise exception 'Policy changed. Reload before saving.'; end if;
 if payload->>'status'='PUBLISHED' and length(trim(regexp_replace(payload->>'content','<[^>]+>','','g')))=0 then raise exception 'Add policy content'; end if;
 update public.policies set title=payload->>'title',content=payload->>'content',status=payload->>'status',
 published=case when payload->>'status'='PUBLISHED' then jsonb_build_object('title',payload->>'title','content',payload->>'content','lastUpdated',now()) else published end
 where id=policy_id returning to_jsonb(policies.*) into result;
 return result;
end; $$;

create function private.notify(event_type text, heading text, detail text, required_permission text, link text default null) returns void language plpgsql security definer set search_path = '' as $$
begin
 if coalesce((select (values->event_type->>'dashboard')::boolean from public.store_settings where section='notifications'),true) then
  insert into public.admin_notifications(type,title,message,permission,"linkUrl") values(event_type,heading,detail,required_permission,link);
 end if;
end; $$;
create function private.stock_alert() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if coalesce((select (values->>'lowStockNotifications')::boolean from public.store_settings where section='products'),true) and new.quantity-new.reserved<=new."lowStockThreshold" and (tg_op='INSERT' or old.quantity-old.reserved>new.quantity-new.reserved) then
  perform private.notify(case when new.quantity=new.reserved then 'outOfStock' else 'lowStock' end,'Inventory alert',new."variantId"::text||': '||(new.quantity-new.reserved)||' available','MANAGE_INVENTORY','/admin/inventory');
 end if;
 return new;
end; $$;
create trigger stock_alert after insert or update on public.inventory for each row execute function private.stock_alert();

create function public.submit_review(product_id uuid, stars integer, review_text text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 if not public.is_customer() or not exists(select 1 from public.orders o join public.order_items i on i."orderId"=o.id where o."customerId"=auth.uid() and o.status='DELIVERED' and i."productId"=product_id) then raise exception 'Only customers with a delivered purchase can review' using errcode='42501'; end if;
 insert into public.product_reviews("productId","customerId",rating,comment) values(product_id,auth.uid(),stars,review_text) returning to_jsonb(product_reviews.*) into result;
 return result;
end; $$;

-- Atomic limits used by the public Edge Function. Keys are HMAC hashes, never raw IPs.
create function public.consume_rate_limit(limit_key text, maximum integer, seconds integer) returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
 insert into private.rate_limits(key,hits) values(limit_key,1) on conflict(key) do update set
 hits=case when private.rate_limits.start_at<now()-make_interval(secs=>seconds) then 1 else private.rate_limits.hits+1 end,
 start_at=case when private.rate_limits.start_at<now()-make_interval(secs=>seconds) then now() else private.rate_limits.start_at end returning hits into n;
 return n<=maximum;
end; $$;
revoke execute on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
