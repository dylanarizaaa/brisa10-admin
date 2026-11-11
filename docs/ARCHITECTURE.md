# Arquitectura

## Visión general

```
┌──────────────────────────────┐        ┌─────────────────────────────────┐
│  App administrativa (SPA)    │        │  Supabase                       │
│  React + Vite                │ HTTPS  │  ├─ Auth (sesiones, JWT)        │
│  ── web en desarrollo        │◄──────►│  ├─ PostgreSQL + RLS + RPC      │
│  ── Tauri 2 en Windows       │        │  └─ Storage (fotos de productos)│
└──────────────────────────────┘        └─────────────────────────────────┘
                                                      ▲
                                 (etapa 2) Catálogo público, solo lectura
```

No hay servidor propio. El "backend" es PostgreSQL: las reglas críticas (stock nunca negativo, ventas atómicas, permisos por rol) viven en la base de datos mediante restricciones, RLS y funciones RPC. El frontend valida para dar buena experiencia, pero no es la fuente de verdad.

## Stack

| Área | Tecnología |
|------|------------|
| UI | React 19, TypeScript (estricto), Vite |
| Estilos | Tailwind CSS v4, shadcn/ui (Radix), Lucide |
| Navegación | React Router |
| Datos asíncronos | TanStack Query |
| Formularios | React Hook Form + Zod |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Escritorio | Tauri 2 (fase 7) |

## Estructura de carpetas

```
brisa10-admin/
├─ docs/                      Plan, arquitectura y modelo de datos
├─ supabase/
│  └─ migrations/             Migraciones SQL versionadas (tablas, RLS, RPC)
├─ src/
│  ├─ app/                    Composición de la aplicación
│  │  ├─ app.tsx              Raíz
│  │  ├─ providers.tsx        QueryClient, tooltips, toasts
│  │  ├─ router.tsx           Definición de rutas
│  │  └─ layouts/             Sidebar, header, layout de autenticación
│  ├─ features/               Un directorio por módulo funcional
│  │  └─ <feature>/
│  │     ├─ pages/            Vistas enrutadas (delgadas: componen y delegan)
│  │     ├─ components/       Componentes propios del módulo
│  │     ├─ hooks/            Hooks de TanStack Query y lógica de negocio
│  │     ├─ services/         Acceso a datos (único lugar que llama a Supabase)
│  │     ├─ schemas/          Esquemas Zod (validación de formularios)
│  │     └─ types.ts          Tipos del dominio del módulo
│  ├─ components/
│  │  ├─ ui/                  Componentes shadcn/ui (generados por el CLI)
│  │  └─ shared/              Componentes reutilizables entre módulos
│  ├─ config/                 Variables de entorno, navegación, constantes
│  ├─ hooks/                  Hooks genéricos
│  ├─ lib/                    Cliente Supabase, QueryClient, formato COP/fechas
│  └─ types/                  Tipos globales (esquema generado de la BD)
└─ src-tauri/                 (fase 7) Proyecto Tauri
```

Módulos en `features/`: `auth`, `dashboard`, `categories`, `products`, `inventory`, `sales`, `movements`, `settings`. Cada subcarpeta se crea solo cuando el módulo la necesita.

## Capas y flujo de datos

```
Página → Componente → Hook (useQuery / useMutation) → Servicio → Supabase (tabla, RPC o Storage)
                           │
                    Esquema Zod (formularios)
```

Reglas:

- **Las páginas y componentes no importan el cliente de Supabase.** Solo consumen hooks.
- **Los servicios** son funciones asíncronas planas que devuelven datos tipados y lanzan errores; no conocen React.
- **Los hooks** envuelven servicios con TanStack Query: claves de caché, invalidación y notificaciones.
- **Los esquemas Zod** definen la forma de cada formulario; los tipos se infieren de ellos.
- **Dependencias entre features:** una feature puede usar servicios/hooks de otra (ventas usa productos), pero no sus componentes internos. Lo compartido sube a `components/shared` o `lib`.

## Decisiones relevantes

| Decisión | Motivo |
|----------|--------|
| Sin servidor propio; lógica crítica en PostgreSQL | Bajo costo operativo y garantías transaccionales reales. La tienda virtual futura reutiliza las mismas reglas sin duplicarlas. |
| El stock solo cambia mediante funciones RPC | El frontend no tiene permiso de escritura sobre `products.stock`; toda variación deja un movimiento auditable. |
| Estado del servidor en TanStack Query, sin store global | No hay estado de cliente complejo. El carrito de venta es estado local del módulo de ventas. |
| Organización por funcionalidad | Cada módulo se desarrolla y entiende de forma aislada; coincide con las fases del plan. |
| Dinero como enteros en COP | El peso no usa centavos en la práctica; se evitan errores de coma flotante. |
| Tema claro únicamente | Reduce superficie de pruebas. Los tokens de modo oscuro quedan en el CSS para activarlo después si se quiere. |
| `getSupabase()` perezoso y `env` validado con Zod | Si falta configuración, la app puede mostrar un mensaje claro en vez de una pantalla en blanco. |

## Seguridad

- Supabase Auth con correo y contraseña. La sesión (JWT) viaja en cada petición.
- RLS activado en todas las tablas; sin sesión no se lee nada.
- Rol (`admin` / `operador`) guardado en `profiles` y consultado por las políticas con las funciones `is_active_user()` e `is_admin()`. Un usuario con `is_active = false` no pasa ninguna política.
- La interfaz oculta lo que el rol no puede hacer, pero la restricción efectiva está en RLS y en las RPC.
- El frontend usa únicamente la clave `anon`. La clave `service_role` nunca se incluye en el proyecto.

## Preparación para Tauri 2

- La interfaz es una SPA estándar sin dependencias de APIs de escritorio; Tauri solo la envuelve.
- `vite.config.ts` ya usa puerto fijo (`5173`, `strictPort`) y `clearScreen: false`, que es lo que espera el CLI de Tauri.
- Si en el futuro se necesita algo nativo (impresión de recibos, por ejemplo), se aislará en `src/lib/platform/` con una implementación web y otra Tauri, para que los módulos no importen `@tauri-apps/*` directamente.
- La sesión de Supabase se guarda en `localStorage`, que funciona igual en el WebView de Tauri.

## Convenciones

- Archivos en `kebab-case`; componentes en `PascalCase`; exportaciones con nombre.
- Interfaz y mensajes en español; código (identificadores, tablas, columnas) en inglés.
- Componentes de `components/ui` se agregan con `npx shadcn@latest add <componente>` y se modifican lo mínimo.
- Verificación antes de cada entrega: `npm run build` y `npm run lint`.
