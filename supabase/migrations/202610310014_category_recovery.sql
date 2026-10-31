-- Incremental repair after the baseline. No existing category/product rows are
-- deleted or rewritten by this migration. Keep the checked camelCase contract.
do $$ begin
 if to_regprocedure('public.has_permission(text)') is null or to_regprocedure('private.touch_updated_at()') is null or to_regprocedure('private.require_permission(text)') is null
 or to_regclass('public.products') is null or to_regclass('public.profiles') is null or to_regclass('public.admin_roles') is null
 or to_regclass('public.staff_permissions') is null or to_regclass('public.activity_logs') is null then
  raise exception 'Install the baseline NOBELLE migrations first. Use BOOTSTRAP.sql for a fresh/compatible project; category recovery cannot replace missing products, profiles or role tables.';
 end if;
end $$;
create table if not exists public.product_categories (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
 description text default '', "imageUrl" text, "isActive" boolean not null default true,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
-- Preserve legacy snake_case fields and dependencies. Copy only into new
-- compatibility columns, without replacing existing application values.
drop trigger if exists touch_updated_at on public.product_categories;
do $$
declare mapping record;
begin
 for mapping in select * from (values
  ('description','description','text','''''::text'),
  ('imageUrl','image_url','text','null::text'),
  ('isActive','is_active','boolean','true'),
  ('createdAt','created_at','timestamptz','now()'),
  ('updatedAt','updated_at','timestamptz','now()')
 ) fields(target,legacy,datatype,fallback) loop
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='product_categories' and column_name=mapping.target) then
   execute format('alter table public.product_categories add column %I %s',mapping.target,mapping.datatype);
   if mapping.legacy<>mapping.target and exists(select 1 from information_schema.columns where table_schema='public' and table_name='product_categories' and column_name=mapping.legacy) then
    execute format('update public.product_categories set %I=%I',mapping.target,mapping.legacy);
   else
    execute format('update public.product_categories set %I=%s',mapping.target,mapping.fallback);
   end if;
  end if;
 end loop;
end $$;
do $$
declare missing text[]; field text; attribute smallint;
begin
 select array_agg(required) into missing from unnest(array['id','name','slug','description','imageUrl','isActive','createdAt','updatedAt']) required
 where not exists(select 1 from information_schema.columns where table_schema='public' and table_name='product_categories' and column_name=required);
 if missing is not null then raise exception 'Category columns missing: %. Existing snake_case or other columns were not renamed. Review diagnostics.sql and their dependencies first.',array_to_string(missing,', '); end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='product_categories' and (
  column_name='id' and udt_name<>'uuid' or column_name='isActive' and udt_name<>'bool'
  or column_name in ('createdAt','updatedAt') and udt_name<>'timestamptz'
  or column_name in ('name','slug','description','imageUrl') and udt_name not in ('text','varchar'))) then
  raise exception 'Category column types differ from the checked application contract; no data was converted. Review diagnostics.sql.';
 end if;
 if exists(select 1 from public.product_categories where id is null or name is null or slug is null or "isActive" is null or "createdAt" is null or "updatedAt" is null)
 or exists(select 1 from public.product_categories group by id having count(*)>1)
 or exists(select 1 from public.product_categories group by name having count(*)>1)
 or exists(select 1 from public.product_categories group by slug having count(*)>1) then
  raise exception 'Existing categories contain null or duplicate keys. Resolve them explicitly; this migration does not delete or overwrite records.';
 end if;
 if exists(select 1 from pg_policies where schemaname='public' and tablename='product_categories' and policyname<>'published_categories') then
  raise exception 'Additional category policies require review before recovery; permissive public write policies must not be combined with the intended access rules.';
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public.product_categories'::regclass and contype='p') then alter table public.product_categories add primary key(id); end if;
 foreach field in array array['name','slug'] loop
  select attnum into attribute from pg_attribute where attrelid='public.product_categories'::regclass and attname=field;
  if not exists(select 1 from pg_index where indrelid='public.product_categories'::regclass and indisunique and indnkeyatts=1 and indkey[0]=attribute and indpred is null and indexprs is null) then
   execute format('create unique index %I on public.product_categories(%I)','nobelle_category_'||field||'_unique',field);
  end if;
 end loop;
end $$;
alter table public.product_categories alter column id set default gen_random_uuid();
alter table public.product_categories alter column name set not null;
alter table public.product_categories alter column slug set not null;
alter table public.product_categories alter column "isActive" set default true;
alter table public.product_categories alter column "isActive" set not null;
alter table public.product_categories alter column "createdAt" set default now();
alter table public.product_categories alter column "createdAt" set not null;
alter table public.product_categories alter column "updatedAt" set default now();
alter table public.product_categories alter column "updatedAt" set not null;
create index if not exists product_categories_visibility_created on public.product_categories("isActive","createdAt" desc);
create index if not exists "products_categoryId_idx" on public.products("categoryId");
-- Restore the relationship if an earlier category-table removal dropped the FK.
-- Orphan product references cause a transaction failure; products are never reset.
do $$ declare relation record; begin
 if not exists(select 1 from pg_constraint c where c.conrelid='public.products'::regclass and c.contype='f'
  and c.confrelid='public.product_categories'::regclass
  and c.conkey=array[(select attnum from pg_attribute where attrelid=c.conrelid and attname='categoryId')]::smallint[]
  and c.confkey=array[(select attnum from pg_attribute where attrelid=c.confrelid and attname='id')]::smallint[]) then
  alter table public.products add constraint "products_categoryId_fkey" foreign key("categoryId") references public.product_categories(id);
 end if;
 if (select count(*) from pg_constraint where conrelid='public.products'::regclass and contype='f' and confrelid='public.product_categories'::regclass)>1 then
  raise exception 'Multiple product-to-category foreign keys make the current storefront embed ambiguous. Review the relationships before choosing a query hint; no constraints were removed.';
 end if;
 for relation in select conname from pg_constraint where conrelid='public.products'::regclass and contype='f' and confrelid='public.product_categories'::regclass and not convalidated loop
  execute format('alter table public.products validate constraint %I',relation.conname);
 end loop;
end $$;
alter table public.product_categories enable row level security;
revoke all on public.product_categories from public,anon,authenticated;
grant select on public.product_categories to anon,authenticated;
grant all on public.product_categories to service_role;
drop policy if exists published_categories on public.product_categories;
create policy published_categories on public.product_categories for select using("isActive" or public.has_permission('VIEW_PRODUCTS'));
drop trigger if exists touch_updated_at on public.product_categories;
create trigger touch_updated_at before update on public.product_categories for each row execute function private.touch_updated_at();

create or replace function public.manage_category(category_id uuid,payload jsonb,operation text default 'PATCH') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare category public.product_categories; next_name text; next_slug text; next_description text; next_image text; next_active boolean; result jsonb;
begin
 if operation not in ('POST','PATCH','DELETE') then raise exception 'Unsupported category operation'; end if;
 perform private.require_permission(case operation when 'POST' then 'CREATE_PRODUCTS' when 'DELETE' then 'DELETE_PRODUCTS' else 'EDIT_PRODUCTS' end);
 if payload is null or jsonb_typeof(payload)<>'object' then raise exception 'Category fields must be an object'; end if;
 if exists(select 1 from jsonb_object_keys(payload) field where field not in ('name','slug','description','imageUrl','isActive')) then raise exception 'Unsupported category field'; end if;
 if operation='POST' then
  if category_id is not null then raise exception 'New category IDs are generated by the database'; end if;
 else
  select * into category from public.product_categories where id=category_id for update;
  if not found then raise exception 'Category not found' using errcode='P0002'; end if;
 end if;
 if operation='DELETE' then
  if exists(select 1 from public.products where "categoryId"=category_id) then raise exception 'This category is used by products. Move those products to another category or deactivate this category first.'; end if;
  delete from public.product_categories where id=category_id;
  result=jsonb_build_object('id',category_id,'deleted',true);
 else
  next_name=case when payload ? 'name' then trim(payload->>'name') else category.name end;
  if next_name is null or length(next_name) not between 1 and 120 then raise exception 'Enter a category name between 1 and 120 characters'; end if;
  next_slug=case when payload ? 'slug' and nullif(trim(payload->>'slug'),'') is not null then lower(trim(payload->>'slug'))
   when operation='POST' then trim(both '-' from regexp_replace(lower(next_name),'[^a-z0-9]+','-','g')) else category.slug end;
  if next_slug is null or length(next_slug)>160 or next_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Use a slug containing lowercase letters, numbers and single hyphens'; end if;
  next_description=case when payload ? 'description' then coalesce(payload->>'description','') when operation='POST' then '' else category.description end;
  next_image=case when payload ? 'imageUrl' then nullif(trim(payload->>'imageUrl'),'') else category."imageUrl" end;
  if length(next_description)>5000 then raise exception 'Category descriptions must be at most 5000 characters'; end if;
  if next_image is not null and (length(next_image)>2000 or next_image !~ '^(https://|/[a-zA-Z0-9])') then raise exception 'Use an HTTPS or site-relative category image URL'; end if;
  if payload ? 'isActive' and jsonb_typeof(payload->'isActive')<>'boolean' then raise exception 'Category active status must be a boolean'; end if;
  next_active=case when payload ? 'isActive' then (payload->>'isActive')::boolean when operation='POST' then true else category."isActive" end;
  if operation='POST' then
   insert into public.product_categories(name,slug,description,"imageUrl","isActive") values(next_name,next_slug,next_description,next_image,next_active) returning * into category;
  else
   update public.product_categories set name=next_name,slug=next_slug,description=next_description,"imageUrl"=next_image,"isActive"=next_active where id=category_id returning * into category;
  end if;
  result=to_jsonb(category);
 end if;
 insert into public.activity_logs("adminId",action,entity,"entityId") values(auth.uid(),operation,'product_categories',result->>'id');
 return result;
end $$;
revoke execute on function public.manage_category(uuid,jsonb,text) from public,anon;
grant execute on function public.manage_category(uuid,jsonb,text) to authenticated;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='product_categories') then
  alter publication supabase_realtime add table public.product_categories;
 end if;
end $$;
notify pgrst, 'reload schema';
