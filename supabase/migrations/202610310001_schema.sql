-- Fresh Supabase project migration. Existing MySQL records require an explicit import.
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.profiles (
 id uuid primary key references auth.users on delete cascade,
 email text not null, "firstName" text not null default '', "lastName" text not null default '',
 name text not null default '', phone text not null default '', "avatarUrl" text,
 "isActive" boolean not null default true, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.admin_roles (
 id uuid primary key default gen_random_uuid(), "userId" uuid not null unique references public.profiles on delete cascade,
 role text not null check(role in ('SUPER_ADMIN','MANAGER','ORDER_MANAGER','INVENTORY_MANAGER','MARKETING_MANAGER','SUPPORT')),
 "isActive" boolean not null default true, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.staff_permissions (
 id uuid primary key default gen_random_uuid(), role text not null, permission text not null,
 unique(role,permission), "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
insert into public.staff_permissions(role,permission)
select role, unnest(permissions) from (values
 ('MANAGER',array['VIEW_PRODUCTS','CREATE_PRODUCTS','EDIT_PRODUCTS','DELETE_PRODUCTS','MANAGE_INVENTORY','VIEW_ORDERS','UPDATE_ORDERS','CANCEL_ORDERS','PROCESS_REFUNDS','VIEW_CUSTOMERS','MANAGE_CUSTOMERS','MANAGE_PROMOTIONS','MANAGE_WEBSITE','VIEW_ANALYTICS','VIEW_PAYMENTS','MANAGE_SETTINGS']),
 ('ORDER_MANAGER',array['VIEW_PRODUCTS','VIEW_ORDERS','UPDATE_ORDERS','CANCEL_ORDERS','VIEW_CUSTOMERS','VIEW_PAYMENTS']),
 ('INVENTORY_MANAGER',array['VIEW_PRODUCTS','CREATE_PRODUCTS','EDIT_PRODUCTS','MANAGE_INVENTORY']),
 ('MARKETING_MANAGER',array['VIEW_PRODUCTS','VIEW_CUSTOMERS','MANAGE_PROMOTIONS','MANAGE_WEBSITE','VIEW_ANALYTICS']),
 ('SUPPORT',array['VIEW_PRODUCTS','VIEW_ORDERS','CANCEL_ORDERS','VIEW_CUSTOMERS'])
) as roles(role,permissions);
create function public.has_permission(required text) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admin_roles a join public.profiles p on p.id=a."userId"
 where a."userId"=auth.uid() and a."isActive" and p."isActive" and
 (a.role='SUPER_ADMIN' or exists(select 1 from public.staff_permissions s where s.role=a.role and s.permission=required)));
$$;
create function private.require_permission(required text) returns void language plpgsql security definer set search_path = '' as $$
begin if not public.has_permission(required) then raise exception 'Access denied' using errcode='42501'; end if; end; $$;
create function public.is_customer() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and "isActive"); $$;
create function private.new_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,email,"firstName","lastName",name,phone) values(new.id,new.email,
 coalesce(new.raw_user_meta_data->>'firstName',''),coalesce(new.raw_user_meta_data->>'lastName',''),
 coalesce(new.raw_user_meta_data->>'name',''),coalesce(new.raw_user_meta_data->>'phone',''));
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_profile();
create function private.sync_email() returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.profiles set email=new.email where id=new.id; return new; end; $$;
drop trigger if exists on_auth_email_changed on auth.users;
create trigger on_auth_email_changed after update of email on auth.users for each row execute function private.sync_email();

