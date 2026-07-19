# Prompt para Antigravity / Claude Code — Reporte de Ventas (estado final)

Copia y pega esto en el Agent de Antigravity. El archivo `reporte-ventas.html` de esta carpeta ya funciona con toda la lógica de abajo — úsalo como base y solo pule/agrega lo que falte, no lo reconstruyas desde cero. Sigue el flujo del `CLAUDE.md` de esta carpeta (agente-planificador → agente-implementador → agente-auditor) para cualquier cambio nuevo.

---

Tengo en esta carpeta un reporte de ventas (`reporte-ventas.html`, tema neón/terminal: fondo oscuro con grilla, acentos cian `#3FE8E0` y azul `#4C8DFF`, fuentes Orbitron + IBM Plex Mono) que carga dos Excel — **EFFI** (`Reporte de conceptos de remisiones de venta *.xlsx`) y **Dropi** (`ordenes_productos_*.xlsx`) — y calcula todo en el navegador con SheetJS y Chart.js, sin backend. Esta es la lógica de negocio ya validada y funcionando, tal cual debe quedar:

## Reglas de negocio (ya implementadas — no cambiar sin confirmar conmigo)

**Ambas plataformas se miden en PRENDAS/UNIDADES por ahora, no en dinero.** El valor en pesos se retoma más adelante.

- **EFFI**: suma la columna `Cantidad`. Excluye siempre las filas donde `Vendedor` sea "Cambios", esté **vacío**, o sea exactamente "Miguel" (coincidencia exacta, sin tocar nombres compuestos como "miguel angel angarita ariza"). El filtro de vacío corrige un bug real donde una celda de Vendedor en blanco nunca se descartaba. Se evalúa **en vivo en cada `recompute()`**, no solo al subir el archivo, para corregir también filas ya guardadas de sesiones anteriores. Ranking de vendedores = unidades por `Vendedor`.
- **Dropi**: suma la columna `Cantidad` (no `Total de la orden` todavía). Excluye `Estatus` = "Cancelado". Ranking de tiendas = unidades por `Tienda`. **No se deduplica por `ID`** cuando se suma `Cantidad` — cada fila es un producto distinto dentro del pedido. La deduplicación por `ID` solo se activa si la columna de valor activa es de dinero (`Total de la orden`); el helper `isMoneyColumn()` decide esto solo, en vivo, en cada `recompute()`.
- Detección de columnas por nombre normalizado (sin tildes/mayúsculas), no por posición.
- **Zona de subida única** (ya no hay una casilla por plataforma): un solo `<input type="file" multiple>` acepta el excel de EFFI y el de Dropi juntos o uno a la vez. `detectSystemFromHeaders(headers)` decide sola a cuál plataforma pertenece cada archivo, vía `handleUpload(file)`. Si un archivo no se puede identificar, se muestra un aviso de texto sin perder lo que ya estuviera cargado.
- **Varios archivos del mismo sistema se acumulan, no se reemplazan**: si subes varios excel de EFFI (o de Dropi) que cubren distintos rangos de fechas, sus filas se suman todas en vez de que el último sobrescriba a los anteriores. Se descarta cualquier fila cuyo contenido sea idéntico a una ya cargada antes (por si dos archivos se solapan en fechas), comparando por `JSON.stringify(fila)` guardado en `store[slotKey]._seenRowHashes`. El estado de esa plataforma muestra cuántos archivos y filas lleva acumulados y cuántas filas duplicadas se ignoraron.
- **Persistencia entre sesiones (`localStorage`, clave `reporteVentasRawData_v1`)**: el uso real es diario — cada día se sube solo el archivo nuevo de ese día, no se resube todo desde enero. `saveRawStore()` guarda las filas acumuladas tras cada carga exitosa; `loadRawStore()` las recupera solas al abrir la página (reconstruye `_seenRowHashes`) y dispara `recompute()` — la página ya no abre vacía si hay datos guardados de antes. No hay botón para borrar estos datos (se retiró a propósito). Independiente del resumen por día de "Historial y comparativo mensual" (clave aparte, `reporteVentasHistorial_v1`).
- **Solo el administrador puede subir archivos**: la zona de subida (`#uploadZoneWrap`) está oculta detrás de la misma clave que la vista acumulada (un solo candado global, `#adminGate` al inicio de la página) — un visitante sin la clave nunca ve el input de archivo, solo el reporte ya calculado (o "esperando los datos del administrador" si no hay nada todavía). `tryUnlockAdmin()` revela ambas cosas a la vez; el botón "Cerrar modo administrador" las vuelve a ocultar.
- **Pendiente: backend compartido en Google Sheets**, para que cualquiera que abra la URL vea los mismos datos desde su propio dispositivo (hoy `localStorage` es local a cada navegador). El script de Google Apps Script ya está escrito (`google-apps-script-backend.gs.txt` en esta carpeta, con instrucciones de despliegue incluidas) — falta que el cliente lo despliegue y dé la URL del Web App para conectarlo del lado de `reporte-ventas.html`.
- **El panel de columnas detectadas (los `<select>` de fecha/cantidad/ranking) está oculto siempre, sin excepción**, incluso si la detección automática falla — en ese caso solo se ve un mensaje de error en texto. Los selects (`mapA`/`mapB`) se siguen poblando por dentro pero nunca se muestran.
- Los dos totales (unidades EFFI, unidades Dropi) se muestran como KPIs separados. **Excepción explícita**: hay una tarjeta KPI adicional "Total combinado (último día)" (`kpiCombinadoTotal`) que sí cruza EFFI + Dropi, pero **solo del último día operativo con datos** (`dates[dates.length-1]`) — no es la suma de todo el rango subido. Incluye badge de si ese día cumplió o no la meta de 200. Es la única suma cruzada de las dos plataformas fuera del contexto de la meta combinada por día (ver abajo).
- **Tarjeta KPI "Promedio diario (mes)"** (`kpiPromedioDiario`): promedio de prendas combinadas (EFFI+Dropi) por día operativo del mes del último día con datos. Se muestra con 1 decimal (`fmtUnitsAvg()`, ej. "29,8 u./día"). Hereda automáticamente el modo repartido/admin real sin código propio.

