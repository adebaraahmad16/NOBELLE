-- Make mutation audit/history complete and retain inventory balances for staff.
alter table public.inventory_movements add column "previousQty" integer;
alter table public.inventory_movements add column "newQty" integer;
create function private.movement_balances() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 select quantity into new."newQty" from public.inventory where "variantId"=new."variantId";
 new."previousQty"=new."newQty"-new.delta;
 return new;
end; $$;
create trigger movement_balances before insert on public.inventory_movements for each row execute function private.movement_balances();
-- Require active profile and role for permission changes, even through direct RPC.
create function private.active_settings_actor() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is not null and not public.has_permission('MANAGE_STAFF') then raise exception 'Active Super Admin required' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; end if;return new;
end; $$;
create trigger active_settings_actor before insert or update or delete on public.staff_permissions for each row execute function private.active_settings_actor();
create function private.audit_login() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.last_sign_in_at is distinct from old.last_sign_in_at and exists(select 1 from public.admin_roles where "userId"=new.id and "isActive") then
  insert into public.activity_logs("adminId",action,entity,"entityId") values(new.id,'LOGIN','auth',new.id::text);
 end if;return new;
end; $$;
create trigger audit_admin_login after update of last_sign_in_at on auth.users for each row execute function private.audit_login();

-- Public consumers get sales aggregates for published products, never order rows.
create function public.product_popularity() returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_object_agg(id,"soldCount"),'{}') from public.products where "isActive" and "archivedAt" is null;
$$;
revoke execute on function public.product_popularity() from public;
grant execute on function public.product_popularity() to anon,authenticated;