create table if not exists public.customer_addresses (
 id uuid primary key default gen_random_uuid(), "customerId" uuid not null references public.profiles on delete cascade,
 recipient text not null, "phoneNumber" text not null, street text not null, city text not null, state text not null,
 "postalCode" text, country text not null default 'Nigeria', "isDefault" boolean not null default false,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create unique index if not exists one_default_address on public.customer_addresses("customerId") where "isDefault";
create table if not exists public.product_categories (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
 description text default '', "imageUrl" text, "isActive" boolean not null default true,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
alter table public.product_categories add column if not exists "imageUrl" text;
create table if not exists public.product_collections (like public.product_categories including all);
alter table public.product_collections add column if not exists "imageUrl" text;
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name)>0), slug text not null unique,
 sku text not null unique, description text not null default '', "shortDescription" text not null default '',
 price numeric(14,2) not null check(price>=0), "comparePrice" numeric(14,2) check("comparePrice">=0),
 "categoryId" uuid references public.product_categories, "collectionId" uuid references public.product_collections,
 material text default '', "careInstructions" text default '', "isActive" boolean not null default false,
 "isFeatured" boolean not null default false, "archivedAt" timestamptz, "soldCount" integer not null default 0 check("soldCount">=0),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.product_collection_links (
 id uuid primary key default gen_random_uuid(), "productId" uuid not null references public.products on delete cascade,
 "collectionId" uuid not null references public.product_collections on delete cascade, unique("productId","collectionId"),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.product_images (
 id uuid primary key default gen_random_uuid(), "productId" uuid not null references public.products on delete cascade,
 url text not null, path text, "sortOrder" integer not null default 0, "isPrimary" boolean not null default false,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.product_sizes (
 id uuid primary key default gen_random_uuid(), name text not null unique, "sortOrder" integer not null default 0,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.product_colours (
 id uuid primary key default gen_random_uuid(), name text not null unique, hex text check(hex ~ '^#[0-9a-fA-F]{6}$'),
 active boolean not null default true, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.product_variants (
 id uuid primary key default gen_random_uuid(), "productId" uuid not null references public.products on delete cascade,
 sku text not null unique, size text not null, color text not null, "priceDiff" numeric(14,2) not null default 0,
 "isActive" boolean not null default true, unique("productId",size,color),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.inventory (
 id uuid primary key default gen_random_uuid(), "variantId" uuid not null unique references public.product_variants on delete cascade,
 quantity integer not null default 0 check(quantity>=0), reserved integer not null default 0 check(reserved>=0 and reserved<=quantity),
 "lowStockThreshold" integer not null default 5 check("lowStockThreshold">=0),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.inventory_movements (
 id uuid primary key default gen_random_uuid(), "variantId" uuid not null references public.product_variants,
 delta integer not null, "reservedDelta" integer not null default 0, type text not null, reason text not null,
 "actorId" uuid references public.profiles, "orderId" uuid,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.product_reviews (
 id uuid primary key default gen_random_uuid(), "productId" uuid not null references public.products,
 "customerId" uuid not null references public.profiles, rating integer not null check(rating between 1 and 5),
 comment text not null check(length(comment) between 1 and 5000), "isApproved" boolean not null default false,
 unique("productId","customerId"), "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.carts (
 id uuid primary key default gen_random_uuid(), "customerId" uuid not null unique references public.profiles on delete cascade,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.cart_items (
 id uuid primary key default gen_random_uuid(), "cartId" uuid not null references public.carts on delete cascade,
 "variantId" uuid not null references public.product_variants, quantity integer not null check(quantity between 1 and 100),
 unique("cartId","variantId"), "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.wishlists (
 id uuid primary key default gen_random_uuid(), "customerId" uuid not null unique references public.profiles on delete cascade,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.wishlist_items (
 id uuid primary key default gen_random_uuid(), "wishlistId" uuid not null references public.wishlists on delete cascade,
 "productId" uuid not null references public.products, unique("wishlistId","productId"),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.coupons (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code=upper(code)),
 "discountType" text not null check("discountType" in ('PERCENTAGE','FIXED_AMOUNT')),
 value numeric(14,2) not null check(value>0), "minSpend" numeric(14,2) not null default 0 check("minSpend">=0),
 "maxDiscount" numeric(14,2) check("maxDiscount">=0), "usageLimit" integer check("usageLimit">0),
 "perCustomerLimit" integer not null default 1 check("perCustomerLimit">0),
 "startsAt" timestamptz, "expiresAt" timestamptz, "isActive" boolean not null default true,
 check("discountType"<>'PERCENTAGE' or value<=100),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.discounts (
 id uuid primary key default gen_random_uuid(), "productId" uuid not null references public.products,
 "discountType" text not null check("discountType" in ('PERCENTAGE','FIXED_AMOUNT')), value numeric(14,2) not null check(value>0),
 "startsAt" timestamptz, "expiresAt" timestamptz, "isActive" boolean not null default true,
 check("discountType"<>'PERCENTAGE' or value<=100),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.shipping_zones (
 id uuid primary key default gen_random_uuid(), name text not null, country text not null default 'Nigeria',
 states text[] not null default '{}', fee numeric(14,2) not null check(fee>=0), "estimatedDays" text not null,
 "freeDeliveryThreshold" numeric(14,2) check("freeDeliveryThreshold">=0), "isActive" boolean not null default true,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.shipping_rates (
 id uuid primary key default gen_random_uuid(), "zoneId" uuid not null references public.shipping_zones on delete cascade,
 name text not null, fee numeric(14,2) not null check(fee>=0), "isActive" boolean not null default true,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(), "customerId" uuid not null references public.profiles,
 "orderNumber" text not null unique, "idempotencyKey" uuid not null, unique("customerId","idempotencyKey"),
 status text not null default 'PENDING' check(status in ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED')),
 "paymentStatus" text not null default 'PENDING' check("paymentStatus" in ('PENDING','SUCCESS','FAILED','REFUNDED')),
 subtotal numeric(14,2) not null check(subtotal>=0), "discountTotal" numeric(14,2) not null default 0 check("discountTotal">=0),
 "deliveryFee" numeric(14,2) not null check("deliveryFee">=0), "totalAmount" numeric(14,2) not null check("totalAmount">=0),
 currency text not null default 'NGN', "deliveryZoneId" uuid references public.shipping_zones,
 "stockCommitted" boolean not null default false, "settingsSnapshot" jsonb not null default '{}',
 "expiresAt" timestamptz not null, "paidAt" timestamptz, "deliveredAt" timestamptz,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now(),
 check("totalAmount"=subtotal-"discountTotal"+"deliveryFee")
);
alter table public.inventory_movements add foreign key("orderId") references public.orders;
create table if not exists public.shipping_addresses (
 id uuid primary key default gen_random_uuid(), "orderId" uuid not null unique references public.orders,
 recipient text not null, "phoneNumber" text not null, street text not null, city text not null, state text not null,
 country text not null, "postalCode" text, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(), "orderId" uuid not null references public.orders,
 "productId" uuid not null references public.products, "variantId" uuid not null references public.product_variants,
 "productName" text not null, sku text not null, size text not null, color text not null,
 quantity integer not null check(quantity>0), "unitPrice" numeric(14,2) not null check("unitPrice">=0),
 "totalPrice" numeric(14,2) not null check("totalPrice"="unitPrice"*quantity),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.order_status_history (
 id uuid primary key default gen_random_uuid(), "orderId" uuid not null references public.orders,
 status text not null, note text, "actorId" uuid references public.profiles,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.shipments (
 id uuid primary key default gen_random_uuid(), "orderId" uuid not null unique references public.orders,
 carrier text not null, "trackingNumber" text not null,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.coupon_usage (
 id uuid primary key default gen_random_uuid(), "couponId" uuid not null references public.coupons,
 "customerId" uuid not null references public.profiles, "orderId" uuid not null unique references public.orders,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(), "orderId" uuid not null unique references public.orders,
 reference text not null unique, amount numeric(14,2) not null check(amount>0), currency text not null,
 status text not null default 'PENDING' check(status in ('PENDING','SUCCESS','FAILED','REFUNDED')),
 "gatewayId" text, mode text not null check(mode in ('TEST','LIVE')), "authorizationUrl" text,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.payment_transactions (
 id uuid primary key default gen_random_uuid(), "paymentId" uuid not null references public.payments,
 "eventId" text not null unique, status text not null, amount numeric(14,2) not null,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.returns (
 id uuid primary key default gen_random_uuid(), "orderId" uuid not null references public.orders,
 "customerId" uuid not null references public.profiles, reason text not null check(length(reason) between 1 and 2000),
 status text not null default 'REQUESTED' check(status in ('REQUESTED','UNDER_REVIEW','APPROVED','REJECTED','RECEIVED','REFUNDED','COMPLETED')),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.return_items (
 id uuid primary key default gen_random_uuid(), "returnId" uuid not null references public.returns,
 "orderItemId" uuid not null references public.order_items, quantity integer not null check(quantity>0),
 unique("returnId","orderItemId"), "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.refunds (
 id uuid primary key default gen_random_uuid(), "returnId" uuid not null unique references public.returns,
 "paymentId" uuid not null references public.payments, amount numeric(14,2) not null check(amount>0),
 status text not null default 'PENDING' check(status in ('PENDING','SUCCESS','FAILED')), "gatewayId" text unique,
 "restockedAt" timestamptz, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.website_settings (
 id uuid primary key default gen_random_uuid(), slug text not null unique, data jsonb not null default '{}',
 "isActive" boolean not null default true, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.store_settings (
 id uuid primary key default gen_random_uuid(), section text not null unique, values jsonb not null,
 version integer not null default 1, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
alter table public.store_settings add column if not exists version integer not null default 1;
alter table public.store_settings add column if not exists "createdAt" timestamptz not null default now();
alter table public.store_settings add column if not exists "updatedAt" timestamptz not null default now();
create table if not exists public.homepage_sections (
 id uuid primary key default gen_random_uuid(), name text not null, heading text default '', description text default '',
 "imageUrl" text, "linkUrl" text, "sortOrder" integer not null default 0, "isActive" boolean not null default true,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.banners (
 id uuid primary key default gen_random_uuid(), title text not null, subtitle text default '', "imageUrl" text,
 "linkUrl" text, "buttonText" text, "sortOrder" integer not null default 0, "isActive" boolean not null default true,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.featured_products (
 id uuid primary key default gen_random_uuid(), "productId" uuid not null unique references public.products,
 "sortOrder" integer not null default 0, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.policies (
 id text primary key, title text not null, content text not null default '', published jsonb,
 status text not null default 'DRAFT' check(status in ('DRAFT','PUBLISHED')),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.admin_notifications (
 id uuid primary key default gen_random_uuid(), type text not null, title text not null, message text not null,
 permission text not null, "linkUrl" text, "isRead" boolean not null default false,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(), "customerId" uuid not null references public.profiles,
 title text not null, message text not null, "linkUrl" text, "isRead" boolean not null default false,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.contact_messages (
 id uuid primary key default gen_random_uuid(), name text not null, email text not null, subject text not null,
 message text not null, "isRead" boolean not null default false,
 status text not null default 'NEW' check(status in ('NEW','IN_PROGRESS','RESOLVED','ARCHIVED')),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.newsletter_subscribers (
 id uuid primary key default gen_random_uuid(), email text not null unique,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.activity_logs (
 id uuid primary key default gen_random_uuid(), "adminId" uuid references public.profiles,
 action text not null, entity text not null, "entityId" text, metadata jsonb not null default '{}',
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
-- Rate limiting is private and never exposed by PostgREST.
create table if not exists private.rate_limits (key text primary key, hits integer not null, start_at timestamptz not null default now());

create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new."updatedAt"=now(); return new; end; $$;
do $$ declare t record; c record; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename=any(array['profiles','admin_roles','staff_permissions','customer_addresses','product_categories','product_collections','products','product_collection_links','product_images','product_sizes','product_colours','product_variants','inventory','inventory_movements','product_reviews','carts','cart_items','wishlists','wishlist_items','coupons','discounts','shipping_zones','shipping_rates','orders','shipping_addresses','order_items','order_status_history','shipments','coupon_usage','payments','payment_transactions','returns','return_items','refunds','website_settings','store_settings','homepage_sections','banners','featured_products','policies','admin_notifications','notifications','contact_messages','newsletter_subscribers','activity_logs']) loop
  execute format('alter table public.%I enable row level security',t.tablename);
  execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()',t.tablename);
 end loop;
 -- Index every foreign key, including parent ownership lookups used by RLS.
 for c in select tc.table_name,kcu.column_name from information_schema.table_constraints tc
 join information_schema.key_column_usage kcu using(constraint_catalog,constraint_schema,constraint_name)
 where tc.constraint_type='FOREIGN KEY' and tc.table_schema='public' and tc.table_name=any(array['profiles','admin_roles','staff_permissions','customer_addresses','product_categories','product_collections','products','product_collection_links','product_images','product_sizes','product_colours','product_variants','inventory','inventory_movements','product_reviews','carts','cart_items','wishlists','wishlist_items','coupons','discounts','shipping_zones','shipping_rates','orders','shipping_addresses','order_items','order_status_history','shipments','coupon_usage','payments','payment_transactions','returns','return_items','refunds','website_settings','store_settings','homepage_sections','banners','featured_products','policies','admin_notifications','notifications','contact_messages','newsletter_subscribers','activity_logs']) loop
  execute format('create index if not exists %I on public.%I (%I)',c.table_name||'_'||c.column_name||'_idx',c.table_name,c.column_name);
 end loop;
end $$;
create index if not exists orders_status_created on public.orders(status,"createdAt" desc);
create index if not exists orders_expiry on public.orders("expiresAt") where status='PENDING';
create index if not exists products_published on public.products("createdAt" desc) where "isActive" and "archivedAt" is null;
create index if not exists product_search on public.products using gin(to_tsvector('english',name||' '||description));
create index if not exists notifications_unread on public.admin_notifications(permission,"createdAt" desc) where not "isRead";