## Día operativo (turno, NO día calendario) — ya implementado

Todo el reporte agrupa "por día" usando el **día operativo**, no la fecha de calendario:

- Lunes a viernes: el turno corre de **8:00am a 8:00am del día siguiente**. Todo lo que ocurre antes de las 8am pertenece al día operativo anterior.
- Sábado: el turno del viernes **cierra a las 7:00am** (no a las 8am). Lo que cae entre sábado 00:00 y 06:59 pertenece al día operativo del viernes.
- Implementado en `businessDayISO(dateObj)`. Para Dropi se combina la columna `FECHA` con `HORA` (`combineDateAndHora()`) porque vienen separadas; para EFFI se usa `Fecha creación`, que ya trae fecha y hora juntas.

## Reparto de fin de semana / festivo largo — ya implementado

Sábado (desde las 7am) y domingo **ya no se dejan tal cual caen en el calendario**: se suman entre los dos y el total se **reparte en partes iguales** entre esos 2 días. EFFI y Dropi se reparten cada uno por su lado, nunca combinados. Funciones: `isFestivoColombia()` (calculadora de festivos, ver abajo), `ventanaFinDeSemanaDe()`, `miembrosDeVentana()`, `repartirFinDeSemana()` y `repartirFinDeSemanaVendedores()` — se aplican en `recompute()` justo después de `buildByDate()` / `buildByDayAndRank()`.

- Fin de semana normal (el lunes siguiente no es festivo): sábado + domingo se dividen entre 2. Corte de la ventana: **lunes 8am** (el lunes arranca su propio turno normal).
- Si el lunes siguiente **es festivo** (calendario oficial de Colombia): se suma también y se reparte entre 3 (sábado+domingo+lunes). Corte de la ventana: **martes 8am**. Si hay festivos consecutivos después del domingo, la ventana sigue creciendo hasta el primer día hábil (el divisor crece igual).
- Un festivo entre semana que no está pegado a un fin de semana (no encadena hacia atrás hasta el domingo) **no** se reparte — día operativo normal.
- Los festivos de Colombia se calculan en vivo con el algoritmo de Gauss/Meeus para la Pascua (`easterSundayDate()`), no es una lista fija: fechas fijas (1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic) + Ley Emiliani trasladadas al lunes siguiente (Reyes, San José, San Pedro y San Pablo, Asunción, Día de la Raza, Todos los Santos, Cartagena) + dependientes de Pascua (Jueves y Viernes Santo, Ascensión, Corpus Christi, Sagrado Corazón).
- El reparto puede dar decimales (ej. 9 entre 2 días = 4.5 cada uno); se guarda exacto y se redondea solo al mostrarlo.

