import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const preflight = `
begin;
select pg_advisory_xact_lock(hashtextextended('nobelle-bootstrap',0));
-- This installer supports a fresh public schema, or compatible existing store_settings
-- and product_categories tables. It deliberately refuses unknown objects.
do $preflight$
declare existing text; column_type text; entry record; field record; defaults jsonb := __CONFIGURATION_DEFAULTS__;
begin
 select string_agg(c.relname,', ') into existing from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','f') and c.relname not in ('store_settings','product_categories');
 if existing is not null then raise exception 'Existing public tables require reconciliation first: %. Use diagnostics.sql and regular migrations; this bootstrap will not overwrite them.',existing; end if;
 select string_agg(p.proname,', ') into existing from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
 and p.proname not in ('has_permission','is_customer','admin_write','manage_category','save_settings','save_address','admin_report','admin_dashboard','admin_customer','admin_security_data','revoke_admin_session','claim_email_batch','expire_orders','create_checkout','product_popularity','save_policy','published_policy','save_content');
 if existing is not null then raise exception 'Existing public functions require review first: %',existing; end if;
 if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname not in ('public_assets','staff_upload','staff_remove')) then raise exception 'Existing Storage policies require review; bootstrap will not add policies alongside potentially conflicting access rules.'; end if;
 if exists(select 1 from storage.buckets where id in ('product-images','store-assets','avatars') and not public) then raise exception 'A reserved asset bucket is private. Review it before making any changes; bootstrap will not expose its files.'; end if;
 if to_regclass('public.product_categories') is not null then
  alter table public.product_categories add column if not exists "imageUrl" text;
  alter table public.product_categories add column if not exists image_url text;
  alter table public.product_categories add column if not exists "isActive" boolean not null default true;
  alter table public.product_categories add column if not exists is_active boolean not null default true;
  alter table public.product_categories add column if not exists "createdAt" timestamptz not null default now();
  alter table public.product_categories add column if not exists created_at timestamptz not null default now();
  alter table public.product_categories add column if not exists "updatedAt" timestamptz not null default now();
  alter table public.product_categories add column if not exists updated_at timestamptz not null default now();
  update public.product_categories set "imageUrl"=image_url where "imageUrl" is null and image_url is not null;
  update public.product_categories set image_url="imageUrl" where image_url is null and "imageUrl" is not null;
  update public.product_categories set "isActive"=is_active where "isActive" is null and is_active is not null;
  update public.product_categories set is_active="isActive" where is_active is null and "isActive" is not null;
  update public.product_categories set "createdAt"=created_at where "createdAt" is null and created_at is not null;
  update public.product_categories set created_at="createdAt" where created_at is null and "createdAt" is not null;
  update public.product_categories set "updatedAt"=updated_at where "updatedAt" is null and updated_at is not null;
  update public.product_categories set updated_at="updatedAt" where updated_at is null and "updatedAt" is not null;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='product_categories' and column_name='description') then
   alter table public.product_categories add column description text default '';
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.product_categories'::regclass and contype='p') then
   alter table public.product_categories add primary key(id);
  end if;
 end if;
 if to_regclass('public.store_settings') is not null then
  if (select count(*) from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name in ('id','section','values'))<>3 then raise exception 'Existing store_settings must have id, section and values columns. Run diagnostics.sql.'; end if;
  select udt_name into column_type from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name='id';
  if column_type not in ('uuid','int2','int4','int8') then raise exception 'Unsupported existing store_settings.id type: %',column_type; end if;
  if column_type='uuid' then alter table public.store_settings alter column id set default gen_random_uuid();
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name='id' and column_default is null and is_identity='NO') then raise exception 'Existing integer store_settings.id needs an identity/default before inserting configuration sections.'; end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_settings' and (column_name='section' and udt_name not in ('text','varchar') or column_name='values' and udt_name<>'jsonb')) then raise exception 'Existing store_settings requires a text section and jsonb values; no data was converted automatically.'; end if;
  if exists(select 1 from public.store_settings where id is null or section is null or values is null or jsonb_typeof(values)<>'object') then raise exception 'Existing store_settings contains null keys or non-object values. Review those records first.'; end if;
  for entry in select section,values from public.store_settings loop
   if not defaults ? entry.section then raise exception 'Existing settings section % requires an explicit migration.',entry.section; end if;
   for field in select key,value from jsonb_each(entry.values) loop
    if not (defaults->entry.section) ? field.key then raise exception 'Existing settings field %.% requires review before exposing configuration.',entry.section,field.key; end if;
    if defaults->entry.section->field.key<>'null'::jsonb and jsonb_typeof(defaults->entry.section->field.key) is distinct from jsonb_typeof(field.value) then raise exception 'Existing settings field %.% has an incompatible JSON type.',entry.section,field.key; end if;
   end loop;
   if entry.values::text ~* '"[^" ]*(secret|password|token|api.?key|service.?role)[^" ]*"[[:space:]]*:' then raise exception 'Existing settings may contain credentials. Move secrets to Edge Function secrets before continuing.'; end if;
  end loop;
  if exists(select 1 from public.store_settings group by section having count(*)>1) or exists(select 1 from public.store_settings group by id having count(*)>1) then raise exception 'Existing store_settings has duplicate IDs or sections. Resolve them without discarding configuration.'; end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name not in ('id','section','values','version','createdAt','updatedAt','created_at','updated_at') and is_nullable='NO' and column_default is null and is_identity='NO') then raise exception 'Additional required store_settings columns need an explicit migration.'; end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_settings' and (column_name='version' and udt_name<>'int4' or column_name in ('createdAt','updatedAt','created_at','updated_at') and udt_name<>'timestamptz')) then raise exception 'Existing settings version/timestamp types require review.'; end if;
  if exists(select 1 from pg_trigger where tgrelid='public.store_settings'::regclass and not tgisinternal) then raise exception 'Existing settings triggers require review before installing the new schema.'; end if;
  alter table public.store_settings add column if not exists version integer not null default 1;
  alter table public.store_settings add column if not exists "createdAt" timestamptz not null default now();
  alter table public.store_settings add column if not exists "updatedAt" timestamptz not null default now();
  alter table public.store_settings add column if not exists created_at timestamptz not null default now();
  alter table public.store_settings add column if not exists updated_at timestamptz not null default now();
  update public.store_settings set "createdAt"=created_at where "createdAt" is null and created_at is not null;
  update public.store_settings set created_at="createdAt" where created_at is null and "createdAt" is not null;
  update public.store_settings set "updatedAt"=updated_at where "updatedAt" is null and updated_at is not null;
  update public.store_settings set updated_at="updatedAt" where updated_at is null and "updatedAt" is not null;
  if exists(select 1 from public.store_settings where version is null or version<1) then raise exception 'Existing settings contains invalid version metadata; review it before continuing.'; end if;
  if exists(select 1 from public.store_settings where "createdAt" is null or "updatedAt" is null) then raise exception 'Existing settings contains null timestamp metadata; review it before continuing.'; end if;
  alter table public.store_settings alter column version set default 1;
  alter table public.store_settings alter column version set not null;
  alter table public.store_settings alter column "createdAt" set default now();
  alter table public.store_settings alter column "createdAt" set not null;
  alter table public.store_settings alter column "updatedAt" set default now();
  alter table public.store_settings alter column "updatedAt" set not null;
  alter table public.store_settings alter column section set not null;
  alter table public.store_settings alter column values set not null;
  if not exists(select 1 from pg_constraint where conrelid='public.store_settings'::regclass and contype='p') then alter table public.store_settings add primary key(id); end if;
  create unique index if not exists nobelle_store_settings_section_unique on public.store_settings(section);
  -- Existing permissive policies would be OR'ed with the application's policies.
  if exists(select 1 from pg_policies where schemaname='public' and tablename='store_settings' and policyname<>'public_settings') then raise exception 'Existing store_settings RLS policies require review first; bootstrap will not silently replace or combine them.'; end if;
 end if;
end;
$preflight$;
`;

