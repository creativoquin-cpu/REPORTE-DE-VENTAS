# Arquitectura actual de Quin (estado al 21-jul-2026)

> Este documento describe el sistema **tal como existe hoy**, antes de la
> migración a Next.js. Es la fuente de referencia para no perder nada
> durante la migración. Las reglas de negocio (qué NO puede cambiar de
> comportamiento) están separadas en [`BUSINESS-RULES.md`](./BUSINESS-RULES.md).
> El plan de migración vive en [`MIGRATION-PLAN.md`](./MIGRATION-PLAN.md).

## 1. Visión general

Quin es una herramienta interna de una agencia para llevar el control diario
de ventas de dos plataformas (Effi y Dropi), calcular metas, cerrar meses y
compartir el resultado con el equipo. Es una **PWA sin build**: dos páginas
HTML autocontenidas (CSS y JS embebidos), sin framework, con Supabase como
backend.

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   index.html             │        │   quin-admin.html         │
│   (vista pública equipo) │◄──────►│   (panel administrador)   │
│   ~430 líneas             │ iframe │   ~2856 líneas             │
└────────────┬─────────────┘        └────────────┬───────────────┘
             │                                    │
             │      Supabase JS v2 (CDN)          │
             ▼                                    ▼
      ┌───────────────────────────────────────────────┐
      │         Supabase (Postgres) — proyecto único    │
      │  RLS por columna: anon lee muy poco, admin todo │
      └───────────────────────────────────────────────┘
```

Ambas páginas comparten:
- El mismo sistema visual (variables CSS, mascota "Quino").
- El mismo motor de cálculo de jornada/festivos/reparto (código duplicado a
  propósito, con comentarios que dicen "idéntico a quin-admin.html" —
  verificado por `pruebas/test-vendedor-publico.js`).
- El mismo proyecto de Supabase, con roles distintos (`anon` para el público,
  `authenticated` + fila en `admins` para el panel).

## 2. Frontend

### 2.1 `index.html` — vista pública del equipo

Sin login. Página de solo lectura para cualquiera con el enlace. Estructura:

- Header con mascota, título "Quin — Equipo", fecha del mes y botón
  "Administrador" que enlaza a `quin-admin.html`.
- 4 tarjetas KPI: prendas propias del equipo, promedio por día, días en meta,
  mejor día del equipo.
- Gráfica Chart.js (barra) de propias por día + línea de meta.
- Tarjeta de meta del equipo con barra de progreso animada.
- Ranking del mes (top 10, solo puesto + nombre, sin cifras individuales).

Toda la página se renderiza client-side: `cargarDatos()` dispara 4 queries en
paralelo a Supabase y `pintarVendedorPublico()` arma el HTML con
`innerHTML`. No usa `localStorage`.

### 2.2 `quin-admin.html` — panel de administrador

Requiere sesión de Supabase (email/password). Es una sola página con 5
pestañas controladas por `mostrar(n)`:

| # | Pestaña | Contenido |
|---|---------|-----------|
| 1 | Cargar y validar | Subida de Excel (Dropi + Effi), filtros de qué cuenta y qué no, calendario de días no laborables manuales, panel de metas, panel de cierre mensual, gestión de jornadas (cerrar/reabrir días), tabla de salida día-por-día |
| 2 | Tablero del mes | KPIs del mes, 2 gráficas (real y repartida) con línea de meta escalonada, rankings por vendedor/tienda, botón para exportar 2 imágenes de WhatsApp |
| 3 | Calendario | Vista de 2 meses con selección por arrastre (mouse/touch), resumen de la selección |
| 4 | Comparativo | Tabla mes a mes, gráfica combinada (barras + línea), tablas por persona |
| 5 | Vista del vendedor | `<iframe>` que carga `index.html` — decisión explícita para no duplicar la implementación (paso 10.5 de la bitácora) |

No usa ningún framework: todo el DOM se arma con strings de `innerHTML` y
`querySelectorAll`/`addEventListener`. El estado vive en variables globales
`var` (ver sección 4) y se persiste en `localStorage` + Supabase.

### 2.3 Sistema visual compartido

Variables CSS en `:root` (colores, radios, sombras), tipografía Montserrat
(público) / "Segoe UI Variable Display" (admin, tema oscuro). El detalle
completo del sistema visual del admin está en `spec-estetica-panel-admin.md`
(no se duplica aquí). Mascota "Quino" como `<symbol>` SVG inline, reutilizada
vía `<use href="#quino">`.

## 3. Capa PWA

- `manifest.json` (público) y `manifest-admin.json` (admin) — **dos
  manifests separados**, cada página instala su propio ícono/`start_url`.
- `sw.js` — un solo service worker compartido, estrategia **network-first
  con fallback a caché**: intenta la red, si falla usa lo último cacheado.
  Solo cachea archivos del propio origen (`./`, `index.html`,
  `quin-admin.html`, manifests, íconos) — las librerías de CDN (Chart.js,
  xlsx.js, Supabase) nunca se cachean, van directo a la red.
- Registro del service worker: solo si `navigator.serviceWorker` existe: no
  hace nada bajo `file://` (falla en silencio, documentado en el código).

