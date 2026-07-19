# Reporte de Ventas — instrucciones del proyecto

Página web sin backend (`reporte-ventas.html`) que carga dos Excel — **EFFI** (`Reporte de conceptos de remisiones de venta *.xlsx`) y **Dropi** (`ordenes_productos_*.xlsx`) — y calcula ventas, KPIs y rankings en el navegador (SheetJS + Chart.js por CDN). Tema visual neón/terminal. Mascota animada en el encabezado (`Pasted-20260712-091019.svg`).

## Flujo de trabajo obligatorio para cualquier cambio

Siempre que haya que **crear o modificar** algo en este proyecto, sigue este orden — no lo saltes:

1. **`agente-planificador`** — analiza el pedido y entrega un plan (qué archivos, qué cambia, qué reglas de negocio se tocan, cómo se valida). No escribe código.
2. **`agente-implementador`** — ejecuta ese plan exactamente, sin inventar reglas nuevas. Escribe/edita el código.
3. **`agente-auditor`** — verifica el resultado contra las reglas de negocio y los números de referencia de abajo, y da un veredicto (aprobado / aprobado con observaciones / rechazado). No escribe código.

Si el agente-auditor rechaza algo, vuelve al agente-implementador con el detalle exacto de qué corregir. No se da nada por terminado sin el visto bueno del auditor.

## Reglas de negocio vigentes

