create table if not exists public.edge_rate_limits (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash, window_start)
);

alter table public.edge_rate_limits enable row level security;

create or replace function public.check_edge_rate_limit(
  p_scope text,
  p_key_hash text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_scope is null or btrim(p_scope) = '' then
    raise exception 'scope is required';
  end if;

  if p_key_hash is null or btrim(p_key_hash) = '' then
    raise exception 'key_hash is required';
  end if;

  if p_max_requests < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  delete from public.edge_rate_limits
  where window_start < now() - interval '2 days';

  insert into public.edge_rate_limits (scope, key_hash, window_start, request_count)
  values (p_scope, p_key_hash, v_window_start, 1)
  on conflict (scope, key_hash, window_start)
  do update set
    request_count = public.edge_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  return query select
    v_count <= p_max_requests,
    greatest(p_max_requests - v_count, 0),
    v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.check_edge_rate_limit(text, text, integer, integer) from public;
revoke all on function public.check_edge_rate_limit(text, text, integer, integer) from anon;
revoke all on function public.check_edge_rate_limit(text, text, integer, integer) from authenticated;
grant execute on function public.check_edge_rate_limit(text, text, integer, integer) to service_role;
