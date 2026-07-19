# Bitácora Quin — registro de la construcción

> Resumen compacto de lo hecho, lo decidido y lo que falta. Se lee junto con `jornada-quin-cowork.md` (la fuente de verdad). Última actualización: 18-jul-2026.

---

## Estado actual

**Un solo archivo funcionando: `quin-admin.html`.** Se abre con doble clic. Todo lo construido es del lado **administrador**.

Tiene tres pestañas:

1. **Cargar y validar** — sube los dos Excel, elige qué cuenta, marca días no laborables, muestra la tabla día por día (real y repartida), congela jornadas.
2. **Tablero del mes** — indicadores del resumen, dos gráficas con línea de meta, rankings.
3. **Calendario** — calendario tipo Excel con selección por rango para comparativos internos.
4. **Comparativo** — mes a mes con gráfica de evolución y variaciones.

Archivos eliminados por quedar contenidos en él: `motor-quin.html`, `tablero-quin.html`, y el `CLAUDE.md` del intento anterior.

Archivos del intento viejo que **no se tocan**: `reporte-ventas.html`, `prompt_reporte_ventas.md`, `vercel.json`, `google-apps-script-backend.gs.txt`, `install.cmd`, los PDFs de junio.

---

## Pasos completados

| Paso | Qué hace | Verificado con |
|---|---|---|
| **1. Motor de reglas** | Lee los dos Excel, jornada 8am / sábado 7am en Dropi, fecha calendario en Effi, suma prendas, aplica exclusiones, tabla por día + detalle fila por fila | Muestra de julio: jue 0/1/1 · vie 89/11/100 · sáb 9/8/17. Descarta 4 canceladas y 1 de Miguel. Los 6 ejemplos de jornada de la sección 4 dan exacto. |
| **2. Fines de semana y festivos** | Festivos de Colombia calculados (no tecleados), bloques de días no laborables, reparto entero con sobrante al último día, vista real vs repartida | Los 3 ejemplos de reparto de la sección 5.3 exactos. Festivos 2025 y 2026 contra la lista oficial. Probado que nunca se pierde ni se inventa una prenda (totales 0 a 199, bloques de 2, 3 y 4). |
| **3. Rankings** | Ranking de vendedores de Effi y ranking de tiendas de Dropi, separados | Effi suma 98, Dropi 20 por tienda. Ningún ranking se contamina con el otro. |
| **4. Congelado** | Cifra oficial sellada al cerrar, comparativo de re-subidas, historial con reabrir, respaldo descargable, guardado en el navegador | Cerré el 10-jul en 100, resubí con 97: el oficial siguió en 100 con diferencia −3. Sobrevive a cerrar y reabrir el navegador. |
| **6. Calendario tipo Excel** | Dos meses a la vez con el número de prendas en cada casilla, navegación entre meses, selección arrastrando (cruza de un mes a otro), toque suelto para agregar o quitar un día, panel con Suma / Promedio / # días en Total, Propias y Dropi. Los días **cargados del Excel pero sin cerrar salen en gris**: se ven pero no suman. Línea de diagnóstico arriba con cuántas jornadas hay y atajos por mes | Probado con jornadas de 28-jul a 5-ago: rango 30-jul→3-ago da 440 total, 340 propias, 100 Dropi, 5 días (promedios 88 / 68 / 20). Arrastre inverso da el mismo rango. Quitar el 1-ago baja a 380/290/90 en 4 días. Días sin jornada cerrada se marcan y no suman. |
| **7. Bosquejo sin cerrar** | Casilla *Incluir días sin cerrar* en el tablero (encendida por defecto): los días cargados del Excel entran a KPIs, gráficas y rankings, con aviso de bosquejo, barras en tono claro y etiqueta «sin cerrar» en el tooltip. Al desmarcarla queda solo lo oficial | Con 13 y 14-jul cerrados y 15 y 16-jul cargados: bosquejo da 440 en 4 días (2 cerradas / 2 sin cerrar) y las barras de los dos últimos salen claras; sin bosquejo, 240 en 2 días. Con nada cerrado el tablero ya no queda en blanco: muestra el mes cargado. |
| **8. Comparativo entre meses** | Pestaña 4: tabla mes a mes (días, total, variación vs mes anterior en prendas y %, propias, Dropi, % propias, promedio/día, mejor y peor día), gráfica de evolución con barras apiladas y línea de promedio por día, top vendedor y top tienda por mes, y tablas de vendedores y tiendas mes a mes con su variación. Casillas para incluir bosquejo y para comparar el mismo número de días | Con mayo (2 días, 220), junio (3, 600) y julio (2 cerrados + 1 bosquejo, 350): variaciones +380/+173% y −250/−42% correctas; sin bosquejo julio baja a 230 en 2 días; con mismo número de días junio queda en 400 y las tres columnas comparan 2 días. |
| **13. Compactado general** | Se apretó toda la interfaz sin quitar nada: menos relleno en cajas, tablas, listas y KPIs, tipografía base 14 px, pestañas y botones más bajos, gráficas de 300 a 270 px de alto. Cabe bastante más en pantalla | Se volvieron a correr las cuatro pruebas (layout, jornadas, comparativo, calendario) después del cambio: mismos números y mismos comportamientos. |
| **12. Aprovechar el ancho** | En pantalla de computador «Qué cuenta y qué no» y «Días no laborables» van lado a lado; los dos rankings también. Junto a los dos cargadores hay una tarjeta *Lo que trae el archivo* (prendas, días, meses, rango de fechas, propias/Dropi y cuántas quedan sin cerrar). La tabla día por día se pliega cuando pasa de 40 días y los bloques cuando pasan de 8 | Con 61 días simulados de mayo y junio: la tarjeta dice «300 prendas · 61 días · 2 meses · vie 01-may → mar 30-jun · 61 sin cerrar», la tabla y los 9 bloques quedan plegados, los rankings salen en dos columnas y el total de la tabla sigue cuadrando en 300. |
| **11. Una sola vista por mes** | La pestaña 1 dejó de tener dos listas (archivo cargado + historial): ahora hay un solo bloque **Jornadas**, un mes plegable por fila, y dentro un calendario del mes donde cada día muestra su cifra y su estado. Tocar un día sin cerrar lo marca; tocar uno cerrado abre su detalle con el botón de reabrir. Atajos por mes, leyenda de colores y barra con *Cerrar seleccionadas (N)*. En pantalla ancha el calendario y el detalle van lado a lado; la página subió de 960 a 1200 px | Con historial de enero, junio y julio y un archivo de 4 días de julio: abre julio, marca y desmarca días, «marcar las 2 sin cerrar» deja 2, cerrar agrega la jornada, tocar un día cerrado abre su detalle y reabrir lo saca del historial. No quedó rastro de las listas viejas. |
| **10. Historial compacto** | Las dos listas de la pestaña 1 se pliegan por mes. La de jornadas del archivo abre en el mes del último día cargado, con atajos por mes. El historial guardado ya no es una tabla de 188 filas: cada mes es un bloque con su mini calendario; al tocar un día se abre su detalle (oficial, última revisión, diferencia, cerrada el) con el botón de reabrir. El mes que abre por defecto es el del último día cargado, o el de hoy, o el último con historial. Los días con revisión llevan una marca dorada. Se quitó el botón *Cerrar todas las jornadas* | Con historial de enero, febrero y julio y un archivo cargado de julio: abre julio en las dos listas, el mini calendario muestra solo los días cerrados, tocar el 5-jul abre su detalle y reabrirlo lo saca del historial; «marcar este mes» deja 3 seleccionadas. |
| **9. Cerrar en lote** | La lista de jornadas del archivo se agrupa por mes y trae atajos *marcar todas / ninguna / solo las sin cerrar*, botón **Cerrar seleccionadas (N)** que se activa solo si hay algo marcado. (El botón *Cerrar todas* se retiró en el paso 10 por petición del dueño.) | Con 8 y 9-ene cerradas y 10, 11-ene y 1-feb pendientes: encabezado «5 días, 3 sin cerrar», separadores enero/febrero, cerrar seleccionada agrega solo el 10-ene, cerrar todas agrega las 2 restantes y el 8-ene queda sin fotos nuevas. |
| **5. Tablero (parcial)** | Total del mes, promedio, propias/Dropi con %, ventas de hoy, jornadas cerradas, mejor y peor jornada con fecha, dos gráficas con meta y número sobre la barra, rankings del mes, selector de mes | Junio real (29 días del PDF): 6.773 prendas, promedio 234, 60% propias, mejor 315 sáb 20-jun, peor 139 sáb 27-jun. Las dos gráficas suman igual. |

