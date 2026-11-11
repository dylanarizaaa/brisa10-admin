-- =============================================================================
-- Fase 6 — Historial de movimientos, reportes y usuarios
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vista para consultar el historial de movimientos con el nombre del producto,
-- el usuario responsable y el número de venta, y con texto de búsqueda sin tildes.
-- security_invoker: respeta el RLS de las tablas. Solo lectura.
-- -----------------------------------------------------------------------------
create view public.movement_list
with (security_invoker = true)
as
select
  m.id,
  m.product_id,
  p.name as product_name,
  p.sku as product_sku,
  m.type,
  m.quantity,
  m.stock_before,
  m.stock_after,
  m.reason,
  m.sale_id,
  s.sale_number,
  m.created_by,
  u.full_name as user_name,
  m.created_at,
  lower(extensions.unaccent(p.name || ' ' || coalesce(p.sku, ''))) as search_text
from public.inventory_movements m
join public.products p on p.id = m.product_id
join public.profiles u on u.id = m.created_by
left join public.sales s on s.id = m.sale_id;

revoke all on public.movement_list from anon, authenticated;
grant select on public.movement_list to authenticated;

-- -----------------------------------------------------------------------------
-- Ventas por día de los últimos p_days días (hora de Colombia), incluyendo los
-- días sin ventas, para graficar. Solo ventas completadas. Respeta RLS.
-- -----------------------------------------------------------------------------
create function public.get_sales_by_day(p_days integer default 14)
returns table (day date, sales_count bigint, revenue bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with days as (
    select generate_series(
      (now() at time zone 'America/Bogota')::date - (least(greatest(p_days, 1), 366) - 1),
      (now() at time zone 'America/Bogota')::date,
      interval '1 day'
    )::date as day
  )
  select d.day, count(s.id)::bigint, coalesce(sum(s.total), 0)::bigint
  from days d
  left join public.sales s
    on s.status = 'completada'
   and (s.created_at at time zone 'America/Bogota')::date = d.day
  group by d.day
  order by d.day;
$$;

revoke execute on function public.get_sales_by_day(integer) from public, anon;
grant execute on function public.get_sales_by_day(integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Usuarios del sistema con su correo, para la pantalla de configuración.
-- El correo vive en auth.users, que el frontend no puede leer; por eso esta
-- función es SECURITY DEFINER y solo responde a administradores.
-- -----------------------------------------------------------------------------
create function public.list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role public.user_role,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede consultar los usuarios' using errcode = '42501';
  end if;

  return query
  select p.id, p.full_name, u.email::text, p.role, p.is_active, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.full_name;
end;
$$;

revoke execute on function public.list_users() from public, anon;
grant execute on function public.list_users() to authenticated;
