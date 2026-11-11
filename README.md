# Brisa10 Admin

Sistema administrativo para una tienda física: productos, categorías, inventario y ventas.
Aplicación React que corre como web durante el desarrollo y se empaquetará con Tauri 2 para Windows.

> **Estado:** base del proyecto configurada. Los módulos funcionales se implementan por fases — ver [docs/PLAN.md](docs/PLAN.md).

## Documentación

- [Plan de trabajo](docs/PLAN.md) — fases, estado y decisiones pendientes.
- [Arquitectura](docs/ARCHITECTURE.md) — capas, estructura de carpetas y decisiones técnicas.
- [Modelo de datos](docs/DATA_MODEL.md) — tablas, funciones RPC y permisos.

## Requisitos

- Node.js 20.19 o superior (probado con 22)
- npm 10 o superior
- Un proyecto de Supabase (a partir de la fase 1)

## Instalación

```bash
npm install
cp .env.example .env   # completar con la URL y la clave anon de Supabase
npm run dev            # http://localhost:5173
```

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
