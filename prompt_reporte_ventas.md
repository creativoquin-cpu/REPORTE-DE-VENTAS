# Prompt para Antigravity / Claude Code — Reporte de Ventas (estado final)

Copia y pega esto en el Agent de Antigravity. El archivo `reporte-ventas.html` de esta carpeta ya funciona con toda la lógica de abajo — úsalo como base y solo pule/agrega lo que falte, no lo reconstruyas desde cero. Sigue el flujo del `CLAUDE.md` de esta carpeta (agente-planificador → agente-implementador → agente-auditor) para cualquier cambio nuevo.

---

Tengo en esta carpeta un reporte de ventas (`reporte-ventas.html`, tema neón/terminal: fondo oscuro con grilla, acentos cian `#3FE8E0` y azul `#4C8DFF`, fuentes Orbitron + IBM Plex Mono) que carga dos Excel — **EFFI** (`Reporte de conceptos de remisiones de venta *.xlsx`) y **Dropi** (`ordenes_productos_*.xlsx`) — y calcula todo en el navegador con SheetJS y Chart.js, sin backend. Esta es la lógica de negocio ya validada y funcionando, tal cual debe quedar:

## Reglas de negocio (ya implementadas — no cambiar sin confirmar conmigo)

**Ambas plataformas se miden en PRENDAS/UNIDADES por ahora, no en dinero.** El valor en pesos se retoma más adelante.

- **EFFI**: suma la columna `Cantidad`. Excluye siempre las filas donde `Vendedor` = "Cambios". Ranking de vendedores = unidades por `Vendedor`.
- **Dropi**: suma la columna `Cantidad` (no `Total de la orden` todavía). Excluye `Estatus` = "Cancelado". Ranking de tiendas = unidades por `Tienda`. **No se deduplica por `ID`** cuando se suma `Cantidad` — cada fila es un producto distinto dentro del pedido. La deduplicación por `ID` solo se activa si la columna de valor activa es de dinero (`Total de la orden`); el helper `isMoneyColumn()` decide esto solo, en vivo, en cada `recompute()`.
- Detección de columnas por nombre normalizado (sin tildes/mayúsculas), no por posición.
- **Zona de subida única** (ya no hay una casilla por plataforma): un solo `<input type="file" multiple>` acepta el excel de EFFI y el de Dropi juntos o uno a la vez. `detectSystemFromHeaders(headers)` decide sola a cuál plataforma pertenece cada archivo, vía `handleUpload(file)`. Si un archivo no se puede identificar, se muestra un aviso de texto sin perder lo que ya estuviera cargado.
- **El panel de columnas detectadas (los `<select>` de fecha/cantidad/ranking) está oculto siempre, sin excepción**, incluso si la detección automática falla — en ese caso solo se ve un mensaje de error en texto. Los selects (`mapA`/`mapB`) se siguen poblando por dentro pero nunca se muestran.
- Los dos totales (unidades EFFI, unidades Dropi) se muestran como KPIs separados. **Excepción explícita**: hay una tarjeta KPI adicional "Total combinado (último día)" (`kpiCombinadoTotal`) que sí cruza EFFI + Dropi, pero **solo del último día operativo con datos** (`dates[dates.length-1]`) — no es la suma de todo el rango subido. Incluye badge de si ese día cumplió o no la meta de 200. Es la única suma cruzada de las dos plataformas fuera del contexto de la meta combinada por día (ver abajo).

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

## Vista acumulada privada (admin) — ya implementado

Al final de la página, una segunda tabla oculta tras una clave (`ADMIN_PIN = "1234"`, cambiar esa
constante para otra clave) muestra cada ventana de fin de semana/festivo como **una sola fila con
el total acumulado sin dividir** (Fecha inicio, Fecha fin, Día, # Días, Observaciones, Ventas EFFI,
Ventas Dropi, Total del día, % EFFI, % Dropi) — igual al reporte interno real del negocio. Usa
`A.byDateRaw`/`B.byDateRaw` (copia de `byDate` tomada antes de `repartirFinDeSemana()`). Mientras
está bloqueada no se rellena el `<tbody>` (dato no queda expuesto en el DOM). No es seguridad real
(no hay backend), solo un filtro visual como pidió el cliente para que esta vista no la vea
cualquiera. Verificado 1 a 1 contra los reportes reales de junio del negocio.

