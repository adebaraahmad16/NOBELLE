-- Catalogue and content updates must reach other browsers, not just the editor.
-- This changes the publication only; existing RLS policies remain in effect.
do $$
declare target text;
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach target in array array['product_categories','product_collections','product_collection_links','product_variants','product_reviews','discounts'] loop
   if to_regclass('public.'||target) is not null and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=target) then
    execute format('alter publication supabase_realtime add table public.%I',target);
   end if;
  end loop;
 end if;
end $$;