- **Ambas plataformas se miden en unidades/prendas, no en dinero** (el valor en pesos se retoma más adelante, a propósito).
- **EFFI**: suma `Cantidad`, excluye filas donde `Vendedor` sea "Cambios", esté **vacío**, o sea exactamente "Miguel" (coincidencia exacta insensible a mayúsculas/tildes — NO afecta a vendedores con nombre completo que contenga esa palabra, como "miguel angel angarita ariza"), ranking por `Vendedor`. El filtro de vacío/Miguel corrige un bug real: `applyAutoFilter()` antes solo excluía si la celda tenía contenido y coincidía con el patrón (`if(s && badRegex.test(s))`), así que una fila con `Vendedor` en blanco nunca se descartaba, sin importar la regla — se contaba como venta válida por error. El parámetro `dropEmpty` de `applyAutoFilter()` corrige esto (solo para EFFI; Dropi no cambió). Este filtro se evalúa **en vivo dentro de `recompute()`** (no solo al subir el archivo, mismo patrón que el dedup de Dropi) para que también corrija filas que ya estuvieran guardadas en `localStorage` de antes de esta regla — así los datos de meses ya acumulados (ej. junio) también quedan corregidos sin tener que volver a subir el excel.
- **Dropi**: suma `Cantidad`, excluye `Estatus` = "Cancelado", ranking por `Tienda`. No deduplica por `ID` (solo aplicaría si se sumara dinero — ver `isMoneyColumn()` en el código, evaluado en vivo en cada `recompute()`, no solo al subir el archivo).
- Detección de columnas por nombre normalizado (sin tildes/mayúsculas), no por posición.
- **Zona de subida única**: un solo input de archivo (acepta EFFI y Dropi juntos o uno a la vez, `multiple`); no hay una casilla por plataforma. `detectSystemFromHeaders(headers)` decide sola a cuál de las dos (`store.A` o `store.B`) pertenece cada archivo subido, vía `handleUpload(file)`. Si un archivo no se puede identificar por sus columnas, se muestra un aviso de texto (`statusUpload`) sin bloquear lo que ya estuviera cargado.
- **Solo el administrador puede subir archivos**: la zona de subida (`#uploadZoneWrap`) está oculta detrás del mismo candado que la vista acumulada (ver más abajo) — un visitante sin la clave nunca ve el `<input type="file">`, solo el reporte ya calculado (o un aviso de "esperando los datos del administrador" si todavía no hay nada). `tryUnlockAdmin()` revela ambas cosas a la vez con una sola clave; `#adminLockBtn` ("Cerrar modo administrador") las vuelve a ocultar.
- **Varios archivos del mismo sistema se ACUMULAN, no se reemplazan**: si subes, por ejemplo, 3 excel de EFFI que cubren distintos rangos de fechas (enero-marzo, abril-mayo, junio-julio), sus filas se suman todas en `store.A.rows` en vez de que el último sobrescriba a los anteriores. Para evitar contar dos veces si dos archivos se solapan en fechas, se descarta cualquier fila cuyo contenido (todas las columnas) sea idéntico a una ya cargada antes (comparación por `JSON.stringify(fila)`, guardada en `store[slotKey]._seenRowHashes`). El mensaje de estado de esa plataforma muestra cuántos archivos y filas lleva acumulados, y cuántas filas idénticas se ignoraron.
- **Los excel acumulados se guardan entre sesiones (`localStorage`, clave `reporteVentasRawData_v1`)**: el uso real es diario — cada día se sube solo el archivo nuevo de ese día, no se resube todo desde enero cada vez. `saveRawStore()` guarda `store.A.rows`/`store.B.rows` (ya filtrados y acumulados) después de cada carga exitosa; `loadRawStore()` los recupera solos al abrir la página (reconstruyendo `_seenRowHashes` a partir de las filas guardadas) y dispara `recompute()` — la página ya NO abre vacía si hay datos guardados de antes. No hay botón para borrar estos datos (se retiró a pedido del cliente, para que nadie los borre sin querer); **no** afecta el resumen por día de "Historial y comparativo mensual", que vive en una clave de `localStorage` aparte (`reporteVentasHistorial_v1`).
- **Backend compartido en Google Sheets ya desplegado y conectado** (para que cualquiera que abra la URL del reporte, desde su propio computador o celular, vea los mismos datos — ya no depende solo de `localStorage`, que es local a cada navegador). Ver sección "Backend compartido (Google Sheets)" más abajo.
- **El panel de columnas detectadas (mapping) está oculto siempre, sin excepción** — ni siquiera se muestra si la detección automática falla en algún archivo raro; solo se ve un mensaje de error en texto. Los `<select>` de columnas (`mapA`/`mapB`) se siguen poblando y quedan operativos por dentro (por si se reactiva la UI más adelante), pero nunca reciben la clase `.show`.
- KPIs de EFFI y Dropi siempre separados. **Dos excepciones explícitas** donde sí se cruzan: la meta combinada del día operativo (ver abajo) y la tarjeta KPI "Total combinado (último día)" (`kpiCombinadoTotal`) — muestra **solo el último día operativo con datos** (`dates[dates.length-1]`), NO la suma de todo el rango subido, junto con el badge de si cumplió o no la meta de 200 ese día. Fuera de esas dos, no se combinan.
- **Tarjeta KPI "Promedio diario (mes)"** (`kpiPromedioDiario`): promedio de prendas combinadas (EFFI+Dropi) por día operativo, del mes del último día con datos (mismo mes que usa "Total combinado"). Se calcula en `recompute()` dividiendo la suma combinada del mes entre la cantidad de días operativos con datos ese mes; se muestra con 1 decimal vía `fmtUnitsAvg()` (ej. "29,8 u./día"), a diferencia de `fmtUnits()` que redondea a entero. Funciona igual en modo visitante (repartido) y modo administrador real (sin repartir) sin código propio, porque usa `A.byDate`/`B.byDate` ya elegidos según el modo — el número de días con datos cambia entre modos (la ventana de fin de semana cuenta como 1 día operativo en modo admin, no 2), así que el promedio también cambia, correctamente.
- La página abre vacía **solo la primera vez** (sin datos guardados); si ya hay excel acumulados guardados en este navegador, se recargan solos al abrir (ver "persistencia" abajo). El mensaje de "vacío" cambia según quién lo ve: al administrador (clave ya ingresada) se le invita a subir los excel; a un visitante sin la clave se le avisa que espere a que el administrador los suba (`emptyStateHTML()` / `refreshEmptyStateMessage()`). El ejemplo ficticio solo se ve detrás del botón "Ver ejemplo", visible para cualquiera.