export function buildBootstrap() {
  const names = readdirSync('supabase/migrations').filter(name => name.endsWith('.sql')).sort();
  const sql = names.map(name => {
    let source = readFileSync(`supabase/migrations/${name}`, 'utf8');
    if (name.endsWith('_schema.sql')) source = source.replace('create table public.store_settings (', 'create table if not exists public.store_settings (');
    if (name.endsWith('_defaults.sql')) source = source.replace(/^(insert into public\.store_settings\(section,values\).*);$/gm,
      (line,statement)=>/on conflict/i.test(statement)?line:`${statement} on conflict(section) do nothing;`);
    if (name.endsWith('_security.sql')) source = source.replace("('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']);",
      "('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;");
    return `\n-- BEGIN ${name}\n${source}\n-- END ${name}\n`;
  }).join('\n');
  const config={};
  const defaultsSql=readFileSync('supabase/migrations/202610310002_defaults.sql','utf8');
  for(const match of defaultsSql.matchAll(/insert into public\.store_settings\(section,values\) values \('([^']+)','((?:[^']|'')*)'::jsonb\)(?: on conflict\(section\) do nothing)?;/g))config[match[1]]=JSON.parse(match[2].replaceAll("''","'"));
  if(!config.general||!config.products)throw new Error('Configuration default contract could not be read from the migrations');
  const guardedPreflight=preflight.replace('__CONFIGURATION_DEFAULTS__',`'${JSON.stringify(config).replaceAll("'","''")}'::jsonb`);
  return '-- GENERATED by npm run build:supabase. One-time SQL-editor installer.\n' +
    '-- Preserves existing settings; refuses unknown table/function/policy conflicts.\n' +
    '-- Review diagnostics.sql first. The entire installation is one transaction.\n' + guardedPreflight + sql + `
-- Backfill profiles for real existing email Auth users; never assign admin roles
-- from metadata. Notification delivery is suppressed for this historical import.
alter table public.profiles disable trigger account_alert;
insert into public.profiles(id,email,"firstName","lastName",name,phone)
select id,email,coalesce(raw_user_meta_data->>'firstName',''),coalesce(raw_user_meta_data->>'lastName',''),
coalesce(raw_user_meta_data->>'name',''),coalesce(raw_user_meta_data->>'phone','')
from auth.users where email is not null on conflict(id) do nothing;
alter table public.profiles enable trigger account_alert;
notify pgrst, 'reload schema';
commit;
`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sql = buildBootstrap();
  writeFileSync('supabase/BOOTSTRAP.sql', sql);
  const repair=readFileSync('supabase/migrations/202610310013_settings_recovery.sql','utf8');
  writeFileSync('supabase/SETTINGS_RECOVERY.sql','-- GENERATED. Use only when baseline NOBELLE functions already exist.\nbegin;\n'+repair+'\ncommit;\n');
  const categories=readFileSync('supabase/migrations/202610310014_category_recovery.sql','utf8');
  writeFileSync('supabase/CATEGORY_SETTINGS_RECOVERY.sql','-- GENERATED. Requires an installed NOBELLE baseline.\nbegin;\n'+repair+'\n'+categories+'\ncommit;\n');
  console.log('Generated BOOTSTRAP.sql, SETTINGS_RECOVERY.sql and CATEGORY_SETTINGS_RECOVERY.sql. No remote database changes were made.');
}
