-- =============================================================================
-- Brisa10 Admin — Esquema inicial
-- Tablas, restricciones, índices, triggers de auditoría, RLS y Storage.
-- Las funciones RPC de inventario y ventas se agregan en las fases 4 y 5.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'operador');
create type public.movement_type as enum ('entrada', 'salida', 'ajuste', 'venta', 'cancelacion', 'devolucion');
create type public.sale_status as enum ('completada', 'anulada');
create type public.payment_method as enum ('efectivo', 'transferencia', 'nequi', 'daviplata', 'tarjeta', 'otro');

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  role public.user_role not null default 'operador',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Funciones auxiliares para las políticas RLS.
-- SECURITY DEFINER: leen profiles sin pasar por RLS (evita recursión en las políticas).
create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active and role = 'admin'
  );
$$;

revoke execute on function public.is_active_user() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Crea el perfil al registrar un usuario en Supabase Auth.
-- El primer usuario del sistema queda como administrador; los demás, como operador.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    ),
    case
      when exists (select 1 from public.profiles) then 'operador'::public.user_role
      else 'admin'::public.user_role
    end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Protege rol y estado: solo un administrador puede cambiarlos, y nunca los propios
-- (evita que el único administrador se bloquee a sí mismo).
-- Los cambios hechos desde el panel de Supabase (sin sesión de usuario) no se restringen.
create function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    if not public.is_admin() then
      raise exception 'Solo un administrador puede cambiar el rol o el estado de un usuario'
        using errcode = '42501';
    end if;
    if old.id = (select auth.uid()) then
      raise exception 'No puedes cambiar tu propio rol ni desactivar tu propia cuenta'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_name_unique on public.categories (lower(name));

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique check (sku is null or length(trim(sku)) > 0),
  name text not null check (length(trim(name)) > 0),
  description text,
  category_id uuid not null references public.categories (id) on delete restrict,
  price integer not null check (price >= 0),
  -- Existencias: solo cambian mediante funciones RPC que registran el movimiento.
  stock integer not null default 0 check (stock >= 0),
  -- Si es null se usa business_settings.low_stock_threshold.
  min_stock integer check (min_stock is null or min_stock >= 0),
  is_active boolean not null default true,
  -- Preparado para el catálogo público (etapa 2).
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active);
create index products_published_idx on public.products (id) where is_published and is_active;
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Costo de adquisición en tabla aparte: RLS no puede ocultar una sola columna,
-- y el costo solo debe verlo el administrador.
create table public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  cost integer not null check (cost >= 0),
  updated_at timestamptz not null default now()
);

create trigger product_costs_set_updated_at
  before update on public.product_costs
  for each row execute function public.set_updated_at();

-- Fotografías: el archivo vive en Storage (bucket product-images); aquí solo la ruta.
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);

-- -----------------------------------------------------------------------------
-- sales / sale_items
-- -----------------------------------------------------------------------------
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number bigint generated always as identity unique,
  status public.sale_status not null default 'completada',
  payment_method public.payment_method not null,
  total integer not null check (total >= 0),
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete restrict,
  cancel_reason text,
  constraint sales_cancel_consistency check (
    (status = 'completada' and cancelled_at is null and cancelled_by is null)
    or (status = 'anulada' and cancelled_at is not null and cancelled_by is not null)
  )
);

create index sales_created_at_idx on public.sales (created_at desc);
create index sales_status_idx on public.sales (status);
create index sales_created_by_idx on public.sales (created_by);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  -- Copia del nombre y precio al momento de la venta.
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal integer not null,
  constraint sale_items_subtotal_check check (subtotal = unit_price * quantity),
  constraint sale_items_unique_product unique (sale_id, product_id)
);

create index sale_items_product_idx on public.sale_items (product_id);