## 4. Estado y sincronización

### 4.1 `localStorage` (solo en `quin-admin.html`)

| Clave | Contenido |
|---|---|
| `quin.jornadas` | Días cerrados oficialmente (con historial de fotos/re-subidas) |
| `quin.ajustes` | Filtros activos, días no laborables manuales, flag "descartar NOVEDAD" |
| `quin.metas` | Historial completo de metas (nunca se borra) |
| `quin.meses` | Estado de sellado mensual (cerrado, auto, resumen, traza de auditoría) |
| `quin.nube.snapshot` | Bookkeeping interno: qué filas se sincronizaron por última vez a cada tabla de Supabase, para poder calcular qué borrar |

`index.html` no usa `localStorage` en absoluto — siempre lee directo de
Supabase.

### 4.2 Patrón de sincronización

El navegador es la copia rápida (la pantalla se pinta con lo local); la nube
es un espejo por detrás (`sincronizarNube`). El patrón por tabla es "subir
todo lo local, borrar lo que ya no está" (`sincronizarTabla`, usa el
snapshot para saber qué filas borrar). Conflictos se resuelven por
`actualizado`/`sellado_en` — el más reciente gana (`masReciente()`). Si falla
la sincronización (sin internet), se marca `hayPendientes` y se reintenta
automáticamente en el evento `online`.

## 5. Backend — Supabase (Postgres)

Ver `supabase-esquema.sql` para el DDL completo. Resumen:

### 5.1 Tablas

| Tabla | Propósito | Sensibilidad |
|---|---|---|
| `jornadas` | Una fila por día operativo: `propias`, `dropi` (agregados), `ven`/`tie` (detalle por vendedor/tienda, jsonb), `cerrada`, `cerrada_el`, `fotos[]` | `ven`/`tie`/`dropi`/`cerrada_el`/`fotos` son **privados** |
| `metas` | Historial de metas — cada cambio es una fila nueva, nada se borra | Pública (el vendedor ya ve "meta del equipo") |
| `ajustes` | Una sola fila (id=1) con filtros/días manuales | Privada (solo admin) |
| `meses` | Sello del cierre mensual (snapshot congelado) | Privada |
| `dias_manuales` | Días marcados a mano como no laborables | Pública |
| `ranking_publico` | Solo `mes, puesto, nombre` — nunca cifras. Lo escribe el admin ya calculado | Pública |
| `admins` | Lista de `user_id` con permiso de administrador | Privada (no expuesta a la API) |

### 5.2 Modelo de seguridad

**Decisión central del proyecto** (`supabase-esquema.sql:15-23`): el detalle
por vendedor y por tienda nunca sale de la base sin ser administrador — y
eso se logra **en la base de datos, no escondiendo código**. Se conceden
`GRANT SELECT` por **columna**, no por tabla:

```sql
grant select (fecha, propias, cerrada, actualizado) on public.jornadas to anon;
```