## Día operativo (turno, NO día calendario)

Todo el reporte agrupa "por día" usando el **día operativo**, implementado en `businessDayISO(dateObj)`:

- Lunes a viernes: el turno corre de 8:00am a 8:00am del día siguiente. Antes de las 8am pertenece al día operativo anterior.
- Sábado: el turno del viernes cierra a las 7:00am (no a las 8am). Sábado 00:00–06:59 pertenece al día operativo del viernes.
- Dropi: combina `FECHA` + `HORA` con `combineDateAndHora()` (vienen en columnas separadas). EFFI: usa `Fecha creación` directo (ya trae fecha y hora juntas).

## Reparto de fin de semana / festivo largo

Sábado (desde las 7am) y domingo **ya no se dejan tal cual caen en el calendario** — se suman entre los dos y ese total se **reparte en partes iguales** entre esos 2 días (`repartirFinDeSemana()` / `repartirFinDeSemanaVendedores()`, aplicadas en `recompute()` justo después de `buildByDate()` / `buildByDayAndRank()`). EFFI y Dropi se reparten cada uno por su lado, nunca combinados.

- Fin de semana normal (el lunes siguiente NO es festivo): sábado + domingo se suman y se dividen entre 2. El corte de esa ventana es el **lunes a las 8am** — el lunes arranca su propio turno normal 8am-8am, sin nada del finde.
- Si el lunes siguiente **es festivo** (calendario oficial de Colombia): se suma también al total y se reparte entre 3 (sábado+domingo+lunes). El corte pasa a ser el **martes a las 8am**. Si hay festivos consecutivos después del domingo (ej. martes también festivo), se sigue sumando y repartiendo hasta el primer día hábil — el divisor crece según cuántos días entren en la ventana.
- Un festivo entre semana que **no está pegado a un fin de semana** (ej. un festivo aislado un jueves o viernes que no encadena hasta el domingo anterior) **no** entra en este reparto — se deja como un día operativo normal, sin dividir.
- Los festivos de Colombia se calculan en vivo con el algoritmo de Gauss/Meeus para la Pascua (`easterSundayDate()`), válido para cualquier año — no es una lista fija que haya que mantener a mano. Incluye fechas fijas (1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic), las que la Ley Emiliani traslada al lunes siguiente (Reyes, San José, San Pedro y San Pablo, Asunción, Día de la Raza, Todos los Santos, Independencia de Cartagena), y las que dependen de la Pascua (Jueves y Viernes Santo, Ascensión, Corpus Christi, Sagrado Corazón).
- El reparto puede dar unidades con decimales (ej. 9 prendas entre 2 días = 4.5 cada uno). Se guarda el valor exacto para que la suma cierre sin perder unidades; se redondea solo al mostrarlo (`fmtUnits()`).

## Modo administrador "real" (sin repartir) — ya implementado

Cuando `adminUnlocked === true`, **todo el reporte** (KPIs, "Comparativo diario", ranking,
"Cumplimiento de vendedores", "Detalle por día", "Historial y comparativo mensual" día a día)
deja de mostrar la versión repartida y muestra cada día operativo **tal cual se vendió de
verdad**: cada ventana de fin de semana/festivo aparece anclada en su primer día (sábado) con
el total completo, y los demás días miembros (domingo, festivo) desaparecen de esa vista — sin
barras de "rango de fechas" especiales, es la misma lógica que ya usaba "Vista acumulada". Un
visitante sin la clave sigue viendo siempre la versión repartida de toda la vida, sin cambios.

