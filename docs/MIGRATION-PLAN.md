# Plan de migración a Next.js + TypeScript

> Checklist vivo — ir marcando `[x]` a medida que se completa cada fase.
> Cada fase (1 en adelante) requiere luz verde explícita antes de
> ejecutarse; este documento es el mapa, no una autorización general.
> Contexto completo del sistema actual en [`ARCHITECTURE.md`](./ARCHITECTURE.md)
> y reglas que no pueden romperse en [`BUSINESS-RULES.md`](./BUSINESS-RULES.md).

## Estrategia

**Incremental y en paralelo**: la app actual (`index.html` +
`quin-admin.html`) sigue funcionando en producción sin interrupciones
mientras se construye la app Next.js en un proyecto/carpeta nueva. El
tráfico real solo se mueve después de validar la Fase 12 número por número.

## Decisiones de arquitectura ya tomadas

- **Next.js App Router + TypeScript estricto**, deploy en Vercel (mismo
  proveedor de hoy).
- **CSS**: Tailwind CSS v4. Los tokens de marca (colores, radios, sombras)
  del sistema de diseño actual se declaran una sola vez en `web/app/globals.css`
  dentro de un bloque `@theme`, y de ahí Tailwind genera las utilidades
  (`bg-turquesa`, `rounded-card`, `shadow-card`, etc.) — decisión tomada
  durante la Fase 1, reemplaza la idea inicial de variables CSS + CSS
  Modules.
- **Estado del admin**: Zustand (mapea natural desde las variables globales
  actuales).
- **Gráficas**: Chart.js directo envuelto en un componente `<ChartCanvas>`
  con ciclo de vida por `useEffect` (crea/destruye) — arregla de raíz el bug
  de fuga de memoria del paso 10.2.
- **Excel**: se mantiene SheetJS (`xlsx`), parseo client-side.
- **Auth**: `@supabase/ssr` para gate de `/admin/*` en middleware — la
  autorización real sigue viviendo en RLS/Postgres, nunca en el cliente
  (ver regla 10 de `BUSINESS-RULES.md`).
- **Vista del vendedor**: se unifica de verdad — un solo componente
  `<VistaEquipo>` usado tanto en `/` como en la pestaña 5 del admin, sin
  iframe.
- **Pruebas**: Vitest + Testing Library reemplazan el harness jsdom casero,
  portando los mismos escenarios y números de referencia (incluidos los
  Excel reales usados en `pruebas/test-motor-real.js`).

## Backend (Supabase) — puntos a auditar (Fase 11)

1. Migraciones formales vía Supabase CLI (`supabase/migrations/*.sql`) en
   vez de un único archivo de referencia.
