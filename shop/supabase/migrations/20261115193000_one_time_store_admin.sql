-- Enforce one permanent administrator claim for Urban Threads.
-- Apply after 20261115180000_urban_thread_security_and_orders.sql.

create table if not exists public.store_admin_claim (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  claimed_at timestamptz not null default now()
);
alter table public.store_admin_claim enable row level security;
revoke all on public.store_admin_claim from anon, authenticated;

do $$
declare
  v_admin_count integer;
  v_admin_id uuid;
begin
  select count(*) into v_admin_count
  from public.user_roles
  where role = 'admin';

  if v_admin_count > 1 then
    raise exception 'Urban Threads has more than one administrator. Resolve existing admin roles before applying the one-admin migration.';
  end if;

  if v_admin_count = 1 then
    select user_id into v_admin_id
    from public.user_roles
    where role = 'admin'
    limit 1;

    insert into public.store_admin_claim(singleton, user_id)
    values (true, v_admin_id)
    on conflict (singleton) do nothing;
  end if;
end;
$$;

create or replace function public.enforce_store_admin_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.role = 'admin' then
    perform pg_advisory_xact_lock(hashtext('urban_thread_admin_role_limit'));

    if exists (
      select 1 from public.user_roles
      where role = 'admin' and user_id <> new.user_id
    ) then
      raise exception 'Urban Threads supports exactly one administrator account';
    end if;

    if not exists (
      select 1 from public.store_admin_claim
      where singleton = true and user_id = new.user_id
    ) then
      raise exception 'Administrator access must be claimed through the one-time setup';
    end if;
  end if;

  return new;
end;
$fn$;
revoke all on function public.enforce_store_admin_limit() from public;

drop trigger if exists enforce_store_admin_limit on public.user_roles;
create trigger enforce_store_admin_limit
before insert or update of role on public.user_roles
for each row execute function public.enforce_store_admin_limit();

create or replace function public.claim_first_store_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Sign in before claiming administrator access';
  end if;

  perform pg_advisory_xact_lock(hashtext('urban_thread_admin_role_limit'));

  if exists (select 1 from public.store_admin_claim where singleton = true) then
    raise exception 'The one-time administrator setup has already been claimed';
  end if;

  if exists (select 1 from public.user_roles where role = 'admin') then
    raise exception 'An administrator account already exists';
  end if;

  insert into public.store_admin_claim(singleton, user_id)
  values (true, v_user_id);

  insert into public.user_roles(user_id, role)
  values (v_user_id, 'admin');

  return true;
end;
$fn$;
revoke all on function public.claim_first_store_admin() from public;
grant execute on function public.claim_first_store_admin() to authenticated;
