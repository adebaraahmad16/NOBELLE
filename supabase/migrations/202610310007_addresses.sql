create function public.save_address(address_id uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid=auth.uid(); result jsonb; old public.customer_addresses;
begin
 if not public.is_customer() then raise exception 'Sign in to save addresses' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if address_id is not null then select * into strict old from public.customer_addresses where id=address_id and "customerId"=uid for update; end if;
 if coalesce((payload->>'isDefault')::boolean,false) then update public.customer_addresses set "isDefault"=false where "customerId"=uid; end if;
 if address_id is null then
  insert into public.customer_addresses("customerId",recipient,"phoneNumber",street,city,state,country,"postalCode","isDefault") values(uid,payload->>'recipient',payload->>'phoneNumber',payload->>'street',payload->>'city',payload->>'state',coalesce(payload->>'country','Nigeria'),payload->>'postalCode',coalesce((payload->>'isDefault')::boolean,false)) returning to_jsonb(customer_addresses.*) into result;
 else
  update public.customer_addresses set recipient=coalesce(payload->>'recipient',old.recipient),"phoneNumber"=coalesce(payload->>'phoneNumber',old."phoneNumber"),street=coalesce(payload->>'street',old.street),city=coalesce(payload->>'city',old.city),state=coalesce(payload->>'state',old.state),country=coalesce(payload->>'country',old.country),"postalCode"=coalesce(payload->>'postalCode',old."postalCode"),"isDefault"=coalesce((payload->>'isDefault')::boolean,old."isDefault") where id=address_id and "customerId"=uid returning to_jsonb(customer_addresses.*) into result;
 end if;
 return result;
end; $$;
revoke execute on function public.save_address(uuid,jsonb) from public,anon;
grant execute on function public.save_address(uuid,jsonb) to authenticated;
drop policy own_addresses on public.customer_addresses;
create policy own_addresses on public.customer_addresses for select to authenticated using(("customerId"=auth.uid() and public.is_customer()) or public.has_permission('VIEW_CUSTOMERS'));
create policy delete_own_address on public.customer_addresses for delete to authenticated using("customerId"=auth.uid() and public.is_customer());
revoke insert,update on public.customer_addresses from authenticated;