---

## Decisiones tomadas (corrigen o precisan el documento maestro)

1. **Effi no usa la jornada horaria.** Ya viene filtrado en la fuente; se agrupa por la fecha de `Fecha creación`. Solo Dropi aplica el corte 8am / sábado 7am. *(§3.3)*

2. **Las exclusiones se identifican solas.** La app lee los archivos y arma la lista de estatus y vendedores encontrados, con casillas para marcar. No se escriben a mano. Un valor nuevo aparece solo. *(§6.3)*

3. **Festivo nuevo:** Virgen del Rosario de Chiquinquirá (9 de julio, corrido al lunes por Ley Emiliani). En 2026 cae el **lunes 13 de julio** → 19 festivos ese año. Lo detectó el dueño; la app lo aplica desde 2026. *(§5.1)*

4. **En Dropi, la tienda ES el vendedor.** No se usa la columna `VENDEDOR` de Dropi. No existe tabla Tienda→Vendedor ni asignación manual. *(§7.2)*

5. **Effi y Dropi nunca se mezclan en rankings**, son personas distintas. Pero **en los totales sí se suman** (Total = Propias + Dropi). *(§7.3)*

6. **Reparto de bloques:** todo el sobrante al último día. Confirmado aunque la hoja manual de junio lo hizo distinto (ver pendientes). *(§5.3)*