- En `recompute()`: se guardan copias crudas `A.byDateRaw`/`B.byDateRaw`/`A.byDayRankRaw` (antes
  de repartir) y se calculan SIEMPRE las versiones repartidas `A_rep`/`B_rep`/`rank_rep` (el
  reparto sigue siendo la regla de negocio vigente, no desaparece). `const useRaw =
  adminUnlocked;` decide cuál de las dos alimenta `A.byDate`/`B.byDate`/`A.byDayRank`, y de ahí
  en adelante TODAS las funciones de render (`renderComboChartWithMonths`, `renderTable`/
  `renderDetalleChart`, `renderMetasVendedores`, ranking, KPIs) heredan el modo automáticamente
  porque ya reciben los datos elegidos, sin código propio.
- **El historial persistente (`localStorage`, `reporteVentasHistorial_v1`, compartido entre
  sesiones) SIEMPRE se guarda repartido** (`upsertHistorialDays(datesRep, A_rep, B_rep)`), nunca
  crudo — si se guardara crudo mientras el admin está en modo real, se corrompería lo que ve
  cualquier otra sesión/visitante después. Es el punto más delicado de este cambio.
- El gráfico de "Historial y comparativo mensual" día a día es la única vista que lee de
  `loadHistorial()` (persistido, siempre repartido) en vez de `A.byDate` directamente — por eso
  necesita su propia función `collapseWindows(byDateMap)`, que revierte el reparto sumando cada
  ventana en su primer día (aprovecha que el reparto conserva la suma total), aplicada solo si
  `adminUnlocked` es true, solo para dibujar, sin tocar `localStorage`.
- "Vista acumulada" no cambió: sigue leyendo siempre `A.byDateRaw`/`B.byDateRaw` directamente,
  independiente del toggle — ya mostraba lo mismo que ahora ve el admin en el resto de tablas.
- `tryUnlockAdmin()` y el botón "Cerrar modo administrador" llaman `recompute()` al final, para
  que el toggle dispare el recálculo completo con el modo correcto sin recargar la página.
- Los resúmenes mensuales (Detalle por día en "Resumen mensual", tabla de Historial) dan el mismo
  total en ambos modos porque el reparto conserva la suma — solo cambia el detalle día a día.
- Caso borde conocido, no implementado: una ventana de fin de semana que cruce frontera de mes
  (ej. sábado 31 + domingo 1) queda anclada entera en el mes del sábado en modo admin, mientras
  el resumen de Historial (siempre repartido) la divide entre los dos meses — solo pasa en modo
  admin, y solo si algún mes sube/baja empezando o terminando justo en fin de semana.

## Vista acumulada (privada, solo administradores)

Ademas de "Detalle por día" (pública, ya repartida entre días), hay una segunda tabla al final de
la página — `buildVistaAcumulada()` — que muestra cada ventana de fin de semana/festivo como **una
sola fila con el total acumulado sin dividir** (Fecha inicio, Fecha fin, Día, # Días,
Observaciones, Ventas EFFI, Ventas Dropi, Total del día, % EFFI, % Dropi), igual al reporte interno
real del negocio ("ventas reales"). Los días que no caen en ninguna ventana se muestran igual que
siempre (fila normal de 1 día, sin Observaciones).

- Usa `A.byDateRaw` / `B.byDateRaw` — copias de `byDate` guardadas en `recompute()` justo **antes**
  de `repartirFinDeSemana()` — para no perder el total original de la ventana.
- Es **privada**: vive en la misma página pero queda oculta detrás de una clave (`ADMIN_PIN`,
  constante fija en el código, valor actual `"1234"` — para cambiarla solo hay que editar esa
  constante). Como la página no tiene backend, la clave es un filtro visual, no seguridad real (el
  código fuente es visible para cualquiera con acceso al archivo).
- **Comparte un solo candado con la zona de subida de archivos** (`#adminGate` al inicio de la
  página, arriba de donde antes estaba siempre visible la zona de carga): ya no tiene su propio
  campo de clave aparte — `tryUnlockAdmin()` desbloquea las dos cosas a la vez (`#uploadZoneWrap` y
  `#adminContent`), y `#adminLockBtn` ("Cerrar modo administrador") las vuelve a ocultar juntas.
