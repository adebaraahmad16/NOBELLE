-- A revoked Supabase session loses private data access immediately, even while
-- an already-issued access JWT has time remaining before expiry.
create function private.session_valid() returns boolean language sql stable security definer set search_path = '' as $$
 select case when auth.jwt()->>'session_id' is null then false else
 exists(select 1 from auth.sessions where id=(auth.jwt()->>'session_id')::uuid and user_id=auth.uid()) end;
$$;
create or replace function public.has_permission(required text) returns boolean language sql stable security definer set search_path = '' as $$
 select private.session_valid() and exists(select 1 from public.admin_roles a join public.profiles p on p.id=a."userId"
 where a."userId"=auth.uid() and a."isActive" and p."isActive" and
 (a.role='SUPER_ADMIN' or exists(select 1 from public.staff_permissions s where s.role=a.role and s.permission=required)));
$$;
create or replace function public.is_customer() returns boolean language sql stable security definer set search_path = '' as $$
 select private.session_valid() and exists(select 1 from public.profiles where id=auth.uid() and "isActive");
$$;
create function public.admin_security_data() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_customer() or not exists(select 1 from public.admin_roles where "userId"=auth.uid() and "isActive") then raise exception 'Access denied' using errcode='42501'; end if;
 return jsonb_build_object('sessions',(select coalesce(jsonb_agg(s),'[]') from (
  select id,created_at "loginAt",updated_at "lastActiveAt",id::text=auth.jwt()->>'session_id' as current,
  case when user_agent ilike '%Windows%' then 'Windows' when user_agent ilike '%Android%' then 'Android' when user_agent ilike '%iPhone%' then 'iPhone' when user_agent ilike '%Mac%' then 'Mac' else 'Browser' end device,
  case when user_agent ilike '%Firefox%' then 'Firefox' when user_agent ilike '%Edg/%' then 'Edge' when user_agent ilike '%Chrome%' then 'Chrome' when user_agent ilike '%Safari%' then 'Safari' else '' end browser
  from auth.sessions where user_id=auth.uid() order by created_at desc) s),
 'history',(select coalesce(jsonb_agg(h),'[]') from (select id,"createdAt" date,'Supabase Auth' device,'' browser,'SUCCESS' status from public.activity_logs where "adminId"=auth.uid() and action='LOGIN' order by "createdAt" desc limit 30) h));
end; $$;
create function public.revoke_admin_session(session_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_customer() or not exists(select 1 from public.admin_roles where "userId"=auth.uid() and "isActive") then raise exception 'Access denied' using errcode='42501'; end if;
 if session_id::text=auth.jwt()->>'session_id' then raise exception 'Use Sign out for your current session'; end if;
 delete from auth.sessions where id=session_id and user_id=auth.uid();
end; $$;
revoke execute on function public.admin_security_data(),public.revoke_admin_session(uuid) from public,anon;
grant execute on function public.admin_security_data(),public.revoke_admin_session(uuid) to authenticated;
drop policy own_profile on public.profiles;
create policy own_profile on public.profiles for select to authenticated using((id=auth.uid() and public.is_customer()) or public.has_permission('VIEW_CUSTOMERS') or public.has_permission('MANAGE_STAFF'));
drop policy own_role on public.admin_roles;
create policy own_role on public.admin_roles for select to authenticated using(("userId"=auth.uid() and public.is_customer()) or public.has_permission('MANAGE_STAFF'));
