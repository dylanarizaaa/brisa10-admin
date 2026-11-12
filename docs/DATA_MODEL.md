# Modelo de datos inicial

Implementado en `supabase/migrations/`. Las funciones RPC de inventario y ventas llegan en las fases 4 y 5.

## Diagrama

```
auth.users ──1:1── profiles
                      │ (created_by)
categories ──1:N── products ──1:N── product_images
                      │ └──1:1── product_costs (solo admin)
                      │
                      ├──1:N── inventory_movements ──N:1── sales (opcional)
                      │
sales ──1:N── sale_items ──N:1── products

business_settings (una sola fila)
```

## Convenciones

- Claves primarias `uuid` (`gen_random_uuid()`), salvo `business_settings`.
- `created_at` / `updated_at` (`timestamptz`) en las tablas editables; `updated_at` se mantiene con un trigger.
- Dinero en **enteros COP** (`integer`), sin decimales.
- Nada se borra físicamente: productos, categorías y usuarios se desactivan (`is_active`), las ventas se anulan.

## Enums

| Enum | Valores |
|------|---------|
| `user_role` | `admin`, `operador` |
| `movement_type` | `entrada`, `salida`, `ajuste`, `venta`, `cancelacion`, `devolucion` |
| `sale_status` | `completada`, `anulada` |
| `payment_method` | `efectivo`, `transferencia`, `nequi`, `daviplata`, `tarjeta`, `otro` |

## Tablas

### profiles
Extiende `auth.users`. Se crea automáticamente con un trigger al registrar un usuario.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | FK → `auth.users(id)` on delete cascade |
| full_name | text | not null |
| role | user_role | default `operador` |
| is_active | boolean | default true |
| created_at, updated_at | timestamptz | |

### categories

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| name | text | not null, único sin distinguir mayúsculas |
| slug | text | único; se genera del nombre al crear y no cambia |
| description | text | |
| is_active | boolean | default true |
| created_at, updated_at | timestamptz | |

Datos iniciales: Cerámicas, Peluches, Decoración, Regalos, Accesorios, Otros.

### products

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| sku | text | opcional, único |
| name | text | not null |
| description | text | |
| category_id | uuid | FK → `categories(id)`, on delete restrict |
| price | integer | not null, `check (price >= 0)` |
| stock | integer | not null default 0, **`check (stock >= 0)`** |
| min_stock | integer | opcional; si es null se usa el umbral global |
| is_active | boolean | default true |
| is_published | boolean | default false — visible en la tienda virtual si además está activo |
| is_featured | boolean | default false — sección de destacados de la tienda virtual |
| slug | text | único; se genera del nombre al crear (`maceta-ceramica`, `-2` si se repite) y no cambia. El frontend no puede escribirlo |
| created_by | uuid | FK → `profiles(id)`, se asigna solo (`auth.uid()`) |
| created_at, updated_at | timestamptz | |

Índices: `category_id`, `is_active`, parcial `(is_published) where is_published and is_active`, y trigram sobre `name` para la búsqueda.

`stock` no es editable desde el frontend: el rol `authenticated` no recibe permiso `UPDATE` sobre esa columna. Solo cambian las funciones RPC.

### product_costs
Costo de adquisición (opcional). Va en tabla aparte porque RLS no puede ocultar una sola columna y el costo solo lo ve el administrador.

| Columna | Tipo | Notas |
|---------|------|-------|
| product_id | uuid PK | FK → `products(id)` on delete cascade |
| cost | integer | not null, `check (cost >= 0)` |
| updated_at | timestamptz | |

### product_images
Las fotos viven en Supabase Storage (bucket `product-images`); aquí solo se guarda la ruta.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| product_id | uuid | FK → `products(id)` on delete cascade |
| storage_path | text | not null, único |
| position | integer | orden; la posición 0 es la foto principal |
| created_at | timestamptz | |

Se propone tabla aparte (en lugar de un arreglo en `products`) porque permite ordenar, borrar una foto y aplicar RLS para el catálogo sin reescribir el producto.

### inventory_movements
Registro inmutable. Solo se inserta desde las funciones RPC.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| product_id | uuid | FK → `products(id)`, on delete restrict |
| type | movement_type | not null |
| quantity | integer | not null, `check (quantity <> 0)`; positivo suma, negativo resta |
| stock_before | integer | not null |
| stock_after | integer | not null, `check (stock_after >= 0)`, `check (stock_after = stock_before + quantity)` |
| reason | text | obligatorio en `salida` y `ajuste` |
| sale_id | uuid | FK → `sales(id)`, solo en `venta` / `cancelacion` |
| created_by | uuid | FK → `profiles(id)`, not null |
| created_at | timestamptz | not null default now() |

Índices: `(product_id, created_at desc)`, `(type)`, `(created_by)`, `(created_at desc)`, `(sale_id)`.