- Mientras está bloqueada, la tabla NO se rellena en el DOM — los datos solo viven en la variable
  `vistaAcumuladaCache` en memoria, no se inyectan al `<tbody>` hasta que se ingresa la clave
  correcta.
- Verificado contra los reportes reales del negocio ("ventas Diarias Junio.pdf" = vista repartida
  por día, "ventas reales de Junio.pdf" = vista acumulada por ventana): las 23 filas de junio 2026
  coinciden exactamente, incluyendo las 3 ventanas "Sábado a Lunes Festivo" (6-8, 13-15 y 27-29 de
  junio, por Corpus Christi/Sagrado Corazón/San Pedro y San Pablo) y la ventana normal "Sábado a
  Domingo" (20-21 de junio, con el 22 de junio —lunes normal— como fila propia fuera de la
  ventana). Esto confirma que `repartirFinDeSemana()` ya replica correctamente el proceso real: la
  vista acumulada es la ventana sin dividir, la vista diaria es esa misma ventana repartida en
  partes iguales.

## Topes / metas diarias

- **180 prendas por vendedor por día operativo** (solo EFFI, tras excluir "Cambios"). Es una **sumatoria**: se suma TODO lo que ese vendedor vendió ese día operativo (todas sus líneas/productos), no se evalúa por línea ni por pedido individual. Tabla "Cumplimiento de vendedores", vía `buildByDayAndRank()`.
- **200 prendas combinadas por día operativo** (EFFI + Dropi sumados). También es una **sumatoria**: total EFFI del día + total Dropi del día. Columna "Meta 200" en "Detalle por día".
- Constantes `META_VENDEDOR = 180` y `META_COMBINADA = 200` al inicio del script — si el negocio cambia estos números, solo hay que tocar esas dos constantes.

## Vistas