2. Mover `SUPABASE_URL`/`SUPABASE_KEY` (hoy hardcodeadas en 2 lugares) a
   variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`).
3. Evaluar normalizar `ven`/`tie` (hoy jsonb opaco) a tablas relacionales
   propias, **manteniendo la misma frontera de seguridad** (nunca
   concedidas a `anon`). Probar primero en un Supabase branch.
4. Evaluar mover el cálculo de `ranking_publico` a una vista/función de
   Postgres en vez de calcularlo en el cliente admin.
5. Revisar el patrón de sync "subir tabla completa y borrar lo que falta"
   — evaluar mutación puntual por cambio en vez de diff de snapshots
   completos en `localStorage`. Cambia comportamiento offline-first, así
   que se prueba contra `pruebas/test-cierre.js`/`test-metas.js` antes de
   confirmar.

Ningún cambio de backend se aplica sin pasar primero por un Supabase branch
de prueba — el esquema en `supabase-esquema.sql` es la red de seguridad.

## Fases

- [x] **Fase 0 — Documentación.** `docs/ARCHITECTURE.md`,
      `docs/BUSINESS-RULES.md`, `docs/MIGRATION-PLAN.md`.
- [x] **Fase 1 — Scaffold Next.js.** Hecho en `web/` (ver `web/README.md`):
      Next.js 16 App Router + TypeScript estricto, ESLint/Prettier, Tailwind
      v4 con los tokens de marca portados, conectado de lectura a las
      credenciales públicas ya usadas por `index.html`/`quin-admin.html`
      (no hizo falta un Supabase branch: son columnas ya concedidas al rol
      anon). Login funcionando de punta a punta
      (`proxy.ts` + `/admin/login` + `/admin/(panel)`), `<VistaEquipo>` con
      datos de ejemplo en `/` y `/admin/vista-vendedor` (sin iframe),
      `<ChartCanvas>` con destroy() garantizado, y las 4 pestañas restantes
      como placeholders. `npm run lint`, `tsc --noEmit` y `npm run build`
      pasan limpios. Riesgo: ninguno (no reemplaza nada en producción).
- [x] **Fase 2 — Librería de motor (`lib/motor/*.ts`).** Hecho: corte de
      jornada (`jornada.ts`), festivos de Colombia (`festivos.ts`), reparto
      de bloques (`reparto.ts`), resolución de metas (`metas.ts`), filtros
      (`filtros.ts`) y cálculo día-por-día (`calcular.ts`) — todo como
      funciones puras, sin DOM ni estado global (los globales del HTML
      `diasManuales`/`metas` se pasan como parámetros). Vitest configurado
      (`vitest.config.ts`, `npm test`) con **69 pruebas verdes** portadas 1:1
      desde `pruebas/test-motor-real.js` (§7, §8, §9) y `pruebas/test-metas.js`,
      incluyendo el test de paridad que carga los **dos Excel reales del repo**
      como fixtures y valida los números de referencia del §17 (98 propias,
      20 Dropi, 118 combinado, corte de jornada de Effi, reparto 2/2/4,
      Tiko=9, Lucenith=24). `tsc --noEmit`, `npm run lint` y `npm run build`
      siguen limpios. Riesgo: bajo — solo lógica pura, verificada por número.
- [x] **Fase 3 — Vista pública del equipo (`<VistaEquipo>`).** Hecho:
      `<VistaEquipo>` es ahora un Server Component asíncrono que hace las
      mismas 4 consultas públicas de solo lectura de `index.html`
      (`lib/data/equipo.ts`, con la anon key del lado servidor) y calcula el
      resumen con el motor puro `lib/motor/equipo.ts` (reparto de fin de
      semana, meta por día, KPIs). La gráfica es `<TeamChart>` sobre
      `<ChartCanvas>`. Muestra KPIs, gráfica, meta del periodo y ranking (solo
      puesto+nombre, nunca cifras por persona — regla 9), más los estados
      vacío / sin conexión / días sin cerrar. Reemplaza los datos de ejemplo y
      sirve tanto `/` como `/admin/vista-vendedor` (mismo componente, sin
      iframe). Paridad verificada: 10 pruebas Vitest nuevas portadas de
      `pruebas/test-vendedor-publico.js` (total 635, promedio 127, 2/5 en
      meta, reparto [200,190,150,47,48]) — 79 pruebas verdes en total. Además,
      render real confirmado contra la nube (julio 2026: 1129 prendas, meta
      2240, ranking encabezado por FUNNELISTH LANDING). `tsc`, `lint` y
      `build` limpios; `/` pasa a dinámico (datos en vivo). Riesgo: bajo.
- [x] **Fase 4 — Auth + pestaña "Cargar y validar".** Completa (login ya venía
      de la Fase 1). La pestaña 1 quedó entera: carga de Excel + filtros +
      validación (4a), lectura de la nube + jornadas + cierre + sync con
      escrituras dirigidas y dry-run (4b), panel de metas (4c) y editor de días
      no laborables (4d). Toda escritura a producción pasa por una vista previa
      (dry-run) por defecto. Riesgo original alto, mitigado por el dry-run.
  - [x] **4a — Carga + cálculo + validación (solo cliente).** Hecho: los dos
        cargadores de Excel parsean con SheetJS en el navegador
        (`components/Cargar/CargadorExcel.tsx`), el estado vive en un store
        Zustand (`lib/store/cargar.ts`, puerto de las variables globales +
        `construirFiltros`), y todo recalcula en vivo con el motor puro. UI:
        `<Filtros>` (prender/apagar estatus y vendedores + descartar NOVEDAD),
        `<ResumenCarga>`, `<TablaPorDia>` (real vs repartida + bloques),
        dos `<RankingTabla>` (Effi / Dropi, nunca mezclados) y `<Descartes>`
        (cuentan/descartadas + detalle fila por fila). Se añadió el módulo puro
        `lib/motor/diagnostico.ts` (el "Qué se descartó" separado del render)
        con **5 pruebas nuevas** que cuadran fila por fila contra `calcular()`
        y los números del §17 (98 contadas Effi, 20 Dropi) — **84 pruebas
        verdes** en total. No escribe a la nube ni edita días no laborables
        (`diasManuales` va vacío: solo aplica sábados/domingos/festivos
        automáticos). `tsc`, `lint` y `build` limpios. Riesgo: bajo (aditivo,
        solo lectura).
  - [ ] **4b — Jornadas + cierre mensual + sync a Supabase.** Riesgo: alto.
        Se parte en lectura → escritura dirigida (decisión del usuario): primero
        mostrar el estado real de la nube sin riesgo, luego escrituras puntuales
        por acción (upsert/delete de ESE día/mes, no el patrón snapshot del app
        viejo) probadas contra un Supabase branch antes de tocar producción.
    - [x] **4b-1 — Lectura del estado de la nube + paneles (solo lectura).**
          Hecho: `lib/data/admin.ts` carga en el servidor (con la sesión de la
          cookie, RLS `privado.es_admin` devuelve las columnas privadas) las
          jornadas oficiales (`cerrada = true`), los sellos de `meses`, los
          `dias_manuales` y los `ajustes`. El store se hidrata una vez
          (`lib/store/cargar.ts` → `hidratarNube`), sembrando los filtros y el
          descarte de NOVEDAD desde los ajustes guardados y alimentando el
          cálculo con los días no laborables reales. UI nueva: `<JornadasPanel>`
          (calendario por mes con estado por día — cerrada/sin cerrar/con
          revisión/sin datos — y detalle al tocar un día cerrado) y
          `<CierrePanel>` (tabla de meses con estado, total de hoy vs sellado y
          bitácora de cierres); `<ResumenCarga>` ahora muestra "sin cerrar"
          real. Motor puro nuevo `lib/motor/cierre.ts` (`estadoMes`,
          `resumenMensualCerrado`) con **8 tests** → **92 verdes**. Se
          corrigieron los tipos de `types/database.ts` al shape REAL que escribe
          el app viejo (`fotos:{cuando,p,d}`, `ajustes.est/ven` como mapa
          valor→bool, `meses.datos`). Cero escrituras. `tsc`, `lint` y `build`
          limpios. Riesgo: ninguno (solo lectura).
    - [x] **4b-2 — Cerrar/reabrir jornada + ranking (escritura dirigida).**
          Hecho: cerrar los días seleccionados (upsert de `jornadas`) y reabrir
          un día (delete de esa fila con `cerrada = true`), más el reemplazo de
          `ranking_publico` del mes tocado. Todo con **mutaciones puntuales**
          (un día / un mes), nunca el borrado masivo del patrón snapshot. La
          lógica de qué se escribe es pura y testeada: `lib/motor/nube.ts`
          (`filaCierreJornada`, `rankingPublico`, `planificarCierre`,
          `planificarReapertura`, `resumenCierre`) con **14 tests** → **106
          verdes**. La capa que ejecuta es `lib/data/escribir-jornadas.ts`
          (navegador, sesión admin → RLS autoriza). UI: `<JornadasPanel>` ahora
          selecciona días, cierra y reabre. **Toda escritura pasa por una VISTA
          PREVIA (dry-run, modo por defecto)** que muestra las filas exactas
          antes de tocar nada; solo en modo "En vivo" y tras un segundo paso se
          escribe a producción. NOTA: el MCP de Supabase se desconectó, así que
          no se pudo crear un branch; el dry-run cumple el rol de "verificar
          antes de prod". `tsc`, `lint`, `build` limpios.
    - [x] **4b-3 — Sellado mensual (escritura dirigida).** Hecho: sellar (cerrar
          a mano) y reabrir un mes desde `<CierrePanel>`, con upsert puntual de
          una fila de `meses`. Motor puro nuevo en `lib/motor/cierre.ts`
          (`resumenMes`, `sellarMes`, `reabrirMesDatos`) con **5 tests** → **111
          verdes**; capa de escritura `lib/data/escribir-meses.ts`. Se sumó
          `metas` al cargador admin y al store (las necesita el resumen sellado).
          El toggle Vista previa / En vivo se extrajo a `<ModoEscrituraToggle>`,
          compartido por jornadas y cierre — misma garantía dry-run. El sellado
          **automático** del app viejo NO se porta a propósito: acá se sella a
          mano para no escribir en silencio al abrir la página. `tsc`, `lint`,
          `build` limpios. Riesgo: medio.
    - [x] **4b-4 — Sync del bosquejo.** Hecho: botón "Publicar días sin cerrar"
          en `<JornadasPanel>` que sube los días del cálculo aún sin cerrar a
          `jornadas` con `cerrada:false` para que la vista pública muestre las
          cifras preliminares. `lib/motor/nube.ts` → `filasDeBosquejo` (pura, +2
          tests → **113 verdes**); `lib/data/escribir-bosquejo.ts` reconcilia
          **contra la nube** (lee los borradores existentes y borra los que ya no
          están en el cálculo) en vez del snapshot de localStorage del app viejo,
          y recalcula el ranking del mes en curso. Todo borrado lleva el guard
          `.eq("cerrada", false)`: nunca toca una jornada oficial. Mismo dry-run.
          `tsc`, `lint`, `build` limpios. Riesgo: medio-alto (impacta la vista
          pública en vivo) — mitigado por la vista previa.
  - [x] **4c — Panel de metas** (historial versionado). Hecho: `<MetasPanel>`
        muestra la meta vigente (KPIs), permite guardar una meta nueva (upsert
        puntual en `metas`) y quitar una meta **programada** (aún sin entrar en
        vigencia). Historial versionado con marcas vigente/programada/reemplazada
        y descripción del cambio — nada se borra (regla 6). Motor puro:
        `validarMeta` en `lib/motor/metas.ts` (+6 tests → **119 verdes**); capa
        `lib/data/escribir-metas.ts`. Mismo dry-run (vista previa del upsert/delete
        antes de escribir). El campo de metas se resincroniza con la vigente en
        render (patrón recomendado, sin efecto). `tsc`, `lint`, `build` limpios.
        Riesgo: bajo-medio.
  - [x] **4d — Editor de días no laborables** (`dias_manuales`). Hecho:
        `<DiasNoLaborablesPanel>` agrega/quita días extra a mano (upsert/delete
        puntual en `dias_manuales`), que ya se leían en 4b-1 y alimentan el
        reparto — también en la vista pública, por eso pasa por el mismo
        dry-run. `lib/data/escribir-dias.ts` + acciones en el store. `tsc`,
        `lint`, `build` limpios. Riesgo: bajo.
- [x] **Fase 5 — Pestaña "Tablero del mes".** Hecho: `<TableroPanel>` con
      selector de mes + toggle de bosquejo, 10 KPIs del mes, metas del periodo
      (2 barras de progreso), dos gráficas (`<TableroChart>` sobre
      `<ChartCanvas>`: barras apiladas propias/Dropi con **línea de meta
      escalonada** y total encima, días sin cerrar en tono apagado) y los
      rankings por vendedor/tienda. Motor puro nuevo `lib/motor/tablero.ts`
      (`datosDelMes`, `resumenTablero`) con **8 tests** → **127 verdes**. Es
      solo lectura (sin escrituras). Reusa el estado del store: jornadas/metas de
      la nube + el bosquejo del Excel de la sesión; el estado del Excel persiste
      entre pestañas (hook `useHidratarNube` compartido). `tsc`, `lint`, `build`
      limpios. Riesgo: bajo.
- [x] **Fase 6 — Pestaña "Calendario".** Hecho: `<CalendarioPanel>` con dos
      meses lado a lado, selección por arrastre (pointer events, mouse + touch,
      con toque suelto para un día), navegación (‹ › Hoy, saltos por mes) y un
      resumen automático de la selección (total/propias/Dropi con promedio, más
      el conteo de días sin cerrar y sin datos). Motor puro nuevo
      `lib/motor/calendario.ts` (`datoDia`, `correrMes`, `mesesConAlgo`,
      `mesInicial`, `marcarRango`, `resumenSeleccion`) con **9 tests** → **136
      verdes**. Solo lectura. Reusa el estado del store (jornadas de la nube +
      bosquejo del Excel). `tsc`, `lint`, `build` limpios. Riesgo: bajo.
- [x] **Fase 7 — Pestaña "Comparativo".** Hecho: `<ComparativoPanel>` con los
      dos toggles del original (incluir bosquejo / comparar el mismo número de
      días), la tabla **mes a mes** (días, total, delta contra el mes anterior,
      propias, Dropi, % propias, promedio, mejor y peor día, más el estado del
      sello con su diferencia si el mes cambió después de cerrarse), la gráfica
      **Evolución** (`<ComparativoChart>`: barras apiladas propias/Dropi + línea
      de promedio por día sobre un segundo eje, con el total encima de cada
      barra), la tabla **Top del mes** y las tablas de **vendedores** y
      **tiendas** mes a mes. Motor nuevo `lib/motor/comparativo.ts`
      (`resumenCmp`, `corteComun`, `delta`, `topCmp`, `tablaPersonas`,
      `mesesComparables`, `difSellado`) con **17 tests** → **153 verdes**.
      Reusa `datosDelMes()` de la Fase 5, así que el comparativo y el tablero no
      pueden divergir. Solo lectura: no escribe nada. `tsc`, `lint`, `build`
      limpios. Riesgo: medio.
- [x] **Fase 8 — Vista del vendedor (pestaña 5).** Hecho de facto en la
      Fase 3: `app/admin/(panel)/vista-vendedor/page.tsx` renderiza el mismo
      `<VistaEquipo>` que la vista pública `/`, sin iframe y sin duplicar la
      lógica — se eliminó el `<iframe src="index.html">` del paso 10.5. Los
      únicos "iframe" que quedan en el repo son dos comentarios que explican
      qué era antes. `tsc`, `lint`, `build` limpios. Riesgo: bajo.
- [x] **Fase 9 — Exportar imágenes de WhatsApp.** Hecho: motor puro
      `lib/motor/imagen.ts` (`mesImagen`, `datosImagen` — informe del último día
      con barras repartidas, metas por día, totales) y el dibujo
      `lib/imagen/dibujar.ts` (`dibujarImagen` sobre una interfaz `Lienzo2D`
      testeable, canvas 1080×1920, cifra grande + 3 cuadros + mes día por día
      con línea de meta escalonada y rotulada, modos "total" y "propias"). El
      botón `<BotonImagenes>` en el Tablero baja los DOS PNG (consolidado +
      propias) con la pausa de 700 ms del original; el mes de la imagen sale del
      Excel cargado (o el mes en curso), **no** del selector del tablero.
      Cumple la **regla 9**: nunca VS, ranking ni nombres — hay un test que lo
      verifica en ambos modos. La mascota queda opcional (en la app vieja
      `QUINO_SVG` nunca se asignaba, así que salía sin ella). **29 tests**
      nuevos portados desde `pruebas/test-imagen.js` → **182 verdes**. `tsc`,
      `lint`, `build` limpios. Riesgo: medio.
- [x] **Fase 10 — PWA.** Hecho: un **manifest único** `app/manifest.ts`
      (Next enlaza el `<link rel="manifest">` solo; reemplaza los dos
      `manifest.json` + `manifest-admin.json`, porque ahora es una sola app),
      `viewport.themeColor` + `appleWebApp` + iconos en `app/layout.tsx`,
      iconos en `public/` (192, 512, apple-touch, favicon-32), y el service
      worker `public/sw.js` (network-first, offline para el mismo origen)
      registrado por `<RegistrarSW>`. **Diferencia de seguridad vs. la app
      vieja:** el SW **nunca cachea `/admin/*`**, porque ahora esas páginas se
      renderizan en el servidor con datos privados (en la app vieja
      `quin-admin.html` era un shell estático sin datos). `next.config.ts`
      manda `Cache-Control: no-store` para `/sw.js`. `tsc`, `lint`, `build`
      limpios (aparece la ruta `/manifest.webmanifest`). Riesgo: bajo.
- [x] **Fase 11 — Auditoría de backend.** Hecho (solo lectura + un fix
      chico). **Hallazgo principal: el backend está seguro y correcto.** La
      frontera de columna en `jornadas` se verificó: `anon` solo lee
      `fecha, propias, cerrada, actualizado` (nunca `ven`/`tie`/`dropi`/
      `cerrada_el`/`fotos`); `meses`/`ajustes` no los lee anon;
      `ranking_publico` solo `mes/puesto/nombre`; `privado.es_admin()` es
      `SECURITY DEFINER STABLE` con `search_path` fijado. De los 5 puntos del
      plan, **3 ya estaban** (1 migraciones versionadas — hay 4 en el proyecto;
      2 claves en `.env`; 5 sync por mutación puntual). Los puntos **3
      (normalizar `ven`/`tie`) y 4 (ranking en la base) se dejaron pendientes
      a propósito**: cambian la forma de los datos que consume el motor y no
      resuelven ningún problema actual — no vale desestabilizar el motor antes
      de la reorg. Único cambio aplicado: optimización de la policy
      `admin_se_ve` (`auth.uid()` → `(select auth.uid())`, advisor
      `auth_rls_initplan`), idéntica en semántica, reflejada en
      `supabase-esquema.sql`. Advisor de rendimiento quedó **vacío**. El branch
      de Supabase no se usó (requiere plan Pro); el fix, por ser trivial y
      reversible, se aplicó directo a producción con aprobación. Pendiente NO
      aplicado (aviso de seguridad): activar "Leaked Password Protection" en el
      panel de Auth (es un toggle del dashboard, no SQL). Riesgo: bajo.
- [x] **Reorganización de layout (post-Fase 11).** A pedido del usuario, el
      panel de administrador pasó de **5 pestañas con botones** a **una sola
      página que baja en scroll**: las secciones (Cargar, Tablero, Calendario,
      Comparativo) apiladas una debajo de la otra, sin nav. La "Vista del
      vendedor" se **quitó del panel** (es lo que ve el equipo y vive en la
      página pública `/`; no es una herramienta del admin). `/admin` es ahora la página única (`app/admin/(panel)/
      page.tsx` → `<PanelCompleto>`); se borraron las 5 rutas por pestaña y el
      componente `AdminNav`. La cabecera quedó **fija** (sticky) con el correo y
      "cerrar sesión". Login y proxy redirigen a `/admin`. `<VistaEquipo>`
      (Server Component) se pasa como slot desde el server. El hook
      `useHidratarNube` deduplica por referencia para que las 5 secciones
      hidraten la nube **una sola vez**. Puro layout: el motor no se tocó (182
      tests siguen verdes). `tsc`, `lint`, `build` limpios.
- [ ] **Fase 12 — Validación final y corte.** Correr la app nueva contra
      los Excel reales y comparar salida contra la app vieja para el mismo
      período. Solo entonces se mueve producción (dominio/alias de Vercel).
      Riesgo: alto — punto de no retorno, requiere aprobación explícita.
- [ ] **Fase 13 — Retiro de lo viejo.** Archivar `index.html` /
      `quin-admin.html` / `sw.js` viejos; actualizar `.claude/agents/*`
      (hoy referencian un `reporte-ventas.html` que ya no existe) para que
      apunten a la estructura Next.js. Solo después de que la Fase 12 esté
      confirmada en producción por un tiempo. Riesgo: bajo.

## Verificación por fase

- **Lógica pura (Fase 2)**: paridad numérica exacta contra
  `pruebas/test-motor-real.js`, incluidos los dos Excel reales del repo.
- **Pantallas con UI (Fases 3, 5-10)**: correr en el navegador (Next dev
  server) y correr la porción de tests Vitest portada antes de pasar a la
  siguiente fase.
- **Corte final (Fase 12)**: comparar salida número por número entre la app
  vieja y la nueva usando `Reporte de conceptos de remisiones de venta
  2026-07-12.xlsx` y `ordenes_productos_20260712_111712.xlsx`, contra las
  cifras de referencia ya documentadas en `prompt_reporte_ventas.md`.
