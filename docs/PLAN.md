# Plan de trabajo

Sistema administrativo para tienda física (decoración, cerámicas, peluches, regalos).
Alcance: la aplicación administrativa (fases 0–7) y, en la etapa 2, lo que la tienda virtual necesita de este repositorio. Sin pagos electrónicos, sin AWS.

Cada fase deja el proyecto funcional y se valida antes de pasar a la siguiente.

## Estado

| Paso | Contenido | Estado |
|------|-----------|--------|
| 0 | Planeación, arquitectura, modelo de datos (documentos) y base del proyecto configurada | ✅ Hecho |
| 1 | Autenticación + migración inicial de base de datos | ✅ Hecho |
| 2 | Dashboard y categorías | ✅ Hecho |
| 3 | Productos e imágenes | ✅ Hecho |
| 4 | Inventario transaccional | ✅ Hecho |
| 5 | Ventas físicas | ✅ Hecho |
| 6 | Historial, reportes, permisos y configuración | ✅ Hecho — pendiente de tu prueba contra Supabase |
| 7 | Empaquetado con Tauri 2 | ⏳ Pendiente |
| E2 | Tienda virtual pública ([detalle](#etapa-2--tienda-virtual)) | 🚧 En curso — base de datos y controles de publicación hechos |

## Paso 0 — Base del proyecto (este entregable)

- Vite + React 19 + TypeScript estricto, alias `@/`.
- Tailwind CSS v4 + shadcn/ui (paleta neutra, tipografía Geist, iconos Lucide).
- React Router, TanStack Query, React Hook Form, Zod y cliente de Supabase instalados y configurados.
- Layout base: sidebar de navegación, header y rutas de cada módulo con un estado "en construcción".
- Validación de variables de entorno y `.env.example`.
- Documentos: este plan, [arquitectura](./ARCHITECTURE.md) y [modelo de datos](./DATA_MODEL.md).


## Fase 1 — Autenticación y base de datos

- Migración SQL inicial: todas las tablas, enums, índices, triggers de auditoría y RLS del [modelo de datos](./DATA_MODEL.md).
- Tipos TypeScript generados desde el esquema (`src/types/database.ts`).
- Login con correo y contraseña (Supabase Auth), cierre de sesión, sesión persistente.
- Rutas protegidas y carga del perfil (`profiles`) con su rol.
- Menú de usuario en el header.
- **Verificación:** un usuario inactivo o sin sesión no entra; un usuario válido ve el layout.

## Fase 2 — Dashboard y categorías

- CRUD de categorías (crear, editar, activar/desactivar) — primer módulo completo, fija el patrón del resto.
- Componentes compartidos: tabla de datos con paginación, diálogo de confirmación, estados vacío/carga/error.
- Dashboard con indicadores reales (función `get_dashboard_summary`) y actividad reciente. Las ventas del día ya se consultan; mostrarán datos cuando exista el módulo de ventas (fase 5). Productos más vendidos y gráficos: fases 5 y 6.

## Fase 3 — Productos e imágenes

- CRUD de productos, búsqueda, filtros por categoría y disponibilidad, activar/desactivar, vista de detalle.
- Subida, orden y eliminación de fotografías en Supabase Storage (bucket `product-images`).
- Vista `product_list` para listar con filtros, estado de existencias y búsqueda sin tildes; paginación en el servidor.
- Búsqueda global del header (lleva a la lista de productos filtrada).
- El stock nunca se escribe directamente: las existencias iniciales se registran como un movimiento de entrada (fase 4).
- `is_published` existe en la base de datos pero no se muestra en la interfaz hasta que haya catálogo público.

## Fase 4 — Inventario

- Funciones RPC `register_inventory_movement` (entrada, salida) y `adjust_inventory` (ajuste al valor contado, solo administrador), con bloqueo de fila y validación de no-negativos.
- Pantalla de existencias con avisos de bajo inventario y agotados, y formularios de entrada, salida y ajuste.
- Campo "Existencias iniciales" al crear un producto: se registra como una entrada de inventario.

## Fase 5 — Ventas físicas

- Punto de venta (`/ventas/nueva`): buscar productos activos, carrito con cantidades limitadas a las existencias, subtotales y total en COP, método de pago, notas y confirmación.
- Función RPC `create_sale`: crea venta + ítems + movimientos y descuenta stock en una sola transacción, con los precios de la base de datos.
- Historial de ventas con filtros por fecha, método de pago y estado, y detalle de cada venta.
- Anulación con `cancel_sale` (solo administrador, exige motivo): devuelve el stock y deja la venta registrada como anulada.
- Dashboard: productos más vendidos de los últimos 30 días (`get_top_products`).

## Fase 6 — Historial, reportes y permisos

- Historial de movimientos (vista `movement_list`) con filtros por producto, tipo, usuario y rango de fechas. Solo lectura.
- Dashboard: gráfico de ingresos por día (últimos 14 días, con vista de tabla) y estado del inventario.
- Configuración:
  - **Negocio:** nombre, NIT, teléfono, dirección, correo y umbral de bajo inventario. Solo el administrador edita.
  - **Usuarios** (solo administrador): cambiar rol, activar y desactivar. El alta de usuarios se hace en el panel de Supabase.
  - **Mi cuenta:** cambiar el propio nombre.
- Revisión de permisos: cada restricción de la interfaz tiene su equivalente en RLS o en las funciones RPC (matriz en [DATA_MODEL.md](./DATA_MODEL.md#permisos-por-rol)).

## Fase 7 — Tauri 2

- `src-tauri/`, configuración de ventana, iconos y build del instalador para Windows.
- Sin funcionalidades nativas adicionales.

## Etapa 2 — Tienda virtual

Catálogo público para clientes, en un repositorio aparte (`brisa10-catalog`, Astro) que comparte este proyecto de Supabase. Sin pagos ni cuentas de cliente: el pedido se envía por WhatsApp y **no descuenta inventario**; el descuento ocurre al registrar la venta aquí.

En este repositorio:

- Migración `20261111000007_public_catalog.sql`: `slug` en productos y categorías, `products.is_featured` y las funciones de lectura pública (ver [modelo de datos](./DATA_MODEL.md#catálogo-público)).
- Productos: interruptores "Publicar en la tienda virtual" y "Producto destacado" en el formulario, acción de publicar en la lista y el detalle, e indicadores de publicado y destacado. Solo administrador.

Decisiones:

1. **Funciones RPC en lugar de vista o RLS para `anon`:** RLS no oculta columnas y una vista deja la consulta en manos del cliente. Las funciones fijan columnas, búsqueda y tope de filas.
2. **El pedido no se guarda en la base** en esta versión: se verifica con `check_public_cart` y viaja por WhatsApp.
3. **Stock exacto nunca se publica:** solo `disponible`, `ultimas_unidades` o `agotado`.
4. **Slug estable:** se genera al crear y no cambia con el nombre, para no romper enlaces compartidos.

## Decisiones tomadas

1. **Permisos del operador:** registra ventas y entradas/salidas, consulta todo. Ajustes, anulaciones, edición de productos/categorías, usuarios y configuración: solo administrador.
2. **Costo de adquisición:** solo lo ve el administrador (tabla `product_costs`).
3. **Métodos de pago:** efectivo, transferencia, Nequi, Daviplata, tarjeta, otro.
4. **Alta de usuarios:** desde el panel de Supabase; el primero queda como administrador. Rol y estado se administran desde la app (fase 6).
5. **SKU:** campo opcional y único.
6. **Fotos:** bucket público de Storage; solo el administrador escribe.
7. **Migraciones:** las aplicas tú en el editor SQL de Supabase; el frontend solo usa la clave `anon`.