- Comparativo diario: gráfico de línea con dos series (unidades EFFI vs. unidades Dropi por día operativo, ya con el reparto de fin de semana aplicado). **Solo muestra un mes a la vez** (arranca en el más reciente con datos), con botones tipo pastilla arriba del gráfico (`comboMesPills`) para cambiar de mes con un clic — evita que subir varios meses de histórico deje el gráfico ilegible. Funciones: `renderComboChartWithMonths()`, `renderComboMonthPills()`, `renderComboChartForSelectedMonth()`.
- KPIs de totales + variación (cambios/cancelados descartados) + tarjeta "Total combinado (último día)" (EFFI+Dropi del último día operativo con datos, con badge de meta 200 cumplida/faltan). Grid responsivo (`repeat(auto-fit,minmax(170px,1fr))`) para que la 5ta tarjeta no rompa el layout.
- Ranking completo de vendedores (EFFI) y de tiendas (Dropi), con medallas 🥇🥈🥉 en el top 3.
- Tabla "Cumplimiento de vendedores" (tope 180) y tabla "Detalle por día" (con meta 200). "Detalle por día" tiene además un gráfico (`renderDetalleChart()`) arriba de la tabla: barras EFFI+Dropi apiladas por día con una línea punteada en la meta de 200, para ver de un vistazo qué días la cumplen — comparte el mismo selector de mes que la tabla (`detalleMesSelect`). Encima de cada columna se dibuja el total del día (EFFI+Dropi) con el mismo plugin `stackedTotalLabelPlugin` que usa "Historial y comparativo mensual". En modo "Resumen mensual" el gráfico muestra barras por mes sin la línea de meta ni el total encima (la meta es diaria, no mensual).
- **Agrupación por mes con detalle al seleccionar** (aplica a "Cumplimiento de vendedores", "Detalle por día" e "Historial y comparativo mensual"): por defecto cada tabla muestra un renglón acumulado por mes; al elegir un mes en el `<select>` de esa tabla, cambia a ver el detalle día por día de ese mes. Selectores independientes por tabla: `metasMesSelect`, `detalleMesSelect`, `historialMesSelect` — la selección se conserva si el mes sigue existiendo tras recalcular. Pensado para excel grandes que abarcan varios meses.
- **"Historial y comparativo mensual"**: el gráfico (`renderHistorialChart()`) invierte según el `<select>` de mes: en "Todos los meses" muestra una barra por mes (resumen); al elegir un mes, pasa a mostrar el día a día de ESE mes (barras EFFI+Dropi apiladas) con dos líneas punteadas de referencia — meta de vendedor (180, naranja) y meta combinada (200, roja) — para ver de un vistazo qué días las alcanzan. Encima de cada columna se dibuja el total del día (EFFI+Dropi) vía un plugin propio de Chart.js (`stackedTotalLabelPlugin`, reutilizable pasando `plugins:{stackedTotalLabel:{barIndices:[...]}}`). La **tabla** de abajo (`renderHistorialTable()`) es independiente del select y **siempre** muestra el resumen por mes (nunca detalle día a día) — el detalle diario solo vive en el gráfico. El botón "Descargar/Cargar historial" se retiró; el historial vive solo en `localStorage` del navegador.
  - **Bug corregido (Chart.js, líneas de meta apiladas entre sí)**: como el eje Y de esta vista día-a-día tiene `stacked:true` (para apilar las barras EFFI+Dropi), los dos datasets `type:'line'` de las metas necesitan CADA UNO su propio `stack` id (`meta-vendedor-line` y `meta-combinada-line`) — si no lo tienen, Chart.js las agrupa en el mismo stack implícito y las suma entre sí (la línea de 200 terminaba dibujada en 380 = 180+200, pegada arriba de las barras). Detectado por el cliente comparando un screenshot contra la posición esperada de la línea. Si se agrega alguna línea de referencia nueva a este gráfico (o a `renderDetalleChart()` día a día, que hoy solo tiene una línea y por eso no le pasa esto), hay que darle su propio `stack` de inmediato.
  - La etiqueta que dibuja `stackedTotalLabelPlugin` encima de cada columna (vista día a día de "Historial" y de "Detalle por día") muestra solo el número, sin "u." — se quitó a pedido del cliente. Los ejes Y y las tarjetas KPI conservan el sufijo "u." normal, solo cambió esa etiqueta sobre la barra.
  - **El `<select>` de "Historial y comparativo mensual" (`historialMesSelect`) abre siempre en el mes calendario de HOY** (`todayMonthKey()`, según el reloj del sistema — no el día operativo ni el mes más reciente con datos): si estamos en julio, arranca mostrando julio; si es marzo, marzo. Aunque el mes actual todavía no tenga ningún día guardado en el historial, aparece como opción seleccionable (con fila en ceros en la tabla resumen). Este default solo aplica la PRIMERA vez que se llena el select en la sesión (`select.options.length === 0`); si el usuario cambia de mes a mano, esa elección se respeta en los recálculos siguientes. Es un comportamiento exclusivo de `historialMesSelect` — los demás selectores (`comboSelectedMonth` en "Comparativo diario", `detalleMesSelect`, `metasMesSelect`) no cambiaron: siguen defaulteando al mes más reciente con datos o a "Resumen mensual" según corresponda.
- **Botón "Ver ejemplo" (`SNAPSHOT`) usa datos REALES de referencia, no inventados** — 4 días operativos consecutivos tomados de los excel que ya están en esta carpeta (EFFI 99 u. el viernes 2026-07-10; Dropi 1/11/4/4 en 07-09/07-10/07-11(sábado)/07-12(domingo)), a propósito para que el ejemplo muestre el reparto de fin de semana funcionando ("el reporte del día sábado"). `dropiValue` de 07-11/07-12 ya viene repartido a mano en el objeto (4 y 4, no el crudo 8) porque `loadSnapshot()` nunca llama a `repartirFinDeSemana()` — pinta los mapas tal cual. `SNAPSHOT.byDayRank` está anclado explícitamente a `'2026-07-10'` (no a `dates[0]`, que ya no es esa fecha). La página no carga estos datos automáticamente al abrir — solo detrás del botón.