## Modo administrador "real" (sin repartir) — ya implementado

Cuando el administrador está autenticado (`adminUnlocked === true`), **todo el reporte** (KPIs,
Comparativo diario, ranking, Cumplimiento de vendedores, Detalle por día, Historial día a día)
deja de mostrar la versión repartida y muestra cada día operativo tal cual se vendió de verdad:
cada ventana de fin de semana/festivo aparece anclada en su primer día (sábado) con el total
completo, sin dividir entre los días de la ventana — sin barras de rango de fechas especiales,
misma lógica que ya usaba "Vista acumulada". Un visitante sin la clave sigue viendo siempre la
versión repartida de toda la vida.

`recompute()` calcula SIEMPRE ambas versiones (repartida y cruda) y elige con `const useRaw =
adminUnlocked` cuál alimenta el resto de funciones — todas heredan el modo automáticamente. El
**historial persistente (`localStorage`) siempre se guarda repartido**, nunca crudo, para no
corromper lo que ve cualquier otra sesión — es el punto más delicado del cambio. El gráfico de
Historial día a día (única vista que lee del historial persistido en vez de los datos en vivo)
usa una función `collapseWindows()` que revierte el reparto solo para dibujar, sin tocar lo
guardado. Verificado contra los excel reales: Dropi sábado 2026-07-11 (8 u. crudas) se ve como
4+4 repartido para visitantes, y como una sola entrada de 8 u. en 07-11 para el admin.

## Vista acumulada privada (admin) — ya implementado

Al final de la página, una segunda tabla oculta tras una clave (`ADMIN_PIN = "1234"`, cambiar esa
constante para otra clave) muestra cada ventana de fin de semana/festivo como **una sola fila con
el total acumulado sin dividir** (Fecha inicio, Fecha fin, Día, # Días, Observaciones, Ventas EFFI,
Ventas Dropi, Total del día, % EFFI, % Dropi) — igual al reporte interno real del negocio. Usa
`A.byDateRaw`/`B.byDateRaw` (copia de `byDate` tomada antes de `repartirFinDeSemana()`). Mientras
está bloqueada no se rellena el `<tbody>` (dato no queda expuesto en el DOM). No es seguridad real
(no hay backend propio, aunque ver más abajo lo de Google Sheets), solo un filtro visual como pidió
el cliente para que esta vista no la vea cualquiera. Verificado 1 a 1 contra los reportes reales de
junio del negocio. **Comparte el mismo candado que la zona de subida de archivos** (ver regla de
negocio arriba) — ya no tiene su propio campo de clave aparte, un solo `tryUnlockAdmin()` desbloquea
las dos cosas juntas.

## Backend compartido (Google Sheets) — script listo, falta desplegar y conectar

Para que cualquiera que abra la URL del reporte vea los mismos datos desde su propio dispositivo
(hoy cada navegador tiene su propio `localStorage`, aislado). Diseño: cada fila de EFFI/Dropi se
guarda como JSON individual en su propia fila de una Google Sheet (pestañas `EFFI_rows` /
`Dropi_rows`, no un solo bloque JSON gigante, para no toparse con límites de celda con meses de
datos), más una pestaña `Meta` con las columnas detectadas y contadores. `doGet()` deja leer a
cualquiera sin clave; `doPost()` solo escribe si el `pin` recibido coincide con `ADMIN_PIN`, y
dedupea del lado del servidor igual que `handleUpload()` en el navegador.

Código completo en `google-apps-script-backend.gs.txt` (con instrucciones de despliegue en un
comentario al inicio). Falta: (1) que el cliente lo despliegue y entregue la URL del Web App, (2)
conectar `reporte-ventas.html` a esa URL — cualquier visitante hace `fetch` al abrir la página en
vez de depender solo de `localStorage`, y solo el administrador autenticado manda el `POST` con las
filas nuevas tras cada carga. El `POST` debe ir con `Content-Type: text/plain;charset=utf-8` (no
`application/json`) para evitar el preflight CORS que Apps Script no maneja bien.

## Topes / metas diarias — ya implementado