7. **Total repartido = suma de propias repartidas + Dropi repartido**, para que las columnas siempre cuadren en la tabla.

8. **Toda la entrada de datos es del administrador.** El vendedor solo consulta. *(§10)*

---

## Pendientes

**Para cerrar el administrador**

- Cierre mensual automático el día 1, con opción de reabrir *(§9)*
- Metas editables con registro histórico sellado por día *(§12)*

**Siguientes pasos del plan**

- Vista del vendedor *(§19 paso 6)*
- Imágenes para WhatsApp con Quino *(§19 paso 7)*
- Estética Quino usando `Jornada Quin.html` como referencia *(§19 paso 8)*
- Login de dos roles + Supabase + PWA *(§19 paso 9)*

**Cosas sueltas anotadas**

- La organización visual del archivo tiene desorden conocido; se acomoda cuando se entre a la estética. Prioridad ahora: que funcione bien.
- El reparto de la hoja manual de junio no coincide con la regla programada: el bloque 6–8 jun se repartió 136/137/137 y la regla da 136/136/138; el bloque 13–15 jun (126/130/130) no responde a ningún reparto parejo. El dueño indicó seguir la regla establecida.
- Las jornadas congeladas antes del Paso 5 no guardaron el detalle por vendedor. El tablero avisa cuántas faltan; se arregla reabriéndolas y cerrándolas de nuevo.
- El guardado vive solo en ese computador y ese navegador. Si se limpian los datos de navegación se pierde. Hay botón **Descargar respaldo** para llevarse un `.json`. Se resuelve de raíz con Supabase.
- Falta validar con un export completo y recién descargado contra la hoja manual *(§17)*. Las muestras son parciales y por eso no cuadran.
- Quedó sin ubicar la columna del «contacto de la tienda» en el Excel de Dropi. Dejó de ser bloqueante al definirse que la tienda es el vendedor.

---

## Cómo trabajamos (funcionó, mantenerlo)

- Un paso pequeño a la vez, sin avanzar sin confirmación del dueño.
- Cada entrega: qué hace y cómo probarlo, en palabras simples.
- **Ejecutar el código antes de entregarlo, no solo revisar que esté bien escrito.** Un error real se coló por revisar sintaxis sin ejecutar: se borró una definición que otra línea seguía usando y eso tumbó todo el cálculo sin que se notara al leer.
- Verificar los números contra los ejemplos del documento y contra los datos reales, y decirlo cuando algo no cuadra.