## Números de referencia (validar cualquier cambio contra esto)

- **Dropi**: 20 unidades totales (24 filas − 4 canceladas, sin deduplicar). 2026-07-09 (jueves) → 1 unidad, sin cambios. 2026-07-10 (viernes) → 11 unidades, sin cambios. 2026-07-11 es **sábado**, con 8 unidades crudas antes del reparto; como el lunes siguiente (2026-07-13) no es festivo, esas 8 se reparten entre 2 → **2026-07-11 → 4** y **2026-07-12 (domingo) → 4** (día nuevo que antes no existía). Tienda líder total (no cambia con el reparto, es un total general): "Tiko" con 9 unidades.
- **EFFI**: 99 unidades totales, todas en el día operativo 2026-07-10 (viernes, sin reparto). Vendedora líder: "Lucenith Quintero Leon" con 24 unidades (le faltan 156 para el tope de 180 — con esta muestra tan chica nadie llega al tope, es esperable).
- **Combinado 2026-07-10**: EFFI 99 + Dropi 11 = 110 (faltan 90 para la meta de 200). Sin cambios por el reparto (viernes no es fin de semana).
- **KPI "Total combinado (último día)"** con esta muestra: el último día operativo con datos es 2026-07-12 (domingo, generado por el reparto), EFFI 0 + Dropi 4 = 4 u. (faltan 196 para la meta de 200) — no confundir con el combinado de 2026-07-10 (110 u.), que es un día distinto y no el último.
- **Bordes de turno**: sábado 06:59am → día operativo del viernes anterior; sábado 07:01am → entra en la ventana de fin de semana (se reparte); lunes antes de las 8am → cuenta como domingo (parte de la ventana); lunes 8:01am → día propio normal, fuera de la ventana (salvo que el lunes sea festivo).
- **Festivos de Colombia 2026 calculados** (para probar `isFestivoColombia()`): 1 ene, 12 ene (Reyes movido), 23 mar (San José movido), 2 abr (Jueves Santo), 3 abr (Viernes Santo), 1 may, 18 may (Ascensión), 8 jun (Corpus Christi), 15 jun (Sagrado Corazón), 29 jun (San Pedro y San Pablo, cae lunes), 20 jul, 7 ago, 17 ago (Asunción movida), 12 oct (Día de la Raza, cae lunes), 2 nov (Todos los Santos movido), 16 nov (Cartagena movido), 8 dic, 25 dic — 18 festivos en total.

## Backend compartido (Google Sheets) — ya implementado y verificado en vivo

Objetivo cumplido: cualquiera que abra la URL del reporte, desde su propio computador o celular,
ve los mismos datos — ya no depende solo de `localStorage`, que es local a cada navegador.
Almacén central: una Google Sheet ("Reporte de Ventas - Datos"), vía un Google Apps Script
("Backend Reporte de Ventas") publicado como "Aplicación web".

- Script fuente: `google-apps-script-backend.gs.txt` en esta carpeta (con las instrucciones de
  despliegue en un comentario al inicio). Ya desplegado en la cuenta de Google del cliente
  (`creativoquin@gmail.com`).
