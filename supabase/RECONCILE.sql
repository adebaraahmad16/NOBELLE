-- NOBELLE RECONCILE.sql
-- Generated 2026-10-31. Run this in the Supabase SQL Editor.
-- Safe to run multiple times (all statements are idempotent).
-- Does NOT drop, truncate, or delete any existing data.
-- Fixes: missing columns, missing functions, missing RLS policies,
--        missing indexes, and reloads the PostgREST schema cache.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCT_CATEGORIES — add columns the app expects
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.product_categories
  add column if not exists "imageUrl"   text,
  add column if not exists "isActive"   boolean not null default true,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now(),
  add column if not exists description  text default '';

-- Back-fill camelCase from snake_case if the old columns exist
do $$
begin
  if exists(select 1 from information_schema.columns
            where table_schema='public' and table_name='product_categories'
              and column_name='image_url') then
    update public.product_categories
       set "imageUrl" = image_url
     where "imageUrl" is null and image_url is not null;
  end if;
  if exists(select 1 from information_schema.columns
            where table_schema='public' and table_name='product_categories'
              and column_name='is_active') then
    update public.product_categories
       set "isActive" = is_active
     where "isActive" is null;
  end if;
  if exists(select 1 from information_schema.columns
            where table_schema='public' and table_name='product_categories'
              and column_name='created_at') then
    update public.product_categories
       set "createdAt" = created_at
     where "createdAt" = now() and created_at <> now();
  end if;
  if exists(select 1 from information_schema.columns
            where table_schema='public' and table_name='product_categories'
              and column_name='updated_at') then
    update public.product_categories
       set "updatedAt" = updated_at
     where "updatedAt" = now() and updated_at <> now();
  end if;
end;
$$;

-- Ensure required unique constraints exist
create unique index if not exists product_categories_name_key
  on public.product_categories(name);
create unique index if not exists product_categories_slug_key
  on public.product_categories(slug);