- **180 prendas por vendedor por día operativo** (solo EFFI, tras excluir "Cambios"). Es una **sumatoria**: se suma TODO lo que ese vendedor vendió ese día operativo (todas sus líneas/productos), no se evalúa por línea ni por pedido individual. Se calcula con `buildByDayAndRank()` y se muestra en la tabla nueva **"Cumplimiento de vendedores"** (panel antes de "Detalle por día"): columnas Día, Vendedor, Unidades, Tope 180, con badge ✔ Cumplido / ✖ Faltan N.
- **200 prendas combinadas por día operativo** (EFFI + Dropi sumados, ambos ya en unidades así que la suma es válida). También es una **sumatoria**: total EFFI del día + total Dropi del día. Se muestra como columna nueva "Meta 200" en la tabla **"Detalle por día"**, mismo tipo de badge.
- Constantes `META_VENDEDOR = 180` y `META_COMBINADA = 200` al inicio del script — si el negocio cambia estos números, solo hay que tocar esas dos constantes.

## Vistas (ya implementadas)

- Comparativo diario: gráfico de línea con dos series (unidades EFFI vs. unidades Dropi por día operativo). **Solo muestra un mes a la vez** (arranca en el más reciente con datos) — botones tipo pastilla arriba del gráfico (`comboMesPills`) para saltar a meses anteriores con un clic, sin amontonar todo el histórico subido en una sola línea ilegible. Funciones: `renderComboChartWithMonths()`, `renderComboMonthPills()`, `renderComboChartForSelectedMonth()`.
- KPIs de totales + variación (cambios/cancelados descartados) + una tarjeta "Total combinado (último día)" (EFFI + Dropi solo del último día operativo con datos, con badge de meta 200 cumplida/faltan). Grid responsivo (`repeat(auto-fit,minmax(170px,1fr))`) para que la 5ta tarjeta no rompa el layout.
- Ranking completo de vendedores (EFFI) y de tiendas (Dropi), con medallas 🥇🥈🥉 en el top 3.
- Tabla "Cumplimiento de vendedores" (tope 180) y tabla "Detalle por día" (con meta 200). "Detalle por día" tiene además un gráfico (`renderDetalleChart()`) arriba de la tabla: barras EFFI+Dropi apiladas por día con una línea punteada en la meta de 200, para ver de un vistazo qué días la cumplen — comparte el mismo selector de mes que la tabla (`detalleMesSelect`). Encima de cada columna se dibuja el total del día (EFFI+Dropi) con el mismo plugin `stackedTotalLabelPlugin` que usa "Historial y comparativo mensual". En modo "Resumen mensual" el gráfico muestra barras por mes sin la línea de meta ni el total encima (la meta es diaria, no mensual).
- **Agrupación por mes con detalle al seleccionar** (aplica a "Cumplimiento de vendedores", "Detalle por día" e "Historial y comparativo mensual"): por defecto cada tabla muestra un renglón acumulado por mes (unidades EFFI, unidades Dropi/tope, días cumplidos sobre días activos). Al elegir un mes en el `<select>` de esa tabla, cambia a ver el detalle día por día de ese mes. Cada tabla tiene su propio selector independiente (`metasMesSelect`, `detalleMesSelect`, `historialMesSelect`); la selección se conserva si el mes sigue existiendo tras recalcular. Pensado para cuando se sube un excel grande que abarca varios meses de una sola vez.
- **"Historial y comparativo mensual"**: el gráfico (`renderHistorialChart()`) invierte según el `<select>` de mes: en "Todos los meses" muestra una barra por mes (resumen); al elegir un mes, pasa a mostrar el día a día de ESE mes (barras EFFI+Dropi apiladas) con dos líneas punteadas de referencia — meta de vendedor (180, naranja) y meta combinada (200, roja). Encima de cada columna se dibuja el total del día (EFFI+Dropi) vía un plugin propio de Chart.js (`stackedTotalLabelPlugin`, reutilizable). La **tabla** de abajo (`renderHistorialTable()`) es independiente del select y **siempre** muestra el resumen por mes (nunca detalle día a día) — el detalle diario solo vive en el gráfico. Ya no tiene botones de "Descargar/Cargar historial"; el historial vive solo en `localStorage` del navegador.
  - **Cuidado con las líneas de meta y `stacked:true`**: cada dataset `type:'line'` de este gráfico necesita su propio `stack` id (`meta-vendedor-line`, `meta-combinada-line`) distinto del `stack:'total'` de las barras. Si dos líneas quedan sin `stack` propio en un eje con `stacked:true`, Chart.js las suma entre sí (bug real ya corregido: la línea de 200 se dibujaba en 380 = 180+200). Aplica la misma regla si se agrega alguna línea nueva a `renderDetalleChart()` día a día.
  - El número que dibuja `stackedTotalLabelPlugin` encima de cada columna (vista día a día de "Historial" y de "Detalle por día") es solo el número, sin "u." al lado — se quitó a pedido del cliente por espacio/legibilidad. Los ejes Y y las tarjetas KPI sí siguen mostrando "u." normal; el cambio fue solo en esa etiqueta encima de la barra.
  - **El select de Historial (`historialMesSelect`) abre siempre en el mes calendario de hoy** (`todayMonthKey()`, reloj del sistema — no el mes con más datos): si es julio, arranca en julio; si es marzo, en marzo. El mes actual aparece seleccionable aunque todavía no tenga datos (fila en ceros). Solo defaultea así la primera vez que se llena el select en la sesión; si el usuario cambia de mes, se respeta. Es exclusivo de este selector — los demás (combo, detalle, metas) no cambiaron.