- **Trampa real ya encontrada al desplegar**: en el diálogo "Implementar", el campo "Usuarios con
  acceso" puede quedar guardado como "Solo yo" aunque se haya seleccionado "Cualquiera" al crear
  la implementación por primera vez — el síntoma es que el `GET` público redirige a un login de
  Google (`accounts.google.com`) en vez de devolver JSON. Se corrige entrando a "Implementar" >
  "Administrar las implementaciones" > lápiz de editar > cambiar "Usuarios con acceso" a
  "Cualquiera" > botón "Implementar" (actualiza la misma implementación, no crea una URL nueva).
  Verificar siempre con una petición anónima real (sin sesión de Google) antes de dar el despliegue
  por bueno — un `fetch` desde el propio navegador logueado puede parecer que funciona aunque el
  acceso público esté mal configurado.
- Diseño: cada fila de EFFI/Dropi se guarda como un JSON individual en su propia fila de hoja
  (pestañas `EFFI_rows` / `Dropi_rows`) — no como un solo bloque JSON gigante en una celda — para
  que no haya problema de límite de caracteres por celda aunque se acumulen muchos meses. Una
  pestaña `Meta` guarda las columnas detectadas (fecha/cantidad/vendedor) y contadores por sistema.
- `doGet()`: cualquiera puede leer el estado actual (EFFI + Dropi acumulados) sin necesitar la
  clave. `doPost()`: solo escribe si el `pin` recibido en el body coincide con `ADMIN_PIN`; dedupea
  del lado del servidor comparando `JSON.stringify(fila)` contra lo ya guardado.
- Lado de `reporte-ventas.html`: constante `SHEETS_BACKEND_URL` (junto a `ADMIN_PIN`) con la URL
  real del Web App (termina en `/exec`). `rowHash(row)` centraliza el hash de fila (`JSON.stringify`)
  usado tanto en `loadRawStore()`/`handleUpload()` como en la sincronización, para que los tres
  usen exactamente el mismo criterio de "duplicado exacto".
  - `fetchRemoteStore()`: `GET` al backend; nunca lanza, devuelve `null` en cualquier error
    (red caída, CORS, JSON inválido) — la página sigue funcionando con `localStorage` si falla.
  - `mergeRemoteIntoStore(remoteData)`: fusiona las filas remotas dentro de `store.A`/`store.B` vía
    `_seenRowHashes` (sin duplicar); copia metadatos de columnas del remoto solo si el store local
    todavía no los tiene (no pisa la columna activa de la sesión); `removed`/`fileCount` se
    **sobrescriben** con el valor remoto cuando el backend tenga datos para ese sistema ("el
    remoto manda", decisión explícita del cliente — no se suman ambos).
  - `syncFromBackendOnLoad()`: orquesta fetch + merge + `recompute()` al abrir la página (llamada
    al final del script, después de `if(loadRawStore()) recompute();`, sin `await` — no bloquea
    el pintado inicial desde caché local).
  - `syncRawRowsToBackend(slotKey, newlyAddedRows, removedDelta)`: manda el `POST` con
    `Content-Type: text/plain;charset=utf-8` (no `application/json`, evita el preflight CORS que
    Apps Script no maneja bien) justo después de `saveRawStore()` y antes de `celebrateMascot()`/
    `recompute()` dentro de `handleUpload()`, solo si `adminUnlocked`. Nunca lanza.
- Verificado en vivo (no solo por lectura de código): `GET` anónimo devuelve las filas reales tras
  subir un excel como admin; un "visitante" (pestaña sin PIN ingresado, `localStorage` vacío) ve el
  reporte completo poblarse solo al recargar, vía `syncFromBackendOnLoad`.

## Pendientes conocidos (no implementar salvo pedido explícito)

- Retomar el valor en dinero (EFFI: `Observación concepto` × `Cantidad`; Dropi: `Total de la orden` con deduplicación por `ID`, ya soportado como interruptor vía `isMoneyColumn()` pero no activo por defecto).
- El reparto de fin de semana/festivo solo mira festivos que empiezan el lunes inmediatamente después del domingo; no cubre un festivo pegado el viernes anterior al fin de semana (ej. un "puente" que empezara en viernes) — no ha surgido el caso, se revisa si se pide.
- Revisar archivos con varias hojas o encabezados atípicos.
