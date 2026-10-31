-- Apply after the baseline migrations. This migration repairs a missing settings
-- table/version without modifying existing JSON values, IDs or customer data.
do $$ begin
 if to_regprocedure('public.has_permission(text)') is null or to_regprocedure('private.touch_updated_at()') is null
 or to_regprocedure('public.save_settings(text,jsonb,integer)') is null or to_regprocedure('private.session_valid()') is null
 or to_regclass('public.admin_roles') is null or to_regclass('public.staff_permissions') is null or to_regclass('public.profiles') is null then
  raise exception 'The baseline NOBELLE schema is not installed. Use BOOTSTRAP.sql for a fresh/compatible project or inspect diagnostics.sql before applying the baseline migrations.';
 end if;
end $$;

create table if not exists public.store_settings (
 id uuid primary key default gen_random_uuid(), section text not null unique,
 values jsonb not null, version integer not null default 1,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
do $$ begin
 if (select count(*) from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name in ('id','section','values'))<>3 then
  raise exception 'store_settings must have id, section and values columns. Resolve the naming mismatch shown by diagnostics.sql; no existing columns were renamed.';
 end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_settings' and (column_name='section' and udt_name not in ('text','varchar') or column_name='values' and udt_name<>'jsonb' or column_name='version' and udt_name<>'int4')) then
  raise exception 'store_settings column types do not match the application. Review diagnostics.sql before converting existing data.';
 end if;
 if exists(select 1 from public.store_settings where section is null or values is null or jsonb_typeof(values)<>'object') or exists(select 1 from public.store_settings group by section having count(*)>1) then
  raise exception 'Existing settings have null, duplicate or invalid values. Resolve these records explicitly; none have been deleted or overwritten.';
 end if;
 if exists(select 1 from pg_policies where schemaname='public' and tablename='store_settings' and policyname<>'public_settings') then
  raise exception 'Additional store_settings policies require review to avoid combining permissive access rules. Inspect diagnostics.sql first.';
 end if;
end $$;
alter table public.store_settings add column if not exists version integer not null default 1;
alter table public.store_settings add column if not exists "createdAt" timestamptz not null default now();
alter table public.store_settings add column if not exists "updatedAt" timestamptz not null default now();
do $$ begin
 if exists(select 1 from public.store_settings where version is null or version<1) then raise exception 'Existing settings versions are invalid; review them instead of overwriting revision history.'; end if;
end $$;
alter table public.store_settings alter column version set default 1;
alter table public.store_settings alter column version set not null;
alter table public.store_settings alter column section set not null;
alter table public.store_settings alter column values set not null;
do $$ begin
 if not exists(select 1 from pg_index i where i.indrelid='public.store_settings'::regclass and i.indisunique and i.indnkeyatts=1 and i.indpred is null and i.indexprs is null and i.indkey[0]=(select attnum from pg_attribute where attrelid=i.indrelid and attname='section')) then
  create unique index nobelle_settings_section_unique on public.store_settings(section);
 end if;
end $$;
alter table public.store_settings enable row level security;
revoke all on public.store_settings from public,anon,authenticated;
grant select on public.store_settings to anon,authenticated;
grant all on public.store_settings to service_role;
drop policy if exists public_settings on public.store_settings;
create policy public_settings on public.store_settings for select using(
 section in ('general','store','payments','shipping','orders','products','website') or public.has_permission('MANAGE_SETTINGS')
);
drop trigger if exists touch_updated_at on public.store_settings;
create trigger touch_updated_at before update on public.store_settings for each row execute function private.touch_updated_at();
-- Insert missing configuration sections only. Saved values and versions remain unchanged.
insert into public.store_settings(section,values) values ('general','{"storeName":"NOBELLE","currency":"NGN","timezone":"Africa/Lagos","language":"en","dateFormat":"DD/MM/YYYY","status":"ACTIVE","maintenanceMessage":"We are refreshing the NOBELLE store. Please check back soon."}'::jsonb) on conflict(section) do nothing;
insert into public.store_settings(section,values) values ('store','{"businessName":"NOBELLE","businessEmail":"","supportEmail":"","phone":"","whatsapp":"","address":"","city":"","state":"","country":"Nigeria","logoUrl":"","faviconUrl":"","instagram":"","facebook":"","tiktok":"","twitter":""}'::jsonb) on conflict(section) do nothing;
insert into public.store_settings(section,values) values ('payments','{"enabled":true,"card":true,"bankTransfer":true,"mode":"TEST","checkoutLabel":"Pay with Paystack (test mode)"}'::jsonb) on conflict(section) do nothing;
insert into public.store_settings(section,values) values ('shipping','{"defaultCountry":"Nigeria","freeDeliveryThreshold":null}'::jsonb) on conflict(section) do nothing;
insert into public.store_settings(section,values) values ('orders','{"prefix":"NBL-","confirmation":"MANUAL","allowCancellation":true,"cancellationPeriodMinutes":30,"returnPeriodDays":14,"refundRule":"RECEIVED_GOODS","invoicesEnabled":true,"orderNotifications":true,"stockDeduction":"PAYMENT"}'::jsonb) on conflict(section) do nothing;
insert into public.store_settings(section,values) values ('products','{"sizes":["XS","S","M","L","XL","XXL"],"colours":[],"lowStockThreshold":5,"lowStockNotifications":true,"outOfStockVisibility":"SHOW","allowOutOfStockPurchases":false,"automaticSku":false,"reviewsEnabled":true}'::jsonb) on conflict(section) do nothing;
insert into public.store_settings(section,values) values ('notifications','{"newOrder":{"dashboard":true,"email":false},"successfulPayment":{"dashboard":true,"email":false},"failedPayment":{"dashboard":true,"email":false},"cancelledOrder":{"dashboard":true,"email":false},"returnRequest":{"dashboard":true,"email":false},"refundRequest":{"dashboard":true,"email":false},"lowStock":{"dashboard":true,"email":false},"outOfStock":{"dashboard":true,"email":false},"newCustomer":{"dashboard":true,"email":false},"newProductReview":{"dashboard":true,"email":false}}'::jsonb) on conflict(section) do nothing;
insert into public.store_settings(section,values) values ('website','{"logoUrl":"","faviconUrl":"","announcementEnabled":false,"announcementText":"","footerText":"Modern Nigerian fashion for the contemporary African woman.","copyrightText":"NOBELLE. All rights reserved.","seoTitle":"NOBELLE","seoDescription":"","socialImage":""}'::jsonb) on conflict(section) do nothing;
notify pgrst, 'reload schema';