- **Botón "Ver ejemplo" usa datos REALES de referencia**, no inventados: 4 días operativos de los excel de esta carpeta (EFFI 99 u. el viernes 07-10; Dropi 1/11/4/4 en 07-09/07-10/07-11 sábado/07-12 domingo, ya repartido a mano en el objeto `SNAPSHOT`), para mostrar el reparto de fin de semana funcionando. La página **no** carga esto automáticamente al abrir. Abre vacía solo la primera vez; si ya hay excel acumulados guardados en este navegador, se recargan solos (ver "Persistencia entre sesiones" arriba).

## Mascota

Robot azul/blanco/negro (`Pasted-20260712-091019.svg`) en el encabezado: flotación permanente, resplandor pulsante en la antena, sombra que se comprime en sincronía, y animación de salto/celebración cada vez que se procesa un archivo con éxito.

## Números de referencia para validar que no se rompió nada

Con los excel de ejemplo de esta carpeta:
- **Dropi**: 20 unidades totales (24 filas − 4 canceladas, sin deduplicar). 2026-07-09 (jueves) → 1. 2026-07-10 (viernes) → 11. 2026-07-11 es **sábado**: 8 unidades crudas, pero el lunes siguiente (07-13) no es festivo, así que se reparten entre 2 → **07-11 → 4** y **07-12 (domingo) → 4** (día nuevo por el reparto). Tienda líder total (no cambia con el reparto): "Tiko" con 9 unidades.
- **EFFI**: 99 unidades, todas en el día operativo 2026-07-10 (viernes, sin reparto). Vendedora líder: "Lucenith Quintero Leon" con 24 unidades (le faltan 156 para el tope de 180 — con esta muestra tan chica nadie llega al tope, es esperable, no es un bug).
- **Combinado 2026-07-10**: EFFI 99 + Dropi 11 = 110 (faltan 90 para la meta de 200). Sin cambios por el reparto.
- **KPI "Total combinado (último día)"**: el último día operativo con datos en esta muestra es 2026-07-12 (domingo, generado por el reparto): EFFI 0 + Dropi 4 = 4 u. (faltan 196 para la meta de 200) — distinto del combinado de 2026-07-10 (110 u.), que no es el último día.
- Prueba de bordes del turno: sábado 06:59am cae en el día operativo del viernes anterior; sábado 07:01am entra en la ventana de fin de semana (se reparte); lunes antes de las 8am cuenta como domingo (parte de la ventana); lunes 8:01am es su propio día normal (salvo que el lunes sea festivo).
- Festivos de Colombia 2026 esperados (18 en total): 1 ene, 12 ene, 23 mar, 2 abr, 3 abr, 1 may, 18 may, 8 jun, 15 jun, 29 jun, 20 jul, 7 ago, 17 ago, 12 oct, 2 nov, 16 nov, 8 dic, 25 dic.

## Pendientes para más adelante (no hacer ahora salvo que se pida)

- Retomar el valor en pesos: total EFFI en dinero (`Observación concepto` × `Cantidad`) y confirmar si Dropi debe volver a mostrarse también en pesos (`Total de la orden`, con deduplicación por `ID`, ya soportado por `isMoneyColumn()`).
- El reparto de fin de semana solo cubre festivo(s) pegados justo después del domingo (lunes, martes...); no cubre un festivo el viernes anterior al fin de semana.
- Revisar el manejo de archivos con varias hojas o encabezados con espacios/formatos raros.

Antes de dar algo por terminado, abre la página con los dos excel de esta carpeta y confirma que los números coinciden con los de referencia de arriba.