-- -----------------------------------------------------------------------------
-- inventory_movements (registro inmutable)
-- -----------------------------------------------------------------------------
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  type public.movement_type not null,
  -- Positivo suma existencias, negativo resta.
  quantity integer not null check (quantity <> 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  reason text,
  sale_id uuid references public.sales (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint movements_stock_math check (stock_after = stock_before + quantity),
  constraint movements_quantity_sign check (
    (type in ('entrada', 'cancelacion', 'devolucion') and quantity > 0)
    or (type in ('salida', 'venta') and quantity < 0)
    or type = 'ajuste'
  ),
  constraint movements_reason_required check (
    type not in ('salida', 'ajuste') or length(trim(coalesce(reason, ''))) > 0
  ),
  constraint movements_sale_link check (
    (type in ('venta', 'cancelacion')) = (sale_id is not null)
  )
);

create index movements_product_idx on public.inventory_movements (product_id, created_at desc);
create index movements_type_idx on public.inventory_movements (type);
create index movements_created_by_idx on public.inventory_movements (created_by);
create index movements_created_at_idx on public.inventory_movements (created_at desc);
create index movements_sale_idx on public.inventory_movements (sale_id) where sale_id is not null;

create function public.prevent_movement_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Los movimientos de inventario no se pueden modificar ni eliminar'
    using errcode = '42501';
end;
$$;

create trigger inventory_movements_immutable
  before update or delete on public.inventory_movements
  for each row execute function public.prevent_movement_changes();

-- -----------------------------------------------------------------------------
-- business_settings (una sola fila)
-- -----------------------------------------------------------------------------
create table public.business_settings (
  id boolean primary key default true check (id),
  business_name text not null check (length(trim(business_name)) > 0),
  nit text,
  phone text,
  address text,
  email text,
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create trigger business_settings_set_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Privilegios de tabla
-- RLS decide QUÉ filas; estos permisos deciden QUÉ operaciones y columnas.
-- -----------------------------------------------------------------------------

-- Sin sesión no se accede a nada (el catálogo público llegará con una vista propia).
revoke all on all tables in schema public from anon;

-- Ventas y movimientos: solo lectura; se escriben únicamente desde funciones RPC.
revoke insert, update, delete, truncate on public.sales from authenticated;
revoke insert, update, delete, truncate on public.sale_items from authenticated;
revoke insert, update, delete, truncate on public.inventory_movements from authenticated;

-- Productos: el frontend no puede escribir la columna stock.
revoke insert, update, delete, truncate on public.products from authenticated;
grant insert (sku, name, description, category_id, price, min_stock, is_active, is_published)
  on public.products to authenticated;
grant update (sku, name, description, category_id, price, min_stock, is_active, is_published)
  on public.products to authenticated;

-- Perfiles: se crean por trigger y no se eliminan desde la app.
revoke insert, update, delete, truncate on public.profiles from authenticated;
grant update (full_name, role, is_active) on public.profiles to authenticated;

-- Nada se borra físicamente: categorías se desactivan.
revoke delete, truncate on public.categories from authenticated;

-- Configuración: fila única, solo se actualiza.
revoke insert, delete, truncate on public.business_settings from authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_costs enable row level security;
alter table public.product_images enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.business_settings enable row level security;

-- profiles: cada usuario ve su propio perfil (para saber si está inactivo);
-- los usuarios activos ven a todos (nombres en historiales).
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_active_user()));

create policy profiles_update on public.profiles
  for update to authenticated
  using ((select public.is_admin()) or (id = (select auth.uid()) and (select public.is_active_user())))
  with check ((select public.is_admin()) or (id = (select auth.uid()) and (select public.is_active_user())));

-- categories
create policy categories_select on public.categories
  for select to authenticated using ((select public.is_active_user()));
create policy categories_insert on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy categories_update on public.categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- products
create policy products_select on public.products
  for select to authenticated using ((select public.is_active_user()));
create policy products_insert on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy products_update on public.products
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- product_costs: solo administrador
create policy product_costs_admin on public.product_costs
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- product_images
create policy product_images_select on public.product_images
  for select to authenticated using ((select public.is_active_user()));
create policy product_images_insert on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy product_images_update on public.product_images
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy product_images_delete on public.product_images
  for delete to authenticated using ((select public.is_admin()));

-- sales, sale_items, inventory_movements: solo lectura
create policy sales_select on public.sales
  for select to authenticated using ((select public.is_active_user()));
create policy sale_items_select on public.sale_items
  for select to authenticated using ((select public.is_active_user()));
create policy inventory_movements_select on public.inventory_movements
  for select to authenticated using ((select public.is_active_user()));

-- business_settings
create policy business_settings_select on public.business_settings
  for select to authenticated using ((select public.is_active_user()));
create policy business_settings_update on public.business_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Storage: fotografías de productos
-- Bucket público: las fotos se muestran por URL directa (rutas no adivinables) y
-- están destinadas al catálogo. Solo el administrador puede subir, cambiar o borrar.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy product_images_storage_select on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_active_user()));
create policy product_images_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_storage_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Datos iniciales
-- -----------------------------------------------------------------------------
insert into public.business_settings (business_name) values ('Brisa10');

insert into public.categories (name) values
  ('Cerámicas'),
  ('Peluches'),
  ('Decoración'),
  ('Regalos'),
  ('Accesorios'),
  ('Otros');

-- Si ya existían usuarios en Auth antes de aplicar esta migración, se les crea el perfil.
-- El más antiguo queda como administrador.
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Usuario'
  ),
  case when row_number() over (order by u.created_at) = 1
    then 'admin'::public.user_role
    else 'operador'::public.user_role
  end
from auth.users u
on conflict (id) do nothing;
