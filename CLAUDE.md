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
- **EFFI**: suma `Cantidad`, excluye `Vendedor` = "Cambios", ranking por `Vendedor`.
- **Dropi**: suma `Cantidad`, excluye `Estatus` = "Cancelado", ranking por `Tienda`. No deduplica por `ID` (solo aplicaría si se sumara dinero — ver `isMoneyColumn()` en el código, evaluado en vivo en cada `recompute()`, no solo al subir el archivo).
- Detección de columnas por nombre normalizado (sin tildes/mayúsculas), no por posición.
- **Zona de subida única**: un solo input de archivo (acepta EFFI y Dropi juntos o uno a la vez, `multiple`); no hay una casilla por plataforma. `detectSystemFromHeaders(headers)` decide sola a cuál de las dos (`store.A` o `store.B`) pertenece cada archivo subido, vía `handleUpload(file)`. Si un archivo no se puede identificar por sus columnas, se muestra un aviso de texto (`statusUpload`) sin bloquear lo que ya estuviera cargado.
- **El panel de columnas detectadas (mapping) está oculto siempre, sin excepción** — ni siquiera se muestra si la detección automática falla en algún archivo raro; solo se ve un mensaje de error en texto. Los `<select>` de columnas (`mapA`/`mapB`) se siguen poblando y quedan operativos por dentro (por si se reactiva la UI más adelante), pero nunca reciben la clase `.show`.
- KPIs de EFFI y Dropi siempre separados. **Dos excepciones explícitas** donde sí se cruzan: la meta combinada del día operativo (ver abajo) y la tarjeta KPI "Total combinado (último día)" (`kpiCombinadoTotal`) — muestra **solo el último día operativo con datos** (`dates[dates.length-1]`), NO la suma de todo el rango subido, junto con el badge de si cumplió o no la meta de 200 ese día. Fuera de esas dos, no se combinan.
- La página abre vacía; el ejemplo solo se ve detrás del botón "Ver ejemplo".

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
- Mientras está bloqueada, la tabla NO se rellena en el DOM — los datos solo viven en la variable
  `vistaAcumuladaCache` en memoria, no se inyectan al `<tbody>` hasta que se ingresa la clave
  correcta. Botón "Ocultar de nuevo" vuelve a bloquearla y limpia el `<tbody>`.
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
- Tabla "Cumplimiento de vendedores" (tope 180) y tabla "Detalle por día" (con meta 200). "Detalle por día" tiene además un gráfico (`renderDetalleChart()`) arriba de la tabla: barras EFFI+Dropi apiladas por día con una línea punteada en la meta de 200, para ver de un vistazo qué días la cumplen — comparte el mismo selector de mes que la tabla (`detalleMesSelect`). En modo "Resumen mensual" el gráfico muestra barras por mes sin la línea de meta (la meta es diaria, no mensual).
- **Agrupación por mes con detalle al seleccionar** (aplica a "Cumplimiento de vendedores", "Detalle por día" e "Historial y comparativo mensual"): por defecto cada tabla muestra un renglón acumulado por mes; al elegir un mes en el `<select>` de esa tabla, cambia a ver el detalle día por día de ese mes. Selectores independientes por tabla: `metasMesSelect`, `detalleMesSelect`, `historialMesSelect` — la selección se conserva si el mes sigue existiendo tras recalcular. Pensado para excel grandes que abarcan varios meses.
- **"Historial y comparativo mensual"** (`renderHistorialChart()`) invierte el gráfico según el `<select>` de mes: en "Todos los meses" muestra una barra por mes (resumen); al elegir un mes, el gráfico pasa a mostrar el día a día de ESE mes (barras EFFI+Dropi apiladas) con dos líneas punteadas de referencia — meta de vendedor (180, naranja) y meta combinada (200, roja) — para ver de un vistazo qué días las alcanzan. El botón "Descargar/Cargar historial" se retiró; el historial vive solo en `localStorage` del navegador.
- Botón "Ver ejemplo" con datos ficticios — la página no carga datos de muestra automáticamente al abrir.

## Números de referencia (validar cualquier cambio contra esto)

- **Dropi**: 20 unidades totales (24 filas − 4 canceladas, sin deduplicar). 2026-07-09 (jueves) → 1 unidad, sin cambios. 2026-07-10 (viernes) → 11 unidades, sin cambios. 2026-07-11 es **sábado**, con 8 unidades crudas antes del reparto; como el lunes siguiente (2026-07-13) no es festivo, esas 8 se reparten entre 2 → **2026-07-11 → 4** y **2026-07-12 (domingo) → 4** (día nuevo que antes no existía). Tienda líder total (no cambia con el reparto, es un total general): "Tiko" con 9 unidades.
- **EFFI**: 99 unidades totales, todas en el día operativo 2026-07-10 (viernes, sin reparto). Vendedora líder: "Lucenith Quintero Leon" con 24 unidades (le faltan 156 para el tope de 180 — con esta muestra tan chica nadie llega al tope, es esperable).
- **Combinado 2026-07-10**: EFFI 99 + Dropi 11 = 110 (faltan 90 para la meta de 200). Sin cambios por el reparto (viernes no es fin de semana).
- **KPI "Total combinado (último día)"** con esta muestra: el último día operativo con datos es 2026-07-12 (domingo, generado por el reparto), EFFI 0 + Dropi 4 = 4 u. (faltan 196 para la meta de 200) — no confundir con el combinado de 2026-07-10 (110 u.), que es un día distinto y no el último.
- **Bordes de turno**: sábado 06:59am → día operativo del viernes anterior; sábado 07:01am → entra en la ventana de fin de semana (se reparte); lunes antes de las 8am → cuenta como domingo (parte de la ventana); lunes 8:01am → día propio normal, fuera de la ventana (salvo que el lunes sea festivo).
- **Festivos de Colombia 2026 calculados** (para probar `isFestivoColombia()`): 1 ene, 12 ene (Reyes movido), 23 mar (San José movido), 2 abr (Jueves Santo), 3 abr (Viernes Santo), 1 may, 18 may (Ascensión), 8 jun (Corpus Christi), 15 jun (Sagrado Corazón), 29 jun (San Pedro y San Pablo, cae lunes), 20 jul, 7 ago, 17 ago (Asunción movida), 12 oct (Día de la Raza, cae lunes), 2 nov (Todos los Santos movido), 16 nov (Cartagena movido), 8 dic, 25 dic — 18 festivos en total.

## Pendientes conocidos (no implementar salvo pedido explícito)

- Retomar el valor en dinero (EFFI: `Observación concepto` × `Cantidad`; Dropi: `Total de la orden` con deduplicación por `ID`, ya soportado como interruptor vía `isMoneyColumn()` pero no activo por defecto).
- El reparto de fin de semana/festivo solo mira festivos que empiezan el lunes inmediatamente después del domingo; no cubre un festivo pegado el viernes anterior al fin de semana (ej. un "puente" que empezara en viernes) — no ha surgido el caso, se revisa si se pide.
- Revisar archivos con varias hojas o encabezados atípicos.
