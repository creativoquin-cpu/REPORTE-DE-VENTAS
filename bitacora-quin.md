# Bitácora Quin — registro de la construcción

> Resumen compacto de lo hecho, lo decidido y lo que falta. Se lee junto con `jornada-quin-cowork.md` (la fuente de verdad). Última actualización: 18-jul-2026 (pasos 14 a 17: metas, cierre mensual, vista del vendedor e imágenes para WhatsApp).

---

## Estado actual

**Un solo archivo funcionando: `quin-admin.html`.** Se abre con doble clic. Cuatro pestañas son del **administrador** y la quinta es la **vista del vendedor** (por ahora vive aquí como vista previa; se separará con el login del paso 9).

Tiene cinco pestañas:

1. **Cargar y validar** — sube los dos Excel, elige qué cuenta, marca días no laborables, fija las metas del equipo, cierra y reabre los meses, muestra la tabla día por día (real y repartida), congela jornadas.
2. **Tablero del mes** — indicadores del resumen, dos gráficas con línea de meta, rankings y el botón de imagen para WhatsApp.
3. **Calendario** — calendario tipo Excel con selección por rango para comparativos internos.
4. **Comparativo** — mes a mes con gráfica de evolución y variaciones.
5. **Vista del vendedor** — lo que ve un vendedor: cómo va el equipo y el ranking con solo puesto y nombre, bloqueado al mes en curso.

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
| **17. Imagen para WhatsApp** (§13, §19 paso 7) | Un botón en el tablero descarga un PNG vertical 1080×1920 con el informe **del día**: el total del día en grande (con «meta cumplida» o cuánto faltó), tres cuadros —**Propias (Effi)**, **Dropi** y **promedio del mes por día**— y debajo el mes completo día por día, con la cantidad encima de cada barra, la fecha debajo, el día reportado resaltado y la **línea de meta rotulada con su valor**. Lleva a Quino incrustado en el archivo. Nunca lleva VS ni nombres de personas. El día es **el último cargado** y el mes es el que se está registrando, sin importar qué mes tenga elegido el tablero | 57 pruebas automáticas con un lienzo falso que anota cada trazo. Con julio (200/200/150/71/24): el día reportado es el 19-jul con 48 (40 propias + 8 Dropi, que cuadran con el total), promedio del mes 129, «Faltaron 152 para la meta», el mes suma 645 y las barras 200/200/150/47/48 vuelven a sumar 645. Un día de 210 con meta 200 dice «Meta cumplida». Con la meta cambiada a mitad de mes, la línea roja cambia de altura y se rotula en el día correcto. Con 31 días nada se sale del lienzo, salen las 31 cantidades y las 31 fechas, y las 31 barras no se traslapan. Mirando junio en el tablero, la imagen sigue siendo de julio. |
| **16. Vista del vendedor** (§19 paso 6) | Pestaña 5, bloqueada al **mes en curso** y **sin filtro por vendedor**: mientras no exista el login (paso 9) la app no sabe quién está mirando, así que no muestra datos personales de nadie. Quedan dos bloques: cómo va el **equipo** en propias (total, promedio, días en meta, mejor día y gráfica repartida con línea de meta) y el **ranking del mes**, solo con puesto y nombre. Sin columna de prendas y sin gráfica de comparación entre vendedores. No ve Dropi, ni tiendas, ni el total Effi+Dropi, ni las ventas reales sin repartir, ni comparativos, ni calendario, ni un solo botón | 40 pruebas automáticas sobre el archivo real. Con Ana 320, Beto 210 y Caro 105 en julio: el equipo da 635 propias en 5 días, promedio 127, 2 de 5 días en meta y mejor día 200. El bloque sáb+dom (71 y 24) sale repartido 47/48 sin cambiar el total. **Ninguna de las tres cifras individuales aparece en la vista**, comprobado buscándolas en todo el texto. Con la meta de propias cambiada a 100 el 15-jul, los días en meta suben a 3. Con solo bosquejo funciona y avisa; en un mes sin ventas lo dice sin romperse. Se reverificaron las cuatro pestañas del admin: mismos números. |
| **15. Cierre mensual automático** | Panel *Cierre mensual* en la pestaña 1. Al abrir la app, todo mes que ya pasó y todavía no se había cerrado se **cierra solo** y su resumen queda **sellado** (total, días, propias/Dropi, promedio, mejor y peor día, rankings y días en meta). El sello no cambia aunque después entre un reporte tarde: la app avisa la diferencia («hoy hay +100 prendas frente al sello») en el panel, en el tablero y en el comparativo. Botón **Reabrir** para incluir lo que llegó tarde y **Cerrar ahora** para volver a sellar; el mes en curso también se puede cerrar a mano. Un mes reabierto **no** se vuelve a cerrar solo. Todo queda en una traza (qué pasó, con qué total, cuándo y quién). Solo entran jornadas cerradas: el bosquejo nunca toca el sello | 50 pruebas automáticas corriendo el archivo real con la fecha del computador simulada. Con junio (3 días, 600) y julio (2 días, 350) al 18-jul: junio se cierra solo en 600, julio no. Entra un día tarde de junio (+100): el sello sigue en 600 y los tres avisos aparecen. Reabrir y volver a cerrar lo deja en 700 con 4 días y la traza en orden *automático → reabierto → a mano*. Al saltar a agosto, julio se cierra solo pero junio reabierto se queda abierto. Cancelar el aviso no cierra nada. Se reverificaron metas, tablero, calendario, comparativo y jornadas: mismos números. |
| **14. Metas editables con historial sellado** | Panel *Metas del equipo* en la pestaña 1: muestra la meta vigente (total y propias), permite cambiarla indicando **desde qué día aplica**, y guarda cada cambio en un historial que no se borra (desde, total, propias, qué cambió, cuándo y quién). Los días anteriores conservan la meta que tenían. Se pueden dejar metas **programadas** a futuro (y quitarlas mientras no entren en vigencia); si se guardan dos para la misma fecha, manda la registrada después y la anterior queda visible como *reemplazada*. El tablero usa la meta de cada día: la línea roja de las dos gráficas es **escalonada**, el tooltip dice «meta 200 (faltan 50)», el eje sube hasta la meta más alta y hay dos KPIs nuevos, *Días en meta total* y *Días en meta propias*. Valida que la meta de propias no supere la total, que el total sea mayor que cero y que el cambio realmente cambie algo | 49 pruebas automáticas corriendo el archivo real en un navegador simulado (no solo leyendo el código). Con cambio el 16-jul de 200/160 a 240/150 y jornadas de 190/210/200/240/250: *Días en meta total* da 4 de 5 y *propias* 2 de 5, la leyenda dice «Meta 200–240», el tooltip del 14-jul compara contra 200 y el del 17-jul contra 240, y el total del mes sigue en 1.090. Con meta constante se comporta igual que antes. Se reverificó que jornadas, calendario y comparativo siguen dando los mismos números. |
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

