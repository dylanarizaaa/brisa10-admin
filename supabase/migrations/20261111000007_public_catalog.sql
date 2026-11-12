-- =============================================================================
-- Etapa 2 — Catálogo público
-- Lo que el sitio público (rol anon) puede leer, y nada más.
--
-- Decisión: funciones RPC SECURITY DEFINER en lugar de una vista o de políticas
-- RLS para anon. RLS filtra filas, no columnas: abrir products a anon expondría
-- stock, min_stock y created_by. Con una vista, el cliente controla la consulta
-- (columnas, filtros, cantidad de filas). Las funciones fijan las columnas, el
-- tope de filas por página y la búsqueda. Las tablas base siguen cerradas a anon.
--
-- Nunca se devuelve: stock exacto, min_stock, costo, sku, created_by.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Slugs (URL amigables) y productos destacados
-- -----------------------------------------------------------------------------

-- "Maceta Cerámica #2" -> "maceta-ceramica-2"
create function public.slugify(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(lower(extensions.unaccent(coalesce(p_text, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

-- Slug libre en la tabla indicada: agrega -2, -3… si ya existe.
create function public.unique_slug(p_table text, p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text := left(public.slugify(p_name), 80);
  v_slug text;
  v_n integer := 1;
  v_taken boolean;
begin
  if p_table not in ('products', 'categories') then
    raise exception 'Tabla no admitida: %', p_table;
  end if;
  v_base := trim(both '-' from v_base);
  if v_base = '' then
    v_base := case p_table when 'products' then 'producto' else 'categoria' end;
  end if;
  v_slug := v_base;
  loop
    execute format('select exists (select 1 from public.%I where slug = $1)', p_table)
      into v_taken using v_slug;
    exit when not v_taken;
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;
  return v_slug;
end;
$$;

revoke execute on function public.slugify(text) from public, anon, authenticated;
revoke execute on function public.unique_slug(text, text) from public, anon, authenticated;

alter table public.categories add column slug text;
alter table public.products add column slug text;
alter table public.products add column is_featured boolean not null default false;

-- Slugs de lo que ya existe, en orden de creación.
do $$
declare
  r record;
begin
  for r in select id, name from public.categories order by created_at, id loop
    update public.categories set slug = public.unique_slug('categories', r.name) where id = r.id;
  end loop;
  for r in select id, name from public.products order by created_at, id loop
    update public.products set slug = public.unique_slug('products', r.name) where id = r.id;
  end loop;
end;
$$;

alter table public.categories
  alter column slug set not null,
  add constraint categories_slug_key unique (slug),
  add constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.products
  alter column slug set not null,
  add constraint products_slug_key unique (slug),
  add constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- El slug se asigna al crear y no cambia aunque cambie el nombre: los enlaces
-- compartidos en redes siguen funcionando. El frontend no tiene permiso de
-- escritura sobre la columna.
create function public.set_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.slug is null then
    new.slug := public.unique_slug(tg_table_name, new.name);
  end if;
  return new;
end;
$$;

revoke execute on function public.set_slug() from public, anon, authenticated;

create trigger categories_set_slug
  before insert on public.categories
  for each row execute function public.set_slug();
create trigger products_set_slug
  before insert on public.products
  for each row execute function public.set_slug();

grant insert (is_featured) on public.products to authenticated;
grant update (is_featured) on public.products to authenticated;

-- La vista del admin ahora incluye destacado y slug (columnas nuevas al final).
create or replace view public.product_list
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
  lower(extensions.unaccent(p.name || ' ' || coalesce(p.sku, ''))) as search_text,
  p.is_featured,
  p.slug
from public.products p
join public.categories c on c.id = p.category_id
cross join public.business_settings s;

-- -----------------------------------------------------------------------------
-- Lectura pública
-- -----------------------------------------------------------------------------

-- Fuente única de "qué es público" para todas las funciones de abajo.
-- No es accesible desde el frontend: solo la usan las funciones SECURITY DEFINER.
create view public.public_products
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.name,
  p.description,
  p.price,
  p.stock, -- uso interno (check_public_cart); nunca se devuelve
  case
    when p.stock = 0 then 'agotado'
    when p.stock <= coalesce(p.min_stock, s.low_stock_threshold) then 'ultimas_unidades'
    else 'disponible'
  end as availability,
  p.is_featured,
  p.category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.is_active as category_is_active,
  (
    select i.storage_path
    from public.product_images i
    where i.product_id = p.id
    order by i.position, i.created_at
    limit 1
  ) as main_image_path,
  p.created_at,
  p.updated_at
from public.products p
join public.categories c on c.id = p.category_id
cross join public.business_settings s
where p.is_published and p.is_active;

revoke all on public.public_products from anon, authenticated;

-- Tarjeta de producto: lo que se muestra en una lista.
create function public.public_product_card(p public.public_products)
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
    'main_image_path', p.main_image_path
  );
$$;

revoke execute on function public.public_product_card(public.public_products) from public, anon, authenticated;

-- Catálogo paginado. p_sort: 'recientes' | 'precio_asc' | 'precio_desc'.
-- Devuelve { items: [...], total, limit, offset }. Máximo 48 filas por llamada.
create function public.get_public_catalog(
  p_search text default null,
  p_category text default null,
  p_sort text default 'recientes',
  p_featured boolean default false,
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 24), 1), 48);
  v_offset integer := least(greatest(coalesce(p_offset, 0), 0), 10000);
  v_term text := nullif(lower(extensions.unaccent(left(trim(coalesce(p_search, '')), 80))), '');
  v_pattern text;
  v_category text := nullif(trim(coalesce(p_category, '')), '');
  v_sort text := coalesce(p_sort, 'recientes');
  v_total integer;
  v_items jsonb;
begin
  if v_sort not in ('recientes', 'precio_asc', 'precio_desc') then
    v_sort := 'recientes';
  end if;
  if v_term is not null then
    -- Los comodines de LIKE escritos por el cliente se buscan literalmente.
    v_pattern := '%' || replace(replace(replace(v_term, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  select count(*) into v_total
  from public.public_products p
  where (v_pattern is null or lower(extensions.unaccent(p.name)) like v_pattern)
    and (v_category is null or p.category_slug = v_category)
    and (not coalesce(p_featured, false) or p.is_featured);

  select coalesce(jsonb_agg(sub.card order by sub.rn), '[]'::jsonb)
  into v_items
  from (
    select public.public_product_card(p) as card,
      row_number() over (
        order by
          case when v_sort = 'precio_asc' then p.price end asc,
          case when v_sort = 'precio_desc' then p.price end desc,
          p.created_at desc,
          p.id
      ) as rn
    from public.public_products p
    where (v_pattern is null or lower(extensions.unaccent(p.name)) like v_pattern)
      and (v_category is null or p.category_slug = v_category)
      and (not coalesce(p_featured, false) or p.is_featured)
    order by rn
    limit v_limit offset v_offset
  ) sub;

  return jsonb_build_object('items', v_items, 'total', v_total, 'limit', v_limit, 'offset', v_offset);
end;
$$;

-- Detalle por slug, con galería y hasta 4 productos relacionados (misma categoría).
-- Devuelve null si no existe, no está publicado o está inactivo.
create function public.get_public_product(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.public_product_card(p) || jsonb_build_object(
    'description', p.description,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'images', (
      select coalesce(jsonb_agg(i.storage_path order by i.position, i.created_at), '[]'::jsonb)
      from public.product_images i
      where i.product_id = p.id
    ),
    'related', (
      select coalesce(jsonb_agg(r.card order by r.rn), '[]'::jsonb)
      from (
        select public.public_product_card(r0) as card,
          row_number() over (order by (r0.availability = 'agotado'), r0.created_at desc, r0.id) as rn
        from public.public_products r0
        where r0.category_id = p.category_id and r0.id <> p.id
        order by rn
        limit 4
      ) r
    )
  )
  from public.public_products p
  where p.slug = p_slug;
$$;

-- Categorías activas con al menos un producto publicado.
create function public.get_public_categories()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(c) order by c.name), '[]'::jsonb)
  from (
    select p.category_slug as slug, p.category_name as name, count(*)::integer as product_count,
      -- Foto de portada de la categoría: la del producto más reciente que tenga foto.
      (array_agg(p.main_image_path order by p.created_at desc)
        filter (where p.main_image_path is not null))[1] as image_path
    from public.public_products p
    where p.category_is_active
    group by p.category_slug, p.category_name
  ) c;
$$;

-- Datos de contacto del negocio (sin NIT ni configuración interna).
create function public.get_public_business()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'business_name', s.business_name,
    'phone', s.phone,
    'address', s.address,
    'email', s.email
  )
  from public.business_settings s;
$$;

-- Verificación del carrito antes de enviar el pedido por WhatsApp.
-- p_items: [{ "product_id": uuid, "quantity": 1..99 }], máximo 50 líneas.
-- Devuelve por línea el precio vigente y si la cantidad pedida está disponible;
-- los productos que ya no son públicos vuelven con found = false.
-- No registra nada ni descuenta inventario: el pedido es una intención.
create function public.check_public_cart(p_items jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'El pedido tiene demasiados productos' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where jsonb_typeof(e) <> 'object'
      or jsonb_typeof(e -> 'quantity') is distinct from 'number'
      or (e ->> 'quantity')::numeric <> trunc((e ->> 'quantity')::numeric)
      or (e ->> 'quantity')::numeric not between 1 and 99
      or coalesce(e ->> 'product_id', '') !~* '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'
  ) then
    raise exception 'El pedido tiene datos no válidos' using errcode = 'P0001';
  end if;

  select jsonb_agg(
    case when p.id is null then
      jsonb_build_object('product_id', i.product_id, 'found', false)
    else
      public.public_product_card(p) || jsonb_build_object(
        'product_id', p.id,
        'found', true,
        'quantity', i.quantity,
        'quantity_available', p.stock >= i.quantity
      )
    end
    order by i.ord
  )
  into v_result
  from (
    select (e ->> 'product_id')::uuid as product_id, (e ->> 'quantity')::integer as quantity, ord
    from jsonb_array_elements(p_items) with ordinality as t(e, ord)
  ) i
  left join public.public_products p on p.id = i.product_id;

  return v_result;
end;
$$;

revoke execute on function public.get_public_catalog(text, text, text, boolean, integer, integer) from public;
revoke execute on function public.get_public_product(text) from public;
revoke execute on function public.get_public_categories() from public;
revoke execute on function public.get_public_business() from public;
revoke execute on function public.check_public_cart(jsonb) from public;

grant execute on function public.get_public_catalog(text, text, text, boolean, integer, integer) to anon, authenticated;
grant execute on function public.get_public_product(text) to anon, authenticated;
grant execute on function public.get_public_categories() to anon, authenticated;
grant execute on function public.get_public_business() to anon, authenticated;
grant execute on function public.check_public_cart(jsonb) to anon, authenticated;
