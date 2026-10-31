-- Optional business-event email delivery. Auth emails remain with Supabase Auth.
create table public.email_outbox (
 id uuid primary key default gen_random_uuid(), recipient text not null, subject text not null, body text not null,
 "linkUrl" text, status text not null default 'PENDING' check(status in ('PENDING','PROCESSING','SENT','FAILED')),
 attempts integer not null default 0, "firstAttemptAt" timestamptz, "lockedUntil" timestamptz,
 "notBefore" timestamptz not null default now(), "providerId" text, "lastError" text,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon,authenticated;
grant select on public.email_outbox to authenticated;
grant all on public.email_outbox to service_role;
create policy email_settings_staff on public.email_outbox for select to authenticated using(public.has_permission('MANAGE_SETTINGS'));
create index email_outbox_pending on public.email_outbox("notBefore") where status in ('PENDING','PROCESSING');
create trigger email_touch before update on public.email_outbox for each row execute function private.touch_updated_at();

create or replace function private.notify(event_type text, heading text, detail text, required_permission text, link text default null) returns void language plpgsql security definer set search_path = '' as $$
declare preferences jsonb; business_email text;
begin
 if event_type='newOrder' and not coalesce((select (values->>'orderNotifications')::boolean from public.store_settings where section='orders'),true) then return; end if;
 select values->event_type into preferences from public.store_settings where section='notifications';
 if coalesce((preferences->>'dashboard')::boolean,true) then
  insert into public.admin_notifications(type,title,message,permission,"linkUrl") values(event_type,heading,detail,required_permission,link);
 end if;
 if coalesce((preferences->>'email')::boolean,false) then
  select nullif(trim(values->>'businessEmail'),'') into business_email from public.store_settings where section='store';
  if business_email is not null then
   insert into public.email_outbox(recipient,subject,body,"linkUrl") values(business_email,heading,detail,link);
  else
   insert into public.email_outbox(recipient,subject,body,"linkUrl") select distinct p.email,heading,detail,link from public.profiles p join public.admin_roles a on a."userId"=p.id where a.role='SUPER_ADMIN' and a."isActive" and p."isActive";
  end if;
 end if;
end; $$;

create function public.claim_email_batch() returns setof public.email_outbox language plpgsql security definer set search_path = '' as $$
begin
 -- Provider idempotency has a 24h lifetime. Never resend an uncertain old request.
 update public.email_outbox set status='FAILED',"lastError"='Delivery outcome uncertain; reconcile with the email provider' where status in ('PENDING','PROCESSING') and "firstAttemptAt"<now()-interval '23 hours';
 return query with picked as (
  select id from public.email_outbox where attempts<5 and "notBefore"<=now() and (status='PENDING' or status='PROCESSING' and "lockedUntil"<now()) order by "createdAt" for update skip locked limit 5
 ) update public.email_outbox e set status='PROCESSING',attempts=attempts+1,"firstAttemptAt"=coalesce("firstAttemptAt",now()),"lockedUntil"=now()+interval '5 minutes' from picked where e.id=picked.id returning e.*;
end; $$;
revoke execute on function public.claim_email_batch() from public,anon,authenticated;
grant execute on function public.claim_email_batch() to service_role;

create function private.review_alert() returns trigger language plpgsql security definer set search_path = '' as $$
begin perform private.notify('newProductReview','New product review',new."productId"::text,'EDIT_PRODUCTS','/admin/reviews');return new;end; $$;
create trigger review_alert after insert on public.product_reviews for each row execute function private.review_alert();
create function private.refund_alert() returns trigger language plpgsql security definer set search_path = '' as $$
begin perform private.notify('refundRequest','Refund requested','Amount: NGN '||new.amount,'PROCESS_REFUNDS','/admin/returns');return new;end; $$;
create trigger refund_alert after insert on public.refunds for each row execute function private.refund_alert();
create function private.account_alert() returns trigger language plpgsql security definer set search_path = '' as $$
begin perform private.notify('newCustomer','New account registered',new.email,'VIEW_CUSTOMERS','/admin/customers');return new;end; $$;
create trigger account_alert after insert on public.profiles for each row execute function private.account_alert();
