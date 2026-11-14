# Aplicación de escritorio (Windows)

La aplicación de escritorio es la misma interfaz web empaquetada con [Tauri 2](https://tauri.app). No tiene funciones nativas propias: se conecta al mismo proyecto de Supabase, con los mismos usuarios, permisos y datos que la versión web.

El instalador (`.exe`) se genera en **GitHub Actions**, en una máquina Windows de GitHub. No necesitas instalar Rust ni herramientas de compilación en tu computador.

## Resumen de la secuencia

| # | Qué | Dónde | Cuándo |
|---|-----|-------|--------|
| 1 | Crear los dos secrets de Supabase | GitHub → Settings | Una sola vez |
| 2 | Abrir el pull request de la fase 7 y descargar el instalador de prueba | GitHub → Pull requests | Una sola vez |
| 3 | Probar el instalador en Windows y fusionar el pull request | Tu computador / GitHub | Una sola vez |
| 4 | Crear una versión | Terminal o GitHub → Actions | Cada vez que quieras distribuir una versión |
| 5 | Publicar el borrador de versión | GitHub → Releases | Cada versión |
| 6 | Instalar o actualizar en los computadores de la tienda | Windows | Cada versión |

## 1. Secrets del repositorio (una sola vez)

El build necesita la conexión a Supabase. Vite la incrusta en la aplicación al compilar.

1. En GitHub, abre el repositorio → **Settings** → **Secrets and variables** → **Actions**.
2. En la pestaña **Secrets**, pulsa **New repository secret** y crea estos dos, con los **mismos valores de tu archivo `.env` local**:

| Nombre (exacto) | Valor | Dónde encontrarlo en Supabase |
|-----------------|-------|-------------------------------|
| `VITE_SUPABASE_URL` | `https://<tu-proyecto>.supabase.co` | Project Settings → API: *Project URL* |
| `VITE_SUPABASE_ANON_KEY` | La clave pública (`anon` o *publishable*) | Project Settings → API Keys |

Nunca uses la clave `service_role` (o *secret*): quedaría dentro del instalador.

Si los secrets faltan o la URL no termina en `.supabase.co`, el flujo se detiene en el paso **Verificar configuración** con un mensaje que lo explica.

## 2. Instalador de prueba desde el pull request (una sola vez)

1. Crea los secrets **antes** de abrir el pull request; si lo abres antes, cuando los crees vuelve a ejecutar el job con **Re-run jobs**.
2. Abre el pull request de la rama de la fase 7 hacia `main`.
3. Se ejecuta el check **Instalador de Windows / Compilar instalador**. La primera vez tarda unos 10–20 minutos; las siguientes, menos, por la caché.
4. Cuando termine en verde: en el pull request → pestaña **Checks** → **Instalador de Windows** → **Summary**. Abajo, en **Artifacts**, descarga `brisa10-admin-<versión>-windows`. Es un `.zip` con el instalador dentro.

Este check se repite en cualquier pull request futuro que cambie `src-tauri/`, el flujo, `package.json` o `package-lock.json`.

## 3. Probar e instalar

1. Descomprime el `.zip` y ejecuta `Brisa10 Admin_<versión>_x64-setup.exe`.
2. Si Windows muestra **«Windows protegió su equipo»**, pulsa **Más información** → **Ejecutar de todas formas**. El aviso aparece porque el instalador no está firmado con un certificado comercial (ver [Firma de código](#firma-de-código)).
3. El asistente está en español y no pide permisos de administrador: instala para el usuario actual de Windows.
4. Abre **Brisa10 Admin** desde el menú Inicio o el acceso directo, e inicia sesión con tu usuario de siempre.

Qué revisar en la prueba: inicio de sesión, que se vean las fotos de productos, registrar una venta y subir una foto. Si todo funciona, fusiona el pull request.

## 4. Crear una versión

La versión sale del campo `"version"` de `package.json` (hoy `0.1.0`). Cada versión publicada debe tener un número nuevo: `0.1.0` → `0.1.1` (correcciones) o `0.2.0` (funciones nuevas).

### Opción A: desde GitHub, sin terminal

1. Si ya publicaste una versión antes, sube el número: en GitHub abre `package.json` en `main`, pulsa el lápiz (**Edit**), cambia `"version"` y guarda con **Commit changes**. No hace falta tocar `package-lock.json`.
2. Ve a **Actions** → **Instalador de Windows** → **Run workflow**.
3. Deja la rama en `main`, marca **crear_version** y pulsa **Run workflow**.

### Opción B: desde la terminal

```bash
git checkout main && git pull
npm version patch          # 0.1.0 → 0.1.1 (o "minor" para 0.2.0). Crea el commit y la etiqueta v0.1.1
git push --follow-tags     # sube el commit y la etiqueta; el flujo arranca solo
```

La etiqueta debe ser exactamente `v` + la versión de `package.json`; si no coinciden, el flujo se detiene y lo explica. `npm version` los mantiene sincronizados.

Para la **primera versión** (`0.1.0`) no subas el número: usa la opción A sin el paso 1, o en la terminal `git tag v0.1.0 && git push origin v0.1.0`.

### Build de prueba sin crear versión

**Actions** → **Instalador de Windows** → **Run workflow**, sin marcar **crear_version**. El instalador queda solo como artefacto descargable, igual que en el paso 2. Sirve para probar una rama antes de publicar.

## 5. Publicar la versión

1. Ve a **Releases** (columna derecha de la página principal del repositorio).
2. Abre el borrador **Brisa10 Admin v<versión>**. Trae el instalador en **Assets** e instrucciones de instalación.
3. Revisa el texto y pulsa **Publish release**.

El borrador no es visible para nadie más hasta que lo publicas.

## 6. Instalar y actualizar en la tienda

- **Primera instalación:** descarga el `_x64-setup.exe` desde la versión publicada y sigue el paso 3.
- **Actualizar:** instala la versión nueva encima de la anterior. La sesión y la configuración se conservan.
- **Desinstalar:** Configuración de Windows → Aplicaciones → Brisa10 Admin.

La aplicación no se actualiza sola: cada versión nueva se instala a mano (ver [Pendientes](#pendientes)).

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| El flujo falla en **Verificar configuración** con "Faltan secrets" | No están creados o el nombre no es exacto | Crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (paso 1) y vuelve a ejecutar |
| "URL de Supabase no admitida" | Usas un dominio propio en lugar de `*.supabase.co` | Agrega tu dominio a `connect-src` e `img-src` en `src-tauri/tauri.conf.json` → `app.security.csp` |
| "Versión no coincide" | La etiqueta no es `v` + versión de `package.json` | Borra la etiqueta incorrecta y usa `npm version` |
| "La versión ya existe" | Ya hay una etiqueta con esa versión | Sube `"version"` en `package.json` |
| No aparece **Run workflow** | El flujo todavía no está en `main` | Fusiona primero el pull request de la fase 7 |
| La app abre "Falta configurar la conexión" | El build se hizo sin secrets | Revisa el paso 1 y genera el instalador de nuevo |
| La app abre pero no inicia sesión ("No se pudo conectar") | Sin internet, o Supabase pausado | Revisa la conexión; en el plan gratuito, Supabase pausa proyectos sin uso por una semana: reactívalo desde su panel |

## Detalles técnicos

- **Configuración:** `src-tauri/tauri.conf.json`. Identificador `com.brisa10.admin`; la versión se lee de `package.json`.
- **Ventana:** se abre maximizada; mínimo 960 × 600.
- **Instalador:** NSIS, en español, por usuario (`installMode: currentUser`, sin permisos de administrador). Usa el WebView2 que trae Windows 10/11; si falta, el instalador lo descarga.
- **Seguridad (CSP):** la ventana solo puede cargar el código propio de la aplicación y conectarse a `*.supabase.co`. No hay comandos nativos ni plugins: `capabilities/default.json` concede únicamente los permisos básicos de ventana.
- **Rutas:** Tauri responde con `index.html` a cualquier ruta desconocida, así que la navegación de React Router funciona igual que en la web, incluso al recargar.
- **Icono:** fuente en `src-tauri/app-icon.svg` y `src-tauri/app-icon.png`. Para cambiarlo, reemplaza el PNG (1024 × 1024) y ejecuta `npm run tauri icon src-tauri/app-icon.png`.
- **Flujo:** `.github/workflows/windows-installer.yml`. Usa `tauri-apps/tauri-action@v1`. El repositorio es público, así que los minutos de GitHub Actions no tienen costo.

### Compilar en tu propio Windows (opcional)

Solo hace falta para depurar algo que no se reproduce en el navegador.

1. Instala [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) con la carga de trabajo **Desarrollo para el escritorio con C++**.
2. Instala Rust con [rustup](https://rustup.rs).
3. En el proyecto, con tu `.env` configurado:

```bash
npm install
npm run desktop:dev     # abre la ventana de escritorio con recarga en caliente
npm run desktop:build   # genera el instalador en src-tauri/target/release/bundle/nsis/
```

## Firma de código

Sin firma, Windows muestra el aviso «Windows protegió su equipo» la primera vez que se ejecuta cada versión del instalador. Es aceptable para uso interno de la tienda. Para quitarlo hace falta un certificado de firma de código (aprox. 100–400 USD al año) o un servicio como Azure Trusted Signing; se integra en el flujo sin cambiar la aplicación.

## Pendientes

- **Actualizaciones automáticas:** Tauri tiene un actualizador, pero requiere un par de claves de firma propias y publicar un `latest.json`. Se puede agregar en una iteración posterior.
- **Firma de código:** ver la sección anterior.
