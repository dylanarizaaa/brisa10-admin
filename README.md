# Brisa10 Admin

Sistema administrativo para una tienda física: productos, categorías, inventario y ventas.
Aplicación React que corre como web durante el desarrollo y se empaquetará con Tauri 2 para Windows.

> **Estado:** fases 1 a 5 completas (base de datos, autenticación, dashboard, categorías, productos con fotografías, inventario y ventas). Los módulos funcionales se implementan por fases — ver [docs/PLAN.md](docs/PLAN.md).

## Documentación

- [Plan de trabajo](docs/PLAN.md) — fases, estado y decisiones pendientes.
- [Arquitectura](docs/ARCHITECTURE.md) — capas, estructura de carpetas y decisiones técnicas.
- [Modelo de datos](docs/DATA_MODEL.md) — tablas, funciones RPC y permisos.

## Requisitos

- Node.js 20.19 o superior (probado con 22)
- npm 10 o superior
- Un proyecto de Supabase

## Instalación

```bash
npm install
cp .env.example .env   # completar con la URL y la clave anon de Supabase
npm run dev            # http://localhost:5173
```

## Configurar Supabase

Se hace una sola vez, en el panel de tu proyecto y **en este orden**:

1. **SQL Editor → New query:** pega el contenido completo de cada archivo de `supabase/migrations/`, **uno por uno y en orden de nombre**, y pulsa **Run**. Cada uno debe terminar con "Success. No rows returned".
2. **Authentication → Sign In / Providers → Email:** desactiva **Allow new users to sign up**, para que nadie pueda registrarse por su cuenta.
3. **Authentication → Users → Add user → Create new user:** escribe correo y contraseña y marca **Auto Confirm User**. El primer usuario queda como **administrador**; los siguientes, como operador.
4. Verifica en **Table Editor → profiles** que tu usuario aparece con `role = admin`.

Cada fase que trae cambios de base de datos agrega un archivo nuevo; se aplica igual (paso 1). Cada archivo se ejecuta una sola vez.

| Migración | Fase | Contenido |
|-----------|------|-----------|
| `20261111000001_initial_schema.sql` | 1 | Tablas, RLS, privilegios, bucket de imágenes y datos iniciales |
| `20261111000002_dashboard_summary.sql` | 2 | Función de indicadores del dashboard |
| `20261111000003_product_list.sql` | 3 | Vista para listar, filtrar y buscar productos |
| `20261111000004_inventory_movements.sql` | 4 | Funciones transaccionales de entrada, salida y ajuste de inventario |
| `20261111000005_sales.sql` | 5 | Funciones para registrar y anular ventas, y productos más vendidos |

Para cambiar un rol a mano: `update public.profiles set role = 'admin' where id = '<uuid del usuario>';`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Verificación de tipos y build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | Análisis estático con oxlint |

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública `anon` |

Nunca usar la clave `service_role` en este proyecto: todo lo que empieza por `VITE_` queda en el bundle.

## Agregar componentes de interfaz

```bash
npx shadcn@latest add <componente>
```