Sin políticas de `UPDATE` ni `DELETE`, y un trigger que rechaza ambas operaciones aunque alguien las intente con otro rol.

### sales

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| sale_number | bigint | único, generado por secuencia (consecutivo visible) |
| status | sale_status | default `completada` |
| payment_method | payment_method | not null |
| total | integer | not null, `check (total >= 0)` |
| notes | text | |
| created_by | uuid | FK → `profiles(id)`, not null |
| created_at | timestamptz | fecha de la venta |
| cancelled_at | timestamptz | |
| cancelled_by | uuid | FK → `profiles(id)` |
| cancel_reason | text | |

Índices: `(created_at desc)`, `(status)`, `(created_by)`.

### sale_items
Guarda una copia del nombre y precio al momento de vender, para que el historial no cambie si luego se edita el producto.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| sale_id | uuid | FK → `sales(id)` on delete cascade |
| product_id | uuid | FK → `products(id)`, on delete restrict |
| product_name | text | not null (copia) |
| unit_price | integer | not null, `check (unit_price >= 0)` |
| quantity | integer | not null, `check (quantity > 0)` |
| subtotal | integer | not null, `check (subtotal = unit_price * quantity)` |

Índices: `(sale_id)`, `(product_id)`.

### business_settings
Una sola fila (`id boolean primary key default true check (id)`).

| Columna | Tipo | Notas |
|---------|------|-------|
| business_name | text | not null |
| nit, phone, address, email | text | opcionales |
| low_stock_threshold | integer | default 5, `check (>= 0)`; umbral global de bajo inventario |
| updated_at | timestamptz | |

## Vistas

| Vista | Hace |
|-------|------|
| `product_list` | Productos con nombre de categoría, mínimo efectivo (`effective_min_stock`), estado de existencias (`stock_status`: `disponible`, `bajo`, `agotado`), ruta de la foto principal y `search_text` (nombre + SKU en minúsculas y sin tildes). `security_invoker`: respeta el RLS de las tablas. No incluye el costo. Solo lectura. |
| `movement_list` | Movimientos de inventario con nombre y código del producto, nombre del usuario responsable, número de venta y `search_text`. `security_invoker`. Solo lectura. |

## Funciones de consulta

| Función | Hace | Rol |
|---------|------|-----|
| `get_dashboard_summary()` | Devuelve en un solo viaje los contadores del dashboard: productos registrados, disponibles, agotados, con bajo inventario, inactivos, y ventas e ingresos del día (hora de Colombia). Respeta RLS. | Ambos |
| `get_top_products(days, limit)` | Productos más vendidos (unidades e ingresos) de los últimos `days` días, solo ventas completadas. Respeta RLS. | Ambos |
| `get_sales_by_day(days)` | Ventas completadas e ingresos de cada uno de los últimos `days` días (hora de Colombia), incluidos los días sin ventas. Respeta RLS. | Ambos |
| `list_users()` | Perfiles con su correo (que vive en `auth.users`, inaccesible desde el frontend). `SECURITY DEFINER`. | Admin |

`sale_number` puede tener saltos, porque un intento de venta rechazado (por ejemplo, sin existencias suficientes) consume un número.

Un producto está en **bajo inventario** cuando está activo, tiene existencias y estas son menores o iguales a su `min_stock` (o al umbral global si no tiene uno propio).

## Funciones RPC (transaccionales)

Las funciones públicas son `SECURITY DEFINER`: verifican sesión, usuario activo y rol, y delegan en `apply_stock_change`, que bloquea la fila del producto con `SELECT … FOR UPDATE`, valida que el resultado no sea negativo, actualiza `products.stock` e inserta el movimiento. Los errores de regla de negocio usan SQLSTATE `P0001` con mensaje en español, que la interfaz muestra tal cual.

| Función | Hace | Rol | Fase |
|---------|------|-----|------|
| `register_inventory_movement(product_id, type, quantity, reason)` | Entrada, salida o devolución. `quantity` siempre es positivo; la función decide el signo. La salida exige motivo y falla si no hay existencias suficientes. | Ambos | 4 |
| `adjust_inventory(product_id, new_stock, reason)` | Ajuste manual: fija las existencias al valor contado (no recibe la diferencia). Exige motivo. | Admin | 4 |
| `apply_stock_change(product_id, type, delta, reason, sale_id)` | Interna: no se puede llamar desde el frontend. | — | 4 |
| `create_sale(items, payment_method, notes)` | `items` es `[{product_id, quantity}]`. Bloquea los productos en orden fijo (evita bloqueos mutuos entre ventas simultáneas), valida que estén activos y con stock suficiente, toma el precio **desde la base de datos** (ignora cualquier precio enviado), crea venta + ítems + movimientos `venta` y descuenta stock. Todo o nada. | Ambos | 5 |
| `cancel_sale(sale_id, reason)` | Bloquea la venta (no se puede anular dos veces), devuelve el stock con movimientos `cancelacion` y la marca como anulada con motivo, usuario y fecha. | Admin | 5 |

