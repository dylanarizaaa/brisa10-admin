-- =============================================================================
-- Etapa 2 — Rediseño de la tienda virtual
-- Dos datos públicos más, sin exponer nada interno:
--   1. second_image_path en cada tarjeta de producto: la tienda muestra la segunda
--      foto al pasar el cursor.
--   2. description en las categorías: la tienda la usa en sus secciones editoriales.
--      Se edita desde la app administrativa (Categorías).
-- Mismas firmas que en la migración 20261111000007: solo cambia el contenido.
-- =============================================================================

create or replace function public.public_product_card(p public.public_products)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'name', p.name,
    'price', p.price,
    'availability', p.availability,
    'is_featured', p.is_featured,
    'category_name', p.category_name,
    'category_slug', p.category_slug,
    'main_image_path', p.main_image_path,
    'second_image_path', (
      select i.storage_path
      from public.product_images i
      where i.product_id = p.id
      order by i.position, i.created_at
      offset 1
      limit 1
    )
  );
$$;

create or replace function public.get_public_categories()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.name), '[]'::jsonb)
  from (
    select
      c.slug,
      c.name,
      nullif(trim(c.description), '') as description,
      count(*)::integer as product_count,
      -- Foto de portada de la categoría: la del producto más reciente que tenga foto.
      (array_agg(p.main_image_path order by p.created_at desc)
        filter (where p.main_image_path is not null))[1] as image_path
    from public.public_products p
    join public.categories c on c.id = p.category_id
    where c.is_active
    group by c.id
  ) x;
$$;

-- Los privilegios se conservan al reemplazar una función; se repiten por claridad.
revoke execute on function public.public_product_card(public.public_products) from public, anon, authenticated;
revoke execute on function public.get_public_categories() from public;
grant execute on function public.get_public_categories() to anon, authenticated;
