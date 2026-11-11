# Plan de trabajo

Sistema administrativo para tienda física (decoración, cerámicas, peluches, regalos).
Alcance de esta etapa: **solo la aplicación administrativa**. Sin catálogo público, sin pagos electrónicos, sin AWS.

Cada fase deja el proyecto funcional y se valida antes de pasar a la siguiente.

## Estado

| Paso | Contenido | Estado |
|------|-----------|--------|
| 0 | Planeación, arquitectura, modelo de datos (documentos) y base del proyecto configurada | ✅ Hecho — pendiente de validación |
| 1 | Autenticación + migración inicial de base de datos | ⏳ Siguiente |
| 2 | Dashboard y categorías | Pendiente |
| 3 | Productos e imágenes | Pendiente |
| 4 | Inventario transaccional | Pendiente |
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

No incluye todavía: login, migraciones SQL ni ningún módulo funcional.

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
- Dashboard con indicadores reales de productos e inventario. Los indicadores de ventas se conectan en la fase 5.

## Fase 3 — Productos e imágenes

- CRUD de productos, búsqueda, filtros por categoría y disponibilidad, activar/desactivar, vista de detalle.
- Subida, orden y eliminación de fotografías en Supabase Storage (bucket `product-images`).
- El stock inicial se registra como un movimiento de entrada, nunca escribiendo la columna directamente.

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

## Decisiones que necesito que valides

Están propuestas con un valor por defecto en los documentos; dime si alguna debe cambiar antes de la fase 1.

1. **Permisos del operador.** Propuesta: registra ventas y entradas/salidas de mercancía y consulta todo; solo el administrador hace ajustes manuales, anula ventas, edita productos/categorías, y gestiona usuarios y configuración. Ver matriz en [DATA_MODEL.md](./DATA_MODEL.md#permisos-por-rol).
2. **Métodos de pago.** Propuesta: efectivo, transferencia, Nequi, Daviplata, tarjeta, otro.
3. **Nombre del negocio.** Usé "Brisa10" por el nombre del repositorio; es editable.
4. **Proyecto de Supabase.** Necesito que crees un proyecto (plan gratuito) y tengas a mano la URL y la clave `anon`. Las migraciones se aplican con Supabase CLI o pegándolas en el editor SQL.
5. **Alta de usuarios.** Crear usuarios requiere la clave `service_role`, que no puede estar en el frontend. Propuesta: crearlos desde el panel de Supabase y administrar su rol/estado desde la app. Alternativa (más trabajo): una Edge Function de invitación.
6. **Código de producto (SKU / código de barras).** No está en los requisitos. Propuesta: campo `sku` opcional y único, útil para buscar rápido en ventas.