`devolucion` está disponible en `register_inventory_movement`, pero la interfaz todavía no la ofrece; no se modela un flujo de devoluciones más complejo en esta etapa.

## RLS

RLS activado en todas las tablas. Dos funciones auxiliares: `is_active_user()` y `is_admin()`.

### Permisos por rol

| Recurso | Operador | Administrador |
|---------|----------|---------------|
| Leer productos, categorías, inventario, ventas, movimientos | ✅ | ✅ |
| Crear / editar / desactivar productos y categorías | ❌ | ✅ |
| Subir / borrar fotos | ❌ | ✅ |
| Registrar entrada o salida de mercancía (RPC) | ✅ | ✅ |
| Ajuste manual de inventario (RPC) | ❌ | ✅ |
| Registrar venta (RPC) | ✅ | ✅ |
| Anular venta (RPC) | ❌ | ✅ |
| Ver y editar costo de adquisición | ❌ | ✅ |
| Ver historial de movimientos | ✅ | ✅ |
| Ver datos del negocio | ✅ | ✅ |
| Editar datos del negocio y umbral de bajo inventario | ❌ | ✅ |
| Ver usuarios, cambiar rol, activar o desactivar | ❌ | ✅ |
| Editar su propio nombre | ✅ | ✅ |

- `sales`, `sale_items` e `inventory_movements`: solo `SELECT` para usuarios autenticados; ninguna política de escritura (se escriben únicamente desde las RPC).
- Un usuario no puede cambiar su propio `role` ni `is_active`.
- Un administrador no puede cambiar su propio rol ni desactivarse (evita quedarse sin administradores).
- El primer usuario creado en Supabase Auth queda como `admin`; los siguientes, como `operador`.
- Storage: el bucket `product-images` es **público** (las fotos se muestran por URL directa, con rutas no adivinables, y están destinadas al catálogo). Subir, reemplazar y borrar: solo admin. Límite de 5 MB; JPEG, PNG o WebP.
- El rol `anon` no tiene ningún privilegio sobre las tablas.

## Catálogo público

Migraciones `20261111000007_public_catalog.sql` y `20261111000008_catalog_editorial.sql`. El rol `anon` (tienda virtual) sigue sin privilegios sobre tablas y vistas; solo ejecuta estas funciones `SECURITY DEFINER`, que leen de la vista interna `public_products` (productos con `is_published and is_active`).

| Función | Devuelve |
|---------|----------|
| `get_public_catalog(p_search, p_category, p_sort, p_featured, p_limit, p_offset)` | `{ items, total, limit, offset }`. Búsqueda por nombre sin tildes, filtro por slug de categoría, orden `recientes` / `precio_asc` / `precio_desc`. Máximo 48 filas por llamada. |
| `get_public_product(p_slug)` | Detalle con descripción, galería (`images`) y hasta 4 relacionados de la misma categoría; `null` si no es público. |
| `get_public_categories()` | Categorías activas con al menos un producto público, con descripción, conteo y foto de portada. |
| `get_public_business()` | Nombre, teléfono, dirección y correo del negocio. |
| `check_public_cart(p_items)` | Para `[{product_id, quantity}]` (máx. 50 líneas, cantidad 1–99): precio vigente y si la cantidad está disponible. No registra nada ni descuenta inventario. |

Campos públicos de un producto: `id`, `slug`, `name`, `price`, `availability`, `is_featured`, `category_name`, `category_slug`, `main_image_path`, `second_image_path` (desde la migración 8; la tienda la muestra al pasar el cursor) (y `description`, `images`, `created_at`, `updated_at` en el detalle). **Nunca** salen `stock`, `min_stock`, `sku`, costo ni `created_by`.

`availability`: `agotado` (sin existencias), `ultimas_unidades` (existencias ≤ mínimo efectivo) o `disponible`.

Notas:

- Despublicar o desactivar un producto lo retira de todas las funciones de inmediato.
- La descripción de una categoría (editable en Categorías) aparece en las secciones editoriales de la tienda; si está vacía, la tienda usa un texto genérico.
- Un producto público de una categoría inactiva sigue visible, pero su categoría no aparece en `get_public_categories()`.
- `check_public_cart` responde si una cantidad está disponible, así que con consultas repetidas se puede deducir el stock hasta 99 unidades; es inherente a validar cantidades.
- Las fotos se sirven por la URL pública del bucket `product-images` (no pasa por RLS). `anon` no puede listar el bucket; la foto de un producto no publicado solo es accesible para quien conozca su ruta exacta.