## Topes / metas diarias — ya implementado

- **180 prendas por vendedor por día operativo** (solo EFFI, tras excluir "Cambios"). Es una **sumatoria**: se suma TODO lo que ese vendedor vendió ese día operativo (todas sus líneas/productos), no se evalúa por línea ni por pedido individual. Se calcula con `buildByDayAndRank()` y se muestra en la tabla nueva **"Cumplimiento de vendedores"** (panel antes de "Detalle por día"): columnas Día, Vendedor, Unidades, Tope 180, con badge ✔ Cumplido / ✖ Faltan N.
- **200 prendas combinadas por día operativo** (EFFI + Dropi sumados, ambos ya en unidades así que la suma es válida). También es una **sumatoria**: total EFFI del día + total Dropi del día. Se muestra como columna nueva "Meta 200" en la tabla **"Detalle por día"**, mismo tipo de badge.
- Constantes `META_VENDEDOR = 180` y `META_COMBINADA = 200` al inicio del script — si el negocio cambia estos números, solo hay que tocar esas dos constantes.

## Vistas (ya implementadas)

- Comparativo diario: gráfico de línea con dos series (unidades EFFI vs. unidades Dropi por día operativo). **Solo muestra un mes a la vez** (arranca en el más reciente con datos) — botones tipo pastilla arriba del gráfico (`comboMesPills`) para saltar a meses anteriores con un clic, sin amontonar todo el histórico subido en una sola línea ilegible. Funciones: `renderComboChartWithMonths()`, `renderComboMonthPills()`, `renderComboChartForSelectedMonth()`.
- KPIs de totales + variación (cambios/cancelados descartados) + una tarjeta "Total combinado (último día)" (EFFI + Dropi solo del último día operativo con datos, con badge de meta 200 cumplida/faltan). Grid responsivo (`repeat(auto-fit,minmax(170px,1fr))`) para que la 5ta tarjeta no rompa el layout.
- Ranking completo de vendedores (EFFI) y de tiendas (Dropi), con medallas 🥇🥈🥉 en el top 3.
- Tabla "Cumplimiento de vendedores" (tope 180) y tabla "Detalle por día" (con meta 200). "Detalle por día" tiene además un gráfico (`renderDetalleChart()`) arriba de la tabla: barras EFFI+Dropi apiladas por día con una línea punteada en la meta de 200, para ver de un vistazo qué días la cumplen — comparte el mismo selector de mes que la tabla (`detalleMesSelect`). En modo "Resumen mensual" el gráfico muestra barras por mes sin la línea de meta (la meta es diaria, no mensual).
- **Agrupación por mes con detalle al seleccionar** (aplica a "Cumplimiento de vendedores", "Detalle por día" e "Historial y comparativo mensual"): por defecto cada tabla muestra un renglón acumulado por mes (unidades EFFI, unidades Dropi/tope, días cumplidos sobre días activos). Al elegir un mes en el `<select>` de esa tabla, cambia a ver el detalle día por día de ese mes. Cada tabla tiene su propio selector independiente (`metasMesSelect`, `detalleMesSelect`, `historialMesSelect`); la selección se conserva si el mes sigue existiendo tras recalcular. Pensado para cuando se sube un excel grande que abarca varios meses de una sola vez.
- **"Historial y comparativo mensual"** (`renderHistorialChart()`) invierte el gráfico según el `<select>` de mes: en "Todos los meses" muestra una barra por mes (resumen); al elegir un mes, el gráfico pasa a mostrar el día a día de ESE mes (barras EFFI+Dropi apiladas) con dos líneas punteadas de referencia — meta de vendedor (180, naranja) y meta combinada (200, roja). Ya no tiene botones de "Descargar/Cargar historial"; el historial vive solo en `localStorage` del navegador.
- Botón "Ver ejemplo" con datos ficticios — la página **no** carga datos de muestra automáticamente al abrir, abre vacía.

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
