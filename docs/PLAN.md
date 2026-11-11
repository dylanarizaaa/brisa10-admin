# Plan de trabajo

Sistema administrativo para tienda física (decoración, cerámicas, peluches, regalos).
Alcance de esta etapa: **solo la aplicación administrativa**. Sin catálogo público, sin pagos electrónicos, sin AWS.

Cada fase deja el proyecto funcional y se valida antes de pasar a la siguiente.

## Estado

| Paso | Contenido | Estado |
|------|-----------|--------|
| 0 | Planeación, arquitectura, modelo de datos (documentos) y base del proyecto configurada | ✅ Hecho |
| 1 | Autenticación + migración inicial de base de datos | ✅ Hecho |
| 2 | Dashboard y categorías | ✅ Hecho |
| 3 | Productos e imágenes | ✅ Hecho — pendiente de tu prueba contra Supabase |
| 4 | Inventario transaccional | ⏳ Siguiente |
| 5 | Ventas físicas | Pendiente |
| 6 | Historial, reportes, permisos y configuración | Pendiente |
| 7 | Empaquetado con Tauri 2 | Pendiente |

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
- Los productos se crean con existencias en 0. El stock inicial se registrará como un movimiento de entrada cuando exista el módulo de inventario (fase 4), nunca escribiendo la columna directamente.
- `is_published` existe en la base de datos pero no se muestra en la interfaz hasta que haya catálogo público.

## Fase 4 — Inventario

- Función RPC `register_inventory_movement` (entrada, salida, ajuste) con bloqueo de fila y validación de no-negativos.
- Pantalla de existencias con alertas de bajo inventario y formularios de entrada/salida/ajuste.

## Fase 5 — Ventas físicas

- Punto de venta: buscar productos, carrito, cantidades, subtotales y total en COP, método de pago.
- Función RPC `create_sale`: crea venta + ítems + movimientos y descuenta stock en una sola transacción.
- Historial de ventas con detalle. Anulación con `cancel_sale` (devuelve el stock).
- Indicadores de ventas del dashboard.

## Fase 6 — Historial, reportes y permisos

- Historial de movimientos con filtros (producto, tipo, usuario, fechas).
- Gráficos del dashboard (ventas por día, más vendidos).
- Configuración: datos del negocio, umbral de bajo inventario, usuarios y roles.
- Revisión completa de permisos admin/operador en interfaz y en RLS.

## Fase 7 — Tauri 2

- `src-tauri/`, configuración de ventana, iconos y build del instalador para Windows.
- Sin funcionalidades nativas adicionales.

## Decisiones tomadas

1. **Permisos del operador:** registra ventas y entradas/salidas, consulta todo. Ajustes, anulaciones, edición de productos/categorías, usuarios y configuración: solo administrador.
2. **Costo de adquisición:** solo lo ve el administrador (tabla `product_costs`).
3. **Métodos de pago:** efectivo, transferencia, Nequi, Daviplata, tarjeta, otro.
4. **Alta de usuarios:** desde el panel de Supabase; el primero queda como administrador. Rol y estado se administran desde la app (fase 6).
5. **SKU:** campo opcional y único.
6. **Fotos:** bucket público de Storage; solo el administrador escribe.
7. **Migraciones:** las aplicas tú en el editor SQL de Supabase; el frontend solo usa la clave `anon`.
