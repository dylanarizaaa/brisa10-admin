-- =============================================================================
-- Fase 3 — Vista para listar y filtrar productos
-- Calcula en la base de datos lo que el frontend no puede filtrar por sí mismo:
-- estado de existencias (compara dos columnas) y texto de búsqueda sin tildes.
-- security_invoker: la vista respeta el RLS de las tablas de origen.
-- No expone el costo de adquisición (vive en product_costs, solo administrador).
-- =============================================================================

create extension if not exists unaccent with schema extensions;

create view public.product_list
with (security_invoker = true)
as
select
  p.id,
  p.sku,
  p.name,
  p.description,
  p.category_id,
  c.name as category_name,
  p.price,
  p.stock,
  p.min_stock,
  -- Mínimo que realmente aplica: el propio del producto o el umbral global.
  coalesce(p.min_stock, s.low_stock_threshold) as effective_min_stock,
  case
    when p.stock = 0 then 'agotado'
    when p.stock <= coalesce(p.min_stock, s.low_stock_threshold) then 'bajo'
    else 'disponible'
  end as stock_status,
  p.is_active,
  p.is_published,
  p.created_at,
  p.updated_at,
  (
    select i.storage_path
    from public.product_images i
    where i.product_id = p.id
    order by i.position, i.created_at
    limit 1
  ) as main_image_path,
  -- Nombre y SKU en minúsculas y sin tildes, para buscar "ceramica" y encontrar "Cerámica".
  lower(extensions.unaccent(p.name || ' ' || coalesce(p.sku, ''))) as search_text
from public.products p
join public.categories c on c.id = p.category_id
cross join public.business_settings s;

revoke all on public.product_list from anon, authenticated;
grant select on public.product_list to authenticated;