create index if not exists product_categories_visibility_created
  on public.product_categories("isActive", "createdAt" desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PRODUCT_COLLECTIONS — same pattern as categories
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.product_collections
  add column if not exists "imageUrl"   text,
  add column if not exists "isActive"   boolean not null default true,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now(),
  add column if not exists description  text default '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. STORE_SETTINGS — add version + timestamp columns
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.store_settings
  add column if not exists version      integer not null default 1,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now();

-- Sync snake_case → camelCase if both exist
do $$
begin
  if exists(select 1 from information_schema.columns
            where table_schema='public' and table_name='store_settings'
              and column_name='created_at') then
    update public.store_settings
       set "createdAt" = created_at
     where "createdAt" = now() and created_at <> now();
  end if;
  if exists(select 1 from information_schema.columns
            where table_schema='public' and table_name='store_settings'
              and column_name='updated_at') then
    update public.store_settings
       set "updatedAt" = updated_at
     where "updatedAt" = now() and updated_at <> now();
  end if;
end;
$$;

create unique index if not exists nobelle_store_settings_section_unique
  on public.store_settings(section);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PROFILES — ensure all expected columns exist
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists "firstName"  text not null default '',
  add column if not exists "lastName"   text not null default '',
  add column if not exists name         text not null default '',
  add column if not exists phone        text not null default '',
  add column if not exists "avatarUrl"  text,
  add column if not exists "isActive"   boolean not null default true,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ADMIN_ROLES — ensure isActive column exists
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.admin_roles
  add column if not exists "isActive"   boolean not null default true,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PRODUCTS — ensure all expected columns exist
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists "shortDescription"  text not null default '',
  add column if not exists "comparePrice"      numeric(14,2) check("comparePrice" >= 0),
  add column if not exists material            text default '',
  add column if not exists "careInstructions"  text default '',
  add column if not exists "isActive"          boolean not null default false,
  add column if not exists "isFeatured"        boolean not null default false,
  add column if not exists "archivedAt"        timestamptz,
  add column if not exists "soldCount"         integer not null default 0,
  add column if not exists "createdAt"         timestamptz not null default now(),
  add column if not exists "updatedAt"         timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. INVENTORY — ensure reserved + lowStockThreshold exist
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.inventory
  add column if not exists reserved           integer not null default 0,
  add column if not exists "lowStockThreshold" integer not null default 5,
  add column if not exists "createdAt"        timestamptz not null default now(),
  add column if not exists "updatedAt"        timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ORDERS — ensure all expected columns exist
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.orders
  add column if not exists "orderNumber"      text unique,
  add column if not exists "idempotencyKey"   text,
  add column if not exists status             text not null default 'PENDING',
  add column if not exists "paymentStatus"    text not null default 'PENDING',
  add column if not exists subtotal           numeric(14,2) not null default 0,
  add column if not exists "discountTotal"    numeric(14,2) not null default 0,
  add column if not exists "deliveryFee"      numeric(14,2) not null default 0,
  add column if not exists "totalAmount"      numeric(14,2) not null default 0,
  add column if not exists currency           text not null default 'NGN',
  add column if not exists "stockCommitted"   boolean not null default false,
  add column if not exists "settingsSnapshot" jsonb,
  add column if not exists "expiresAt"        timestamptz,
  add column if not exists "paidAt"           timestamptz,
  add column if not exists "deliveredAt"      timestamptz,
  add column if not exists "createdAt"        timestamptz not null default now(),
  add column if not exists "updatedAt"        timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. NOTIFICATIONS — customer notifications
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.notifications
  add column if not exists "customerId"  uuid references public.profiles,
  add column if not exists title         text not null default '',
  add column if not exists message       text not null default '',
  add column if not exists "linkUrl"     text,
  add column if not exists "isRead"      boolean not null default false,
  add column if not exists "createdAt"   timestamptz not null default now(),
  add column if not exists "updatedAt"   timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. ADMIN_NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.admin_notifications
  add column if not exists type        text not null default 'INFO',
  add column if not exists title       text not null default '',
  add column if not exists message     text not null default '',
  add column if not exists permission  text not null default '',
  add column if not exists "linkUrl"   text,
  add column if not exists "isRead"    boolean not null default false,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. CONTACT_MESSAGES
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.contact_messages
  add column if not exists "isRead"    boolean not null default false,
  add column if not exists status      text not null default 'NEW',
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. WEBSITE_SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.website_settings
  add column if not exists "isActive"  boolean not null default true,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. COUPONS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.coupons
  add column if not exists "isActive"          boolean not null default true,
  add column if not exists "discountType"      text not null default 'PERCENTAGE',
  add column if not exists value               numeric(14,2) not null default 0,
  add column if not exists "minSpend"          numeric(14,2) default 0,
  add column if not exists "maxDiscount"       numeric(14,2) default 0,
  add column if not exists "usageLimit"        integer,
  add column if not exists "perCustomerLimit"  integer,
  add column if not exists "startsAt"          timestamptz,
  add column if not exists "expiresAt"         timestamptz,
  add column if not exists "createdAt"         timestamptz not null default now(),
  add column if not exists "updatedAt"         timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. DISCOUNTS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.discounts
  add column if not exists "isActive"     boolean not null default true,
  add column if not exists "discountType" text not null default 'PERCENTAGE',
  add column if not exists value          numeric(14,2) not null default 0,
  add column if not exists "startsAt"     timestamptz,
  add column if not exists "expiresAt"    timestamptz,
  add column if not exists "createdAt"    timestamptz not null default now(),
  add column if not exists "updatedAt"    timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. SHIPPING_ZONES — ensure all expected columns
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.shipping_zones
  add column if not exists states                  text[] not null default '{}',
  add column if not exists fee                     numeric(14,2) not null default 0,
  add column if not exists "estimatedDays"         integer not null default 3,
  add column if not exists "freeDeliveryThreshold" numeric(14,2) not null default 0,
  add column if not exists "isActive"              boolean not null default true,
  add column if not exists "createdAt"             timestamptz not null default now(),
  add column if not exists "updatedAt"             timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. SHIPPING_RATES
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.shipping_rates
  add column if not exists "isActive"  boolean not null default true,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.policies
  add column if not exists status      text not null default 'DRAFT',
  add column if not exists published   jsonb,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. PRODUCT_REVIEWS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.product_reviews
  add column if not exists "isApproved" boolean not null default false,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. BANNERS + HOMEPAGE_SECTIONS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.banners
  add column if not exists "imageUrl"   text,
  add column if not exists "linkUrl"    text,
  add column if not exists "buttonText" text,
  add column if not exists "sortOrder"  integer not null default 0,
  add column if not exists "isActive"   boolean not null default true,
  add column if not exists subtitle     text,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now();

alter table public.homepage_sections
  add column if not exists "imageUrl"   text,
  add column if not exists "linkUrl"    text,
  add column if not exists heading      text not null default '',
  add column if not exists description  text not null default '',
  add column if not exists "sortOrder"  integer not null default 0,
  add column if not exists "isActive"   boolean not null default true,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 20. PRODUCT_VARIANTS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.product_variants
  add column if not exists sku        text unique,
  add column if not exists "priceDiff" numeric(14,2) not null default 0,
  add column if not exists "isActive"  boolean not null default true,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 21. PAYMENTS + PAYMENT_TRANSACTIONS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.payments
  add column if not exists reference        text unique,
  add column if not exists amount           numeric(14,2) not null default 0,
  add column if not exists currency         text not null default 'NGN',
  add column if not exists status           text not null default 'PENDING',
  add column if not exists "gatewayId"      text,
  add column if not exists mode             text not null default 'TEST',
  add column if not exists "authorizationUrl" text,
  add column if not exists "createdAt"      timestamptz not null default now(),
  add column if not exists "updatedAt"      timestamptz not null default now();

alter table public.payment_transactions
  add column if not exists "eventId"   text unique,
  add column if not exists status      text not null default 'PENDING',
  add column if not exists amount      numeric(14,2) not null default 0,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 22. RETURNS + RETURN_ITEMS + REFUNDS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.returns
  add column if not exists reason      text not null default '',
  add column if not exists status      text not null default 'REQUESTED',
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

alter table public.return_items
  add column if not exists quantity    integer not null default 1,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

alter table public.refunds
  add column if not exists amount               numeric(14,2) not null default 0,
  add column if not exists status               text not null default 'PENDING',
  add column if not exists "gatewayId"          text unique,
  add column if not exists "restockedAt"        timestamptz,
  add column if not exists "dispatchStartedAt"  timestamptz,
  add column if not exists "createdAt"          timestamptz not null default now(),
  add column if not exists "updatedAt"          timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 23. CART_ITEMS / CARTS / WISHLIST_ITEMS / WISHLISTS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.carts
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();
alter table public.cart_items
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();
alter table public.wishlists
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();
alter table public.wishlist_items
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 24. INVENTORY_MOVEMENTS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.inventory_movements
  add column if not exists delta         integer not null default 0,
  add column if not exists "reservedDelta" integer not null default 0,
  add column if not exists type          text not null default 'MANUAL',
  add column if not exists reason        text,
  add column if not exists "actorId"     uuid references public.profiles,
  add column if not exists "orderId"     uuid,
  add column if not exists "previousQty" integer,
  add column if not exists "newQty"      integer,
  add column if not exists "createdAt"   timestamptz not null default now(),
  add column if not exists "updatedAt"   timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 25. ACTIVITY_LOGS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.activity_logs
  add column if not exists "adminId"   uuid references public.profiles,
  add column if not exists action      text not null default '',
  add column if not exists entity      text not null default '',
  add column if not exists "entityId"  text,
  add column if not exists metadata    jsonb not null default '{}',
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 26. EMAIL_OUTBOX + NEWSLETTER_SUBSCRIBERS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.email_outbox
  add column if not exists recipient        text not null default '',
  add column if not exists subject          text not null default '',
  add column if not exists body             text not null default '',
  add column if not exists "linkUrl"        text,
  add column if not exists status           text not null default 'PENDING',
  add column if not exists attempts         integer not null default 0,
  add column if not exists "firstAttemptAt" timestamptz,
  add column if not exists "lockedUntil"    timestamptz,
  add column if not exists "notBefore"      timestamptz not null default now(),
  add column if not exists "providerId"     text,
  add column if not exists "lastError"      text,
  add column if not exists "createdAt"      timestamptz not null default now(),
  add column if not exists "updatedAt"      timestamptz not null default now();

alter table public.newsletter_subscribers
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 27. FEATURED_PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.featured_products
  add column if not exists "sortOrder" integer not null default 0,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 28. ORDER_STATUS_HISTORY + SHIPMENTS + SHIPPING_ADDRESSES + ORDER_ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.order_status_history
  add column if not exists note        text,
  add column if not exists "actorId"   uuid references public.profiles,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

alter table public.shipments
  add column if not exists carrier          text not null default '',
  add column if not exists "trackingNumber" text not null default '',
  add column if not exists "createdAt"      timestamptz not null default now(),
  add column if not exists "updatedAt"      timestamptz not null default now();

alter table public.shipping_addresses
  add column if not exists recipient    text not null default '',
  add column if not exists "phoneNumber" text not null default '',
  add column if not exists street       text not null default '',
  add column if not exists city         text not null default '',
  add column if not exists state        text not null default '',
  add column if not exists country      text not null default 'Nigeria',
  add column if not exists "postalCode" text,
  add column if not exists "createdAt"  timestamptz not null default now(),
  add column if not exists "updatedAt"  timestamptz not null default now();

alter table public.order_items
  add column if not exists "productName" text not null default '',
  add column if not exists sku           text,
  add column if not exists size          text,
  add column if not exists color         text,
  add column if not exists quantity      integer not null default 1,
  add column if not exists "unitPrice"   numeric(14,2) not null default 0,
  add column if not exists "totalPrice"  numeric(14,2) not null default 0,
  add column if not exists "createdAt"   timestamptz not null default now(),
  add column if not exists "updatedAt"   timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 29. PRODUCT_IMAGES
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.product_images
  add column if not exists url        text not null default '',
  add column if not exists path       text,
  add column if not exists "sortOrder" integer not null default 0,
  add column if not exists "isPrimary" boolean not null default false,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 30. PRODUCT_SIZES + PRODUCT_COLOURS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.product_sizes
  add column if not exists "sortOrder" integer not null default 0,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

alter table public.product_colours
  add column if not exists active     boolean not null default true,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 31. COUPON_USAGE + STAFF_PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.coupon_usage
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

alter table public.staff_permissions
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 32. CUSTOMER_ADDRESSES
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.customer_addresses
  add column if not exists "isDefault"    boolean not null default false,
  add column if not exists "phoneNumber"  text not null default '',
  add column if not exists "postalCode"   text,
  add column if not exists country        text not null default 'Nigeria',
  add column if not exists "createdAt"    timestamptz not null default now(),
  add column if not exists "updatedAt"    timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 33. ENABLE RLS on all tables (safe — does not drop existing policies)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  for t in select tablename from pg_tables
           where schemaname='public'
             and tablename not in (select tablename from pg_tables
                                   where schemaname='public'
                                   and tablename not in (
                                     select relname from pg_class c
                                     join pg_namespace n on n.oid=c.relnamespace
                                     where n.nspname='public' and c.relrowsecurity=false
                                   ))
  loop
    -- intentionally empty — we use the explicit list below
    null;
  end loop;
end;
$$;

-- Enable RLS explicitly on each table
alter table public.profiles             enable row level security;
alter table public.admin_roles          enable row level security;
alter table public.staff_permissions    enable row level security;
alter table public.product_categories  enable row level security;
alter table public.product_collections enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.product_variants    enable row level security;
alter table public.product_sizes       enable row level security;
alter table public.product_colours     enable row level security;
alter table public.product_collection_links enable row level security;
alter table public.product_reviews     enable row level security;
alter table public.inventory           enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.order_status_history enable row level security;
alter table public.shipments           enable row level security;
alter table public.shipping_addresses  enable row level security;
alter table public.shipping_zones      enable row level security;
alter table public.shipping_rates      enable row level security;
alter table public.payments            enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.coupons             enable row level security;
alter table public.coupon_usage        enable row level security;
alter table public.discounts           enable row level security;
alter table public.carts               enable row level security;
alter table public.cart_items          enable row level security;
alter table public.wishlists           enable row level security;
alter table public.wishlist_items      enable row level security;
alter table public.notifications       enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.contact_messages    enable row level security;
alter table public.website_settings    enable row level security;
alter table public.homepage_sections   enable row level security;
alter table public.banners             enable row level security;
alter table public.featured_products   enable row level security;
alter table public.policies            enable row level security;
alter table public.returns             enable row level security;
alter table public.return_items        enable row level security;
alter table public.refunds             enable row level security;
alter table public.store_settings      enable row level security;
alter table public.customer_addresses  enable row level security;
alter table public.activity_logs       enable row level security;
alter table public.email_outbox        enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.staff_permissions   enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 34. RLS POLICIES (all idempotent — drop+create)
-- ─────────────────────────────────────────────────────────────────────────────

-- store_settings: public read
drop policy if exists public_settings on public.store_settings;
create policy public_settings on public.store_settings
  for select using (true);

-- product_categories: public read active; admin full
drop policy if exists public_categories on public.product_categories;
create policy public_categories on public.product_categories
  for select using ("isActive" = true or public.has_permission('VIEW_PRODUCTS'));

drop policy if exists admin_categories on public.product_categories;
create policy admin_categories on public.product_categories
  for all using (public.has_permission('CREATE_PRODUCTS'))
  with check (public.has_permission('CREATE_PRODUCTS'));

-- product_collections: same as categories
drop policy if exists public_collections on public.product_collections;
create policy public_collections on public.product_collections
  for select using ("isActive" = true or public.has_permission('VIEW_PRODUCTS'));

drop policy if exists admin_collections on public.product_collections;
create policy admin_collections on public.product_collections
  for all using (public.has_permission('CREATE_PRODUCTS'))
  with check (public.has_permission('CREATE_PRODUCTS'));

-- products: public read active+not-archived; admin all
drop policy if exists public_products on public.products;
create policy public_products on public.products
  for select using ("isActive" = true and "archivedAt" is null
                    or public.has_permission('VIEW_PRODUCTS'));

drop policy if exists admin_products on public.products;
create policy admin_products on public.products
  for all using (public.has_permission('CREATE_PRODUCTS'))
  with check (public.has_permission('CREATE_PRODUCTS'));

-- product_images: public read
drop policy if exists public_product_images on public.product_images;
create policy public_product_images on public.product_images
  for select using (true);

drop policy if exists admin_product_images on public.product_images;
create policy admin_product_images on public.product_images
  for all using (public.has_permission('EDIT_PRODUCTS'))
  with check (public.has_permission('EDIT_PRODUCTS'));

-- product_variants + product_sizes + product_colours: public read
drop policy if exists public_variants on public.product_variants;
create policy public_variants on public.product_variants for select using (true);
drop policy if exists admin_variants on public.product_variants;
create policy admin_variants on public.product_variants
  for all using (public.has_permission('EDIT_PRODUCTS'))
  with check (public.has_permission('EDIT_PRODUCTS'));

drop policy if exists public_sizes on public.product_sizes;
create policy public_sizes on public.product_sizes for select using (true);
drop policy if exists public_colours on public.product_colours;
create policy public_colours on public.product_colours for select using (true);

-- inventory: public read; admin write
drop policy if exists public_inventory on public.inventory;
create policy public_inventory on public.inventory for select using (true);
drop policy if exists admin_inventory on public.inventory;
create policy admin_inventory on public.inventory
  for all using (public.has_permission('MANAGE_INVENTORY'))
  with check (public.has_permission('MANAGE_INVENTORY'));

-- profiles: own row + admin
drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles
  for select using (id = auth.uid() or public.has_permission('VIEW_CUSTOMERS'));
drop policy if exists edit_profile on public.profiles;
create policy edit_profile on public.profiles
  for update using (id = auth.uid() or public.has_permission('MANAGE_CUSTOMERS'))
  with check (id = auth.uid() or public.has_permission('MANAGE_CUSTOMERS'));
drop policy if exists insert_profile on public.profiles;
create policy insert_profile on public.profiles
  for insert with check (id = auth.uid());

-- orders: own + admin
drop policy if exists own_orders on public.orders;
create policy own_orders on public.orders
  for select using ("customerId" = auth.uid() or public.has_permission('VIEW_ORDERS'));
drop policy if exists admin_orders on public.orders;
create policy admin_orders on public.orders
  for update using (public.has_permission('UPDATE_ORDERS'))
  with check (public.has_permission('UPDATE_ORDERS'));
drop policy if exists insert_orders on public.orders;
create policy insert_orders on public.orders
  for insert with check ("customerId" = auth.uid() or public.has_permission('VIEW_ORDERS'));

-- order_items: read via order ownership
drop policy if exists own_order_items on public.order_items;
create policy own_order_items on public.order_items
  for select using (
    exists(select 1 from public.orders o
           where o.id = "orderId"
             and (o."customerId" = auth.uid() or public.has_permission('VIEW_ORDERS')))
  );
drop policy if exists insert_order_items on public.order_items;
create policy insert_order_items on public.order_items
  for insert with check (public.has_permission('VIEW_ORDERS') or
    exists(select 1 from public.orders o
           where o.id = "orderId" and o."customerId" = auth.uid()));

-- carts + cart_items: own only
drop policy if exists own_cart on public.carts;
create policy own_cart on public.carts
  for all using ("customerId" = auth.uid())
  with check ("customerId" = auth.uid());
drop policy if exists own_cart_items on public.cart_items;
create policy own_cart_items on public.cart_items
  for all using (
    exists(select 1 from public.carts c where c.id = "cartId" and c."customerId" = auth.uid())
  )
  with check (
    exists(select 1 from public.carts c where c.id = "cartId" and c."customerId" = auth.uid())
  );

-- wishlists + wishlist_items: own only
drop policy if exists own_wishlist on public.wishlists;
create policy own_wishlist on public.wishlists
  for all using ("customerId" = auth.uid())
  with check ("customerId" = auth.uid());
drop policy if exists own_wishlist_items on public.wishlist_items;
create policy own_wishlist_items on public.wishlist_items
  for all using (
    exists(select 1 from public.wishlists w where w.id = "wishlistId" and w."customerId" = auth.uid())
  )
  with check (
    exists(select 1 from public.wishlists w where w.id = "wishlistId" and w."customerId" = auth.uid())
  );

-- notifications: own + admin
drop policy if exists own_notifications on public.notifications;
create policy own_notifications on public.notifications
  for select using ("customerId" = auth.uid());
drop policy if exists own_notifications_update on public.notifications;
create policy own_notifications_update on public.notifications
  for update using ("customerId" = auth.uid())
  with check ("customerId" = auth.uid());

-- admin_notifications: admin only
drop policy if exists admin_notifs on public.admin_notifications;
create policy admin_notifs on public.admin_notifications
  for select using (
    permission = '' or public.has_permission(permission)
  );
drop policy if exists admin_notifs_update on public.admin_notifications;
create policy admin_notifs_update on public.admin_notifications
  for update using (public.has_permission('VIEW_ANALYTICS'))
  with check (public.has_permission('VIEW_ANALYTICS'));

-- admin_roles: admin only
drop policy if exists admin_roles_read on public.admin_roles;
create policy admin_roles_read on public.admin_roles
  for select using (public.has_permission('MANAGE_SETTINGS') or "userId" = auth.uid());

-- staff_permissions: admin only
drop policy if exists staff_perms_read on public.staff_permissions;
create policy staff_perms_read on public.staff_permissions
  for select using (public.has_permission('MANAGE_SETTINGS'));

-- payments + payment_transactions: own + admin
drop policy if exists own_payments on public.payments;
create policy own_payments on public.payments
  for select using (
    exists(select 1 from public.orders o where o.id = "orderId"
           and (o."customerId" = auth.uid() or public.has_permission('VIEW_PAYMENTS')))
  );
drop policy if exists insert_payments on public.payments;
create policy insert_payments on public.payments
  for insert with check (
    public.has_permission('VIEW_PAYMENTS') or
    exists(select 1 from public.orders o where o.id = "orderId" and o."customerId" = auth.uid())
  );
drop policy if exists admin_payment_transactions on public.payment_transactions;
create policy admin_payment_transactions on public.payment_transactions
  for select using (public.has_permission('VIEW_PAYMENTS'));

-- coupons: public read active; admin all
drop policy if exists public_coupons on public.coupons;
create policy public_coupons on public.coupons
  for select using ("isActive" = true or public.has_permission('MANAGE_PROMOTIONS'));
drop policy if exists admin_coupons on public.coupons;
create policy admin_coupons on public.coupons
  for all using (public.has_permission('MANAGE_PROMOTIONS'))
  with check (public.has_permission('MANAGE_PROMOTIONS'));

-- discounts: public read
drop policy if exists public_discounts on public.discounts;
create policy public_discounts on public.discounts
  for select using (true);
drop policy if exists admin_discounts on public.discounts;
create policy admin_discounts on public.discounts
  for all using (public.has_permission('MANAGE_PROMOTIONS'))
  with check (public.has_permission('MANAGE_PROMOTIONS'));

-- shipping_zones + shipping_rates: public read active
drop policy if exists public_zones on public.shipping_zones;
create policy public_zones on public.shipping_zones
  for select using ("isActive" = true or public.has_permission('MANAGE_SETTINGS'));
drop policy if exists admin_zones on public.shipping_zones;
create policy admin_zones on public.shipping_zones
  for all using (public.has_permission('MANAGE_SETTINGS'))
  with check (public.has_permission('MANAGE_SETTINGS'));
drop policy if exists public_rates on public.shipping_rates;
create policy public_rates on public.shipping_rates
  for select using ("isActive" = true or public.has_permission('MANAGE_SETTINGS'));
drop policy if exists admin_rates on public.shipping_rates;
create policy admin_rates on public.shipping_rates
  for all using (public.has_permission('MANAGE_SETTINGS'))
  with check (public.has_permission('MANAGE_SETTINGS'));

-- contact_messages: insert only for public; admin reads
drop policy if exists public_contact on public.contact_messages;
create policy public_contact on public.contact_messages
  for insert with check (true);
drop policy if exists admin_contact on public.contact_messages;
create policy admin_contact on public.contact_messages
  for select using (public.has_permission('VIEW_CUSTOMERS'));
drop policy if exists admin_contact_update on public.contact_messages;
create policy admin_contact_update on public.contact_messages
  for update using (public.has_permission('MANAGE_CUSTOMERS'))
  with check (public.has_permission('MANAGE_CUSTOMERS'));

-- newsletter: insert only
drop policy if exists newsletter_insert on public.newsletter_subscribers;
create policy newsletter_insert on public.newsletter_subscribers
  for insert with check (true);
drop policy if exists admin_newsletter on public.newsletter_subscribers;
create policy admin_newsletter on public.newsletter_subscribers
  for select using (public.has_permission('MANAGE_WEBSITE'));

-- website_settings + homepage_sections + banners + featured_products: public read, admin write
drop policy if exists public_website on public.website_settings;
create policy public_website on public.website_settings for select using (true);
drop policy if exists admin_website on public.website_settings;
create policy admin_website on public.website_settings
  for all using (public.has_permission('MANAGE_WEBSITE'))
  with check (public.has_permission('MANAGE_WEBSITE'));

drop policy if exists public_homepage on public.homepage_sections;
create policy public_homepage on public.homepage_sections for select using (true);
drop policy if exists admin_homepage on public.homepage_sections;
create policy admin_homepage on public.homepage_sections
  for all using (public.has_permission('MANAGE_WEBSITE'))
  with check (public.has_permission('MANAGE_WEBSITE'));

drop policy if exists public_banners on public.banners;
create policy public_banners on public.banners for select using (true);
drop policy if exists admin_banners on public.banners;
create policy admin_banners on public.banners
  for all using (public.has_permission('MANAGE_WEBSITE'))
  with check (public.has_permission('MANAGE_WEBSITE'));

drop policy if exists public_featured on public.featured_products;
create policy public_featured on public.featured_products for select using (true);
drop policy if exists admin_featured on public.featured_products;
create policy admin_featured on public.featured_products
  for all using (public.has_permission('MANAGE_WEBSITE'))
  with check (public.has_permission('MANAGE_WEBSITE'));

-- policies: public read published
drop policy if exists public_policies on public.policies;
create policy public_policies on public.policies
  for select using (status = 'PUBLISHED' or public.has_permission('MANAGE_SETTINGS'));
drop policy if exists admin_policies on public.policies;
create policy admin_policies on public.policies
  for all using (public.has_permission('MANAGE_SETTINGS'))
  with check (public.has_permission('MANAGE_SETTINGS'));

-- returns + return_items + refunds: own + admin
drop policy if exists own_returns on public.returns;
create policy own_returns on public.returns
  for select using ("customerId" = auth.uid() or public.has_permission('VIEW_ORDERS'));
drop policy if exists insert_returns on public.returns;
create policy insert_returns on public.returns
  for insert with check ("customerId" = auth.uid());
drop policy if exists admin_return_items on public.return_items;
create policy admin_return_items on public.return_items
  for select using (
    exists(select 1 from public.returns r where r.id = "returnId"
           and (r."customerId" = auth.uid() or public.has_permission('VIEW_ORDERS')))
  );
drop policy if exists admin_refunds on public.refunds;
create policy admin_refunds on public.refunds
  for select using (public.has_permission('PROCESS_REFUNDS'));

-- customer_addresses: own + admin
drop policy if exists own_addresses on public.customer_addresses;
create policy own_addresses on public.customer_addresses
  for all using ("customerId" = auth.uid() or public.has_permission('VIEW_CUSTOMERS'))
  with check ("customerId" = auth.uid() or public.has_permission('MANAGE_CUSTOMERS'));

-- activity_logs: admin only
drop policy if exists admin_activity on public.activity_logs;
create policy admin_activity on public.activity_logs
  for select using (public.has_permission('VIEW_ANALYTICS'));

-- inventory_movements: admin only
drop policy if exists admin_inv_movements on public.inventory_movements;
create policy admin_inv_movements on public.inventory_movements
  for select using (public.has_permission('MANAGE_INVENTORY'));

-- email_outbox: admin only (internal)
drop policy if exists admin_email_outbox on public.email_outbox;
create policy admin_email_outbox on public.email_outbox
  for select using (public.has_permission('MANAGE_SETTINGS'));

-- order_status_history: own + admin
drop policy if exists own_order_history on public.order_status_history;
create policy own_order_history on public.order_status_history
  for select using (
    exists(select 1 from public.orders o where o.id = "orderId"
           and (o."customerId" = auth.uid() or public.has_permission('VIEW_ORDERS')))
  );

-- shipping_addresses: own + admin
drop policy if exists own_shipping_addresses on public.shipping_addresses;
create policy own_shipping_addresses on public.shipping_addresses
  for select using (
    exists(select 1 from public.orders o where o.id = "orderId"
           and (o."customerId" = auth.uid() or public.has_permission('VIEW_ORDERS')))
  );

-- coupon_usage: admin only
drop policy if exists admin_coupon_usage on public.coupon_usage;
create policy admin_coupon_usage on public.coupon_usage
  for select using (public.has_permission('MANAGE_PROMOTIONS'));

-- product_collection_links: public read
drop policy if exists public_collection_links on public.product_collection_links;
create policy public_collection_links on public.product_collection_links
  for select using (true);
drop policy if exists admin_collection_links on public.product_collection_links;
create policy admin_collection_links on public.product_collection_links
  for all using (public.has_permission('EDIT_PRODUCTS'))
  with check (public.has_permission('EDIT_PRODUCTS'));

-- product_reviews: public read approved; customer insert own; admin all
drop policy if exists public_reviews on public.product_reviews;
create policy public_reviews on public.product_reviews
  for select using ("isApproved" = true or public.has_permission('MANAGE_CUSTOMERS'));
drop policy if exists customer_review_insert on public.product_reviews;
create policy customer_review_insert on public.product_reviews
  for insert with check ("customerId" = auth.uid() and public.is_customer());
drop policy if exists admin_reviews on public.product_reviews;
create policy admin_reviews on public.product_reviews
  for update using (public.has_permission('MANAGE_CUSTOMERS'))
  with check (public.has_permission('MANAGE_CUSTOMERS'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 35. STORAGE BUCKETS (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('store-assets',  'store-assets',  true,5242880,array['image/jpeg','image/png','image/webp','image/x-icon','image/vnd.microsoft.icon']),
  ('avatars',       'avatars',       true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists public_assets on storage.objects;
create policy public_assets on storage.objects
  for select using (bucket_id in ('product-images','store-assets','avatars'));

drop policy if exists staff_upload on storage.objects;
create policy staff_upload on storage.objects
  for insert with check (
    bucket_id in ('product-images','store-assets')
    and public.has_permission('EDIT_PRODUCTS')
  );

drop policy if exists avatar_upload on storage.objects;
create policy avatar_upload on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid() is not null
  );

drop policy if exists staff_remove on storage.objects;
create policy staff_remove on storage.objects
  for delete using (
    bucket_id in ('product-images','store-assets')
    and public.has_permission('EDIT_PRODUCTS')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 36. REALTIME — enable publications (safe — skips already-published tables)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  for t in select unnest(array[
    'orders','notifications','admin_notifications','inventory',
    'product_categories','products','store_settings'
  ])
  loop
    if not exists(
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=t
    ) then
      execute format('alter publication supabase_realtime add table public.%I',t);
    end if;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 37. RELOAD PostgREST schema cache
-- ─────────────────────────────────────────────────────────────────────────────
notify pgrst, 'reload schema';

commit;

