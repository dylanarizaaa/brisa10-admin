-- =============================================================================
-- Fase 2 — Indicadores del dashboard
-- Un solo viaje a la base de datos para todos los contadores.
-- SECURITY INVOKER: se aplica RLS, así que solo usuarios activos obtienen datos.
-- =============================================================================

create function public.get_dashboard_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with settings as (
    select low_stock_threshold from public.business_settings
  ),
  product_stats as (
    select
      count(*) as total,
      count(*) filter (where is_active and stock > 0) as available,
      count(*) filter (where is_active and stock = 0) as out_of_stock,
      count(*) filter (
        where is_active
          and stock > 0
          and stock <= coalesce(min_stock, (select low_stock_threshold from settings), 0)
      ) as low_stock,
      count(*) filter (where not is_active) as inactive
    from public.products
  ),
  sales_today as (
    select count(*) as sales_count, coalesce(sum(total), 0) as revenue
    from public.sales
    where status = 'completada'
      -- "Hoy" según la hora de Colombia, sin importar la zona del servidor.
      and created_at >= date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota'
  )
  select jsonb_build_object(
    'total_products', p.total,
    'available_products', p.available,
    'out_of_stock_products', p.out_of_stock,
    'low_stock_products', p.low_stock,
    'inactive_products', p.inactive,
    'sales_today_count', s.sales_count,
    'sales_today_revenue', s.revenue
  )
  from product_stats p, sales_today s;
$$;

revoke execute on function public.get_dashboard_summary() from public, anon;
grant execute on function public.get_dashboard_summary() to authenticated;