9. **El sello mensual cuenta solo jornadas cerradas.** El bosquejo (días cargados del Excel sin cerrar) nunca entra al resumen sellado del mes. Confirmado por el dueño. *(§9)*

10. **El comparativo sigue mostrando las cifras vivas**, con el sello anotado al lado y un aviso cuando difieren, en vez de reemplazar el número por el sellado. Confirmado por el dueño. *(§9)*

11. **El vendedor no ve cifras de nadie**, solo puesto y nombre. Se probó una gráfica VS sin números y el dueño también la descartó: la pestaña quedó sin ninguna comparación entre personas. Corrige el §10, que contemplaba el VS top 10.

12. **La vista del vendedor no tiene filtro por vendedor.** Se probó con un selector *Ver como* y el dueño lo descartó: mientras no exista el login (paso 9) la app no sabe quién mira, así que la pestaña quedó solo con cifras del equipo. Lo personal se retoma con el login.

13. **La imagen de WhatsApp lleva las cifras repartidas** (como las ve el vendedor) e **incluye los días cargados aunque no estén cerrados**, con un aviso al pie cuando los hay. Confirmado por el dueño.

14. **La imagen siempre es del último día cargado y del mes que se está registrando**, no del mes elegido en el tablero, para que no se mande por error la de un mes viejo. Pedido por el dueño al ver la primera versión.

15. **Una sola imagen, encabezada por el día.** Se empezó con dos (Total y Propias, ambas mensuales) y el dueño las cambió por una sola con el total del día en grande y los cuadros de propias, Dropi y promedio. Corrige el §13, que pedía dos formatos mensuales.

16. **La vista del vendedor queda bloqueada al mes en curso** y vive por ahora como pestaña 5 del mismo archivo. Se separará cuando exista el login.

---

## Pendientes

**Para cerrar el administrador**

Ninguno: el lado del administrador quedó completo.

**Siguientes pasos del plan**

- Estética Quino usando `Jornada Quin.html` como referencia *(§19 paso 8)* — **va de último y se hace en Antigravity**, no aquí, para que no se altere lo que ya funciona.
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