`ven`, `tie`, `dropi`, `cerrada_el`, `fotos` quedan fuera del grant — un
`select *` desde el rol anónimo directamente falla con "permiso denegado" en
esas columnas, sin importar qué diga el JS del cliente.

El chequeo de "¿es administrador?" vive en una función Postgres
`privado.es_admin()` (`security definer`, en un esquema no expuesto a la
API), consultada por las políticas RLS — nunca en el cliente.

## 6. Dependencias externas

Todas por CDN, sin `package.json`:

- **Chart.js 4.4.1** — 4 instancias de gráfica en total (equipo, tablero
  real, tablero repartida, comparativo), con plugins custom para línea de
  meta escalonada y totales sobre las barras.
- **xlsx.js (SheetJS) 0.18.5** — solo lectura (`XLSX.read` +
  `sheet_to_json`), no se usa para exportar nada.
- **@supabase/supabase-js v2** — cliente único (`sb`), usado para auth,
  `select`/`upsert`/`insert`/`delete` en las 7 tablas.

## 7. Pruebas

`pruebas/` contiene 5 scripts Node + jsdom (sin framework de testing) que
cargan el HTML real (`runScripts: 'dangerously'`) y ejecutan el código de
producción contra datos falsos o Excel reales:

| Archivo | Qué valida |
|---|---|
| `test-cierre.js` | Cierre/sellado mensual automático y manual, reapertura, traza de auditoría |
| `test-metas.js` | Metas versionadas por fecha efectiva, validación, resolución de conflictos |
| `test-motor-real.js` | El motor de cálculo contra los 2 archivos Excel reales del repo — únicos números "de verdad" del proyecto |
| `test-vendedor-publico.js` | `index.html` no filtra cifras individuales y coincide con el cálculo del admin |
| `test-imagen.js` | Generación pixel/texto de las imágenes de WhatsApp |

`pruebas/LEEME.md` está desactualizado (menciona un `test-vendedor.js` que
ya fue retirado). El comando vigente para correrlos todos es:
```
cd pruebas && for f in test-*.js; do echo "== $f"; TZ=America/Bogota node $f | tail -1; done
```
(requiere `jsdom` y `xlsx` instalados).

## 8. Otros archivos del repositorio

- `bitacora-quin.md` — bitácora cronológica de decisiones y pasos de
  implementación. Fuente primaria de las reglas de negocio (ver
  `BUSINESS-RULES.md`).
- `prompt_reporte_ventas.md` — spec original de un prototipo anterior
  (`reporte-ventas.html`, con backend de Google Sheets). **Arquitectura
  histórica, ya reemplazada** — pero sus reglas de cálculo (corte de
  jornada, reparto, festivos) siguen vigentes y son la base de las reglas
  actuales.
- `google-apps-script-backend.gs.txt` — backend legado (Google Apps Script +
  Google Sheets), reemplazado por Supabase en el paso 9 de la bitácora. Se
  conserva como referencia histórica, no se usa.
- `spec-estetica-panel-admin.md` / `prompt-antigravity-estetica.md` — spec
  del rediseño visual del panel admin (paso 10), sobre el mockup
  `Jornada Quin Actual.html`. Explícitamente no toca lógica de negocio.
- `prompt-antigravity-supabase.md` — spec original de la migración a
  Supabase (paso 9): diseño del esquema, RLS, login, separación de la
  vista pública.
- `.claude/agents/` — pipeline de 3 agentes (planificador → implementador →
  auditor) hecho a medida para cambios sobre este proyecto. **Sus
  instrucciones referencian un archivo `reporte-ventas.html` que ya no es
  el vigente** (el proyecto se separó en `index.html` + `quin-admin.html`
  desde el paso 9) — quedó desactualizado y hay que decidir si se actualiza
  o se retira al migrar a Next.js (ver Fase 13 en `MIGRATION-PLAN.md`).
- Despliegue: Vercel, conectado al repositorio de GitHub (deploy automático
  por push a `main`, según el historial de commits reciente).
