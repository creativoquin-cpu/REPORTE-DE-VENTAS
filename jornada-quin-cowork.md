# Jornada Quin — Documento maestro (fuente de verdad)

> **Estado del proyecto:** ver `bitacora-quin.md` para saber qué está construido, qué se decidió y qué falta. La app va en **`quin-admin.html`** (un solo archivo, dos pestañas, lado administrador). Pasos 1 a 4 completos y el 5 parcial.

> **Este documento manda.** Si el código, un archivo viejo, o cualquier suposición contradice algo escrito aquí, gana lo que dice aquí. Léelo COMPLETO antes de escribir una sola línea de código. No improvises reglas: si algo no está definido aquí, pregúntale al dueño; no lo inventes.

---

## 0. Antes de empezar — limpieza de la carpeta

En la carpeta del proyecto puede haber restos de un **intento anterior que fracasó**. Instrucciones:

- **IGNORA por completo cualquier `CLAUDE.md` viejo** que describa otro proyecto o que obligue a usar "agentes" o estructuras raras. No existen esos agentes. Este documento (`jornada-quin-cowork.md`) es el único válido. Si hay un `CLAUDE.md` viejo, **archívalo o bórralo** (pregúntale al dueño cuál prefiere) y no sigas ninguna de sus instrucciones.
- **NO toques `reporte-ventas.html` viejo** ni ningún otro archivo del intento anterior. Déjalos quietos; no son parte de esto.
- Este es un **arranque desde cero**. No reutilices código viejo salvo que el dueño lo pida explícitamente.

**Archivos que SÍ son de este proyecto (los adjunta el dueño):**

- `jornada-quin-cowork.md` — este documento.
- `ordenes_productos_*.xlsx` — export de ejemplo de **Dropi**.
- `Reporte_de_conceptos_de_remisiones_*.xlsx` — export de ejemplo de **Effi**.
- `Jornada Quin.html` — referencia visual del diseño (estética Quino).
- PNG de la mascota **Quino**.

---

## 1. Qué es y por qué empezamos de cero

**Qué es:** una app web + PWA instalable para la **Agencia Quin** que consolida las ventas diarias de ropa de dos fuentes (**Dropi** y **Effi**), aplicando una "jornada" de corte, y muestra informes, rankings, metas e imágenes para compartir en WhatsApp. Dos roles: **Administrador** y **Vendedor**.

- **Unidad:** se cuentan **prendas (unidades enteras)**. **El dinero NUNCA se usa.**
- **Lanzamiento objetivo:** 1 de agosto.

**El intento anterior fracasó** porque *se volvió demasiado complejo, el dueño (que NO es programador) dejó de entenderlo, y nunca se terminó* (llegó a tener algo de lógica, pero con errores). Para no repetirlo, hay **reglas de trabajo obligatorias** en la sección 18. La más importante: **un paso pequeño a la vez, validado y explicado en simple, sin avanzar hasta que el dueño confirme.**

---

## 2. Glosario (definiciones exactas)

- **Prenda:** una unidad vendida. Es un número **entero**. Nunca hay medias prendas (1,5 no existe: es 1 o 2).
- **Jornada:** el "día de ventas". No es el día calendario: va de las **8:00am a las 8:00am** del día siguiente (con la excepción del sábado, ver sección 4). Una jornada se identifica por su **fecha de inicio** (ej. "jornada del viernes 10" = ventas contadas desde el viernes 8am).
- **Bloque:** conjunto de jornadas no laborables consecutivas cuyas ventas se acumulan y se reportan juntas el siguiente día laborable (típico: sábado + domingo). Ver sección 5.
- **Cifra oficial (congelada):** el número de prendas de una jornada tal como estaba **cuando se subió el reporte por primera vez**. No cambia. Es la que cuenta para histórico, promedios y rankings.
- **Cifra actual (viva):** si se vuelve a subir un reporte de una fecha ya cerrada, es el número nuevo. NO reemplaza a la oficial; solo alimenta un comparativo.
- **Propias:** ventas de **Effi** (la operación propia de la agencia).
- **Dropi:** ventas de la plataforma **Dropi**.
- **Total:** Propias + Dropi.
- **Meta grupal:** objetivo de prendas del equipo completo (no de un vendedor individual). Hay dos: 200 (Total) y 160 (Propias).

---

## 3. Fuentes de datos y mapeo de columnas (verificado con archivos reales)

### 3.1 Effi — "Reporte de conceptos de remisiones de venta"

Una fila = una prenda. Columnas y uso:

| Columna del Excel | Uso en la app |
|---|---|
| `Cantidad` | **Sumar esta columna** (no contar filas). Es la cantidad de prendas. |
| `Fecha creación` | Fecha+hora. Se agrupa por **fecha calendario de creación** (Effi NO usa la jornada de 8am, ver 3.3). |
| `Vendedor` | Nombre del vendedor. Para ranking y exclusiones. |
| `ID. vendedor` | Id numérico del vendedor (respaldo de identidad). |
| `ID remisión` | Referencia (para deduplicar si hiciera falta). |
| `Descripción artículo`, `Observación concepto` | Informativos. |

Vendedores vistos en la muestra (para pre-cargar la lista de exclusión): Lucenith Quintero Leon, FUNNELISTH LANDING, Isaac Salazar, César Alfredo Aponte Artigas, Juan manuel sanchez leon, Nini Johana quintero leon, Zaida Vanesa Meneses Chinchilla, JOSUE QUINTERO LEON, Santander Delgado, DROPI - ROCKETFY, y `miguel angel angarita ariza`.

### 3.2 Dropi — "ordenes productos" (54 columnas)

Una fila = un producto/orden. Columnas relevantes:

| Columna del Excel | Uso en la app |
|---|---|
| `CANTIDAD` | **Sumar esta columna.** Cantidad de prendas. |
| `FECHA` (ej. `11-07-2026`) + `HORA` (ej. `23:18`) | **Combinar en fecha+hora** y aplicar la jornada 8am / sábado 7am (sección 4). |
| `ESTATUS` | Filtrar qué cuenta (sección 6). |
| `TIENDA` | Identificador de la tienda (nombre o número). Para ranking de tiendas y para deducir el vendedor. |
| `VENDEDOR` | **Viene casi siempre vacío → NO usar directo.** El vendedor se deduce de la tienda (sección 7). |
| `NOVEDAD` | Para detectar devoluciones/novedades (sección 6). |
| `TELÉFONO` | Es del **cliente**, NO de la tienda. **No usar como identificador de tienda.** |
| `TIPO DE TIENDA` | Informativo (SHOPIFY, WOOCOMMERCE…). |

Estatus vistos en la muestra: `DESPACHADA`, `PENDIENTE`, `EN PROCESAMIENTO`, `EN REPARTO`, `CANCELADO`. La lista completa se confirma con un export de mes completo; por eso el filtro de estatus debe ser **editable** (sección 6).

Tiendas vistas: Tiko, Tienda Labarca, Tienda Colombia, DoviCenter, Azaroma, un número suelto (`9428708`) y celdas vacías.

### 3.3 Regla de fechado por fuente (importante)

- **Dropi:** se agrupa por **jornada** (8am / sábado 7am), usando `FECHA`+`HORA`.
- **Effi:** se agrupa por la **fecha calendario** de `Fecha creación`. Effi ya viene filtrado en la fuente y NO depende de la hora.
- El "día" del tablero alinea la jornada de Dropi con la fecha de Effi (misma fecha etiqueta).

---

## 4. Algoritmo de la jornada (con ejemplos)

**Definición:** las jornadas cortan a las **8:00am**, salvo la mañana del **sábado que corta a las 7:00am**. Una orden pertenece a la jornada etiquetada por su fecha de inicio.

**Algoritmo para una orden con fecha+hora `dt` (solo aplica a Dropi):**

```
horaCorte = (dt es sábado) ? 7 : 8
si dt.hora < horaCorte:
    jornada = dt.fecha - 1 día
si no:
    jornada = dt.fecha
```

**Ejemplos (verificados):**

| Fecha+hora de la orden | Día semana | Jornada asignada | Por qué |
|---|---|---|---|
| Vie 10-jul 23:18 | viernes | **Vie 10-jul** | 23 ≥ 8 |
| Vie 10-jul 07:30 | viernes | **Jue 09-jul** | 7 < 8 → día anterior |
| Sáb 11-jul 06:30 | sábado | **Vie 10-jul** | 6 < 7 (corte sábado) → día anterior |
| Sáb 11-jul 09:00 | sábado | **Sáb 11-jul** | 9 ≥ 7 |
| Dom 12-jul 06:00 | domingo | **Sáb 11-jul** | 6 < 8 → día anterior |
| Lun 13-jul 06:00 | lunes | **Dom 12-jul** | 6 < 8 → día anterior |

Efecto práctico: las ventas del **viernes** se cierran el **sábado a las 7am** ("las ventas del viernes salen el sábado").

---

## 5. Fines de semana, días no laborables y reparto (con ejemplos)

### 5.1 Bloques

Después del cierre del viernes (sábado 7am), **no se vuelve a reportar hasta el siguiente día laborable** (normalmente el lunes; el martes si el lunes es festivo o no laborable). Las jornadas de **sábado y domingo** (y **lunes** si es no laborable) se juntan en un **bloque**.

- Bloque normal = {Sábado, Domingo} = **2 días** → se reporta el lunes.
- Bloque con lunes no laborable = {Sábado, Domingo, Lunes} = **3 días** → se reporta el martes.
- Regla general: un bloque es una **corrida de jornadas no laborables consecutivas**; sus ventas se reportan el siguiente día laborable. Sábado y domingo son no laborables por defecto; cualquier día marcado como festivo o "acuerdo interno" también entra al bloque.

**Festivos / no laborables:** la app usa el **calendario oficial de festivos de Colombia** (automático) **más** un **calendario manual editable** por el admin para días de acuerdo interno.

Los festivos **se calculan, no se teclean**: fechas fijas + Semana Santa (algoritmo de Pascua) + los que la **Ley Emiliani** corre al lunes siguiente. Verificado contra la lista oficial de 2025 y 2026.

> **Festivo nuevo (importante):** desde **2026** rige **Nuestra Señora del Rosario de Chiquinquirá** — se celebra el **9 de julio** y por Ley Emiliani se traslada al **lunes siguiente**. En 2026 cae el **lunes 13 de julio**, y por eso el año tiene **19 festivos** y no 18. Consecuencia práctica: el bloque de ese fin de semana es de **3 días** (sáb 11 + dom 12 + lun 13) y se reporta el martes 14. La app solo lo aplica de 2026 en adelante; 2025 conserva sus 17 festivos.

### 5.2 Dos visualizaciones del bloque (clave)

Como Dropi trae hora exacta y Effi trae fecha de creación, la app puede saber **cuánto cayó realmente cada día** del bloque. Con eso:

- **Vista REAL (admin):** cada jornada del bloque muestra su cantidad **real** (calculada por la hora de cada orden). Sin repartir.
- **Vista REPARTIDA (vendedor + meta grupal + segunda gráfica del admin):** se toma el **total del bloque** y se **reparte parejo en enteros** entre los días del bloque, con el **sobrante al último día**.

El **administrador ve las dos gráficas lado a lado** (real vs repartida) para comparar. El **vendedor solo ve la repartida** (de lo suyo).

### 5.3 Algoritmo de reparto (enteros, sobrante al último día)

```
dias = número de días del bloque (2 o 3)
totalBloque = suma de prendas del bloque (de la serie que se muestra:
              del vendedor si es su vista; del grupo si es vista de grupo)
base = piso(totalBloque / dias)   // entero
sobrante = totalBloque - base*dias
resultado = [base, base, ...]      // un valor por día
resultado[último día] += sobrante  // TODO el sobrante al último día
```

**Ejemplos:**

- Bloque 2 días, total 25 → base 12, sobrante 1 → **[12, 13]** (sábado 12, domingo 13).
- Bloque 2 días, total 7 → base 3, sobrante 1 → **[3, 4]**.
- Bloque 3 días, total 38 → base 12, sobrante 2 → **[12, 12, 14]**.

> El reparto se hace **sobre prendas (enteros)**. Se aplica a la serie que se está mostrando: para la gráfica del vendedor, sobre las prendas de ese vendedor; para la gráfica de grupo, sobre el total del grupo. *(Pendiente menor de confirmar con el dueño: cuando el sobrante es mayor que 1, ¿todo al último día — como está aquí — o repartir el sobrante de a uno desde el último hacia atrás? Por defecto: todo al último día.)*

---

## 6. Qué cuenta como venta (exclusiones)

### 6.1 Dropi

Cuentan todas las órdenes **MENOS**:

- `CANCELADO`
- **Devoluciones**
- **Novedades** (revisar cómo se marcan: puede ser un valor de `ESTATUS` o la columna `NOVEDAD`; confirmar con export completo).

La **lista de estatus que cuentan debe ser editable** por el admin (para cuando aparezcan estatus nuevos). Por defecto: cancelado/devolución/novedad **apagados**; el resto **encendidos**.

### 6.2 Effi

Cuenta **todo** salvo lo que esté en un **listado de exclusión editable**. Por defecto excluidos:

- Cualquier vendedor cuyo nombre **sea o contenga "cambio"** (comparación insensible a mayúsculas/tildes/espacios).
- `miguel angel angarita ariza`.

**SÍ cuentan** (no excluir): `FUNNELISTH LANDING` y `DROPI - ROCKETFY` (son vendedores válidos).

### 6.3 Cómo se editan las exclusiones (identificación automática)

Las listas de exclusión **no se escriben a mano**. La app **lee los archivos cargados y arma sola la lista de todo lo que encontró**: cada `ESTATUS` distinto de Dropi y cada `Vendedor` distinto de Effi, **con su cantidad de prendas al lado**. Cada uno se muestra como una casilla:

- **Marcado** = cuenta como venta. **Desmarcado** = se descarta (se muestra tachado en rojo).
- Al cambiar cualquier casilla, **los totales se recalculan al instante**.
- Vienen **desmarcados de fábrica** los patrones de 6.1 y 6.2 (cancelado, devolución, novedad, anulada; "cambio" y Miguel). Todo lo demás arranca **marcado**.
- Como la lista sale del archivo, **cualquier estatus o vendedor nuevo aparece solo** — nunca hay que tocar el código para dar de alta uno.
- Aparte, una casilla independiente controla si se descartan las filas con algo escrito en la columna `NOVEDAD`.

Esto reemplaza cualquier idea de "lista escrita a mano" y aplica igual a Dropi y a Effi.

---

## 7. Tienda y vendedor en Dropi

### 7.1 Identificación de la tienda

Orden de prioridad para el identificador de tienda (columna `TIENDA`):

```
si TIENDA tiene nombre no vacío → usar el nombre
si no, si hay número → usar el número
si no → "Tienda no identificada"
```

### 7.2 En Dropi, la tienda ES el vendedor

> **REGLA DEL DUEÑO.** En Dropi **tienda y vendedor son lo mismo**. No hay dos conceptos: la tienda identificada según 7.1 *es* el vendedor de esa venta.

Consecuencias:

- **No se usa la columna `VENDEDOR`** de Dropi (viene casi siempre vacía y no aporta).
- **No existe** tabla "Tienda → Vendedor" ni asignación manual de ningún tipo.
- Hay **un solo ranking del lado Dropi**, el de tiendas, y ese ranking *es* el de vendedores de Dropi.

### 7.3 Ranking de vendedores — **Effi y Dropi NUNCA se mezclan**

> **REGLA CORREGIDA POR EL DUEÑO (manda sobre lo anterior).** Los vendedores de **Effi** y los de **Dropi** son **personas distintas**. No se suman, no se cruzan, no comparten tabla. Aunque dos nombres se parezcan, se tratan como personas diferentes.

Por eso hay **dos rankings separados**:

1. **Vendedores de Effi (propias)** — de la columna `Vendedor` de Effi.
2. **Tiendas de Dropi** — por la regla de identificación de 7.1. Como en Dropi la tienda es el vendedor (7.2), este ranking cumple las dos funciones.

No existe un ranking combinado "por persona", ni una tabla Tienda → Vendedor.

**Ojo — esto aplica SOLO a los rankings.** En los **totales** las dos fuentes **sí se suman**, como siempre (regla 2: Total = Propias + Dropi). Es decir:

| Para qué | Effi y Dropi |
|---|---|
| Prendas del día / del mes, metas, gráficas, imágenes | **se suman** (Total = Propias + Dropi) |
| Rankings de personas | **separados**, cada fuente con su lista |

---

## 8. Congelado y comparativos de re-subidas

- **Congelado por jornada:** al subir un reporte, cada jornada nueva se **cierra** y su cifra queda **oficial**. Volver a subir un archivo que incluya fechas ya cerradas **NO cambia** la cifra oficial.
- **Comparativo:** cada re-subida de una fecha ya cerrada se guarda como **foto posterior** y genera un comparativo: cifra oficial vs cifra actual, y **cuántas prendas se cayeron** (cancelaciones/anulaciones/devoluciones que entraron después). El oficial nunca cambia solo; **recalcular es una acción manual y deliberada** del admin.
- **Detección automática en re-subidas:** cuando un archivo trae varias fechas, la app **cierra como nuevas** las fechas que no existían y **solo actualiza el comparativo** de las ya cerradas. Al terminar muestra un resumen, ej.: *"Cerré 2 jornadas nuevas y actualicé el comparativo de 3 ya existentes."*
- **Deduplicación:** dentro de un mismo archivo, no contar dos veces la misma orden (usar el `ID` de Dropi / `ID remisión` de Effi cuando exista; si no, una huella por fila).

**Por qué existe esto:** los reportes de Dropi/Effi **cambian con el tiempo** (una re-descarga trae filas distintas), y una orden puede cancelarse días después. El congelado sella "la foto del corte" y el comparativo mide qué tan real fue.

---

## 9. Cierre mensual e histórico

- **Cierre mensual automático** el día 1 del mes siguiente, con opción de **reabrir** si entra un reporte tarde. Al cerrar, las jornadas del mes se sellan en un **resumen mensual** que ya no cambia.
- **Comparativos entre meses:** **solo el administrador**, con una **gráfica de evolución** mes a mes (prendas, propias, Dropi, %, promedios, vendedores, tiendas).

---

## 10. Roles y permisos

| Elemento | Vendedor | Administrador |
|---|---|---|
| **Subir los Excel de Dropi y Effi** | ❌ | ✅ |
| **Congelar / reabrir jornadas** | ❌ | ✅ |
| **Marcar días no laborables** | ❌ | ✅ |
| **Elegir qué estatus y vendedores cuentan** | ❌ | ✅ |
| Sus propias ventas (detalle) | ✅ | ✅ |
| Ventas de otros vendedores (detalle) | ❌ | ✅ |
| Ranking de vendedores (posiciones) | ✅ | ✅ |
| VS vendedores (gráfica top 10, **solo en pantalla**) | ✅ | ✅ |
| Ver si el **grupo** cumplió la meta de propias (160) | ✅ | ✅ |
| Meta individual | ❌ (no existe) | ❌ (no existe) |
| Total Effi + Dropi | ❌ | ✅ |
| Ventas por tienda | ❌ | ✅ |
| Top 1 vendedor / Top 1 tienda | ❌ | ✅ |
| Gráfica de ventas **reales** (sin repartir) | ❌ | ✅ |
| Gráfica **repartida** (como la ve el vendedor) | ✅ (es su vista) | ✅ (para comparar) |
| Resumen del mes | ❌ | ✅ |
| Comparativos entre meses (gráfica) | ❌ | ✅ |
| Herramienta de selección (calendario suma/promedio) | ❌ | ✅ |
| Editar metas / calendario / exclusiones / mapeo tienda→vendedor | ❌ | ✅ |
| Exportar imagen para WhatsApp | ❌ | ✅ |

**Vendedor, resumen:** ve solo (a) sus ventas, (b) el ranking, (c) si el grupo cumplió la meta grupal de 160, y (d) el VS top 10 en pantalla. **No tiene meta individual, no exporta nada.** En su vista, el fin de semana va **repartido** (sección 5).

**Administrador, resumen:** **toda la entrada de datos es suya.** El vendedor solo consulta; nunca sube archivos, ni congela, ni configura nada. Por eso todo lo construido hasta ahora (`motor-quin.html` y `tablero-quin.html`) es **lado administrador**, y cuando exista el login los dos quedarán detrás del rol de admin.

---

## 11. Indicadores del tablero del administrador

(Replican el "Resumen del mes" que el dueño ya lleva en Excel.)

- Reportes registrados (jornadas cerradas)
- Días cubiertos (ej. "17 de 18")
- Total prendas del mes
- Promedio por día
- **Mejor jornada — con su fecha** (ej. "218 · vie 10-jul")
- **Peor jornada — con su fecha** (ej. "158 · lun 20-jul")
- Total propias (Effi) / Total Dropi
- % Propias del total
- Ventas del día actual
- Acumulado del mes

Además del bloque de indicadores: **dos gráficas de días** (real y repartida, sección 5), **ranking por vendedor**, **ranking por tienda**, **top 1 vendedor** y **top 1 tienda**.

---

## 12. Metas

- **Grupales, no individuales.** Dos metas: **200** = Total (Effi+Dropi); **160** = Propias (Effi).
- **Editables** por el admin (ej. subir en diciembre, bajar en temporada baja).
- **Selladas por día con registro histórico:** al cambiar una meta, los **días pasados conservan la suya** y el cambio **aplica de aquí en adelante**. Cada edición **deja traza**: qué meta tenía, a cuánto cambió, **cuándo y quién**.

---

## 13. Imágenes para WhatsApp

- **Solo el administrador** las descarga (para el informe del grupo).
- **Dos formatos de arranque (ampliable a más después):**
  1. **Total (Effi + Dropi)** — con la **línea de meta 200**.
  2. **Propias (Effi)** — con la **línea de meta 160**.
- Cada imagen muestra los **días en ventas** con: línea de meta, **cantidad encima de cada barra**, fechas, la **meta en el título** y la mascota **Quino**.
- Las imágenes **nunca incluyen los VS**. El VS es solo visualización en pantalla (vista de vendedor), no se descarga.
- Formato pensado para móvil (vertical tipo "story").

---

## 14. Herramienta de selección — calendario tipo Excel (solo admin)

Para comparativos internos, un **calendario visual navegable entre meses** donde:

- Cada día muestra en su casilla el **número de prendas** (como una hoja de cálculo).
- Se puede **seleccionar por rango arrastrando** (ej. del 5 al 12), **incluso cruzando de un mes a otro** (ej. 28-jul → 4-ago), y también **tocar días sueltos**.
- Sobre lo seleccionado muestra, actualizándose solo: **Suma, Promedio y # de días**, desglosado en **Total / Propias / Dropi**.

---

## 15. Estética y convenciones de gráficos

- **Marca Quino:** mascota robot blanca (contornos negros, acentos cian). Paleta: **blanco + negro + cian/turquesa (~#14C4C4 / #17C3C3)**. Estilo limpio, moderno, cálido; esquinas redondeadas; tarjetas con sombra suave; tipografía sans-serif redondeada.
- **Mobile-first** (se usa sobre todo desde el celular), responsive a escritorio, con aspecto de app instalable.
- **Convención de barras:** toda gráfica de días muestra la **cantidad de prendas encima de cada barra** y la **línea de meta** marcada (200 total / 160 propias). Aplica a vendedor, a las dos del admin y a las imágenes de WhatsApp.
- Usar `Jornada Quin.html` como referencia de estilo.

---

## 16. Arquitectura

- **PWA instalable** (funciona en el celular como app).
- **Backend en la nube con login** para separar los dos roles (recomendado: **Supabase**, gratis; el dueño crea la cuenta y conecta credenciales). El vendedor entra y ve solo lo suyo; el admin ve todo.
- El "usuario" de un vendedor se mapea a su nombre en los datos (para mostrarle solo sus ventas).

---

## 17. Validación (nota crítica — leer antes de confiar en números)

Los archivos de ejemplo entregados son **muestras parciales** y además **los reportes cambian al re-descargarse**. Por eso las cifras de ejemplo NO cuadran con la hoja manual — **no es un error de reglas.** Validación real:

1. Subir el reporte **completo y recién descargado** de Dropi y de Effi de una jornada.
2. Comparar el resultado del motor contra el conteo del dueño de **ese mismo momento**.
3. La cifra oficial se sella al subir (sección 8); las re-descargas posteriores solo alimentan el comparativo.

*(Dato de referencia: con la muestra parcial, el motor descarta 4 canceladas de Dropi y 1 de Miguel en Effi. Eso solo verifica que el filtro funciona, no valida totales.)*

---

## 18. Reglas de trabajo OBLIGATORIAS (para no repetir el fracaso anterior)

1. **Un paso pequeño a la vez.** No avanzar al siguiente paso sin que el dueño confirme que entendió y que funciona.
2. **Validar antes de avanzar.** Cada pieza se comprueba contra datos reales / la hoja manual.
3. **Explicar en simple.** El dueño NO es programador. Cada entrega incluye: qué hace y cómo probarlo, sin jerga.
4. **Motor antes que diseño.** Primero que los números salgan bien; el diseño bonito, el login y Supabase van al final.
5. **Simplicidad sobre elegancia.** Ante dos caminos, el más simple y entendible.
6. **Este documento manda.** Ante cualquier duda, consultar aquí; no inventar.

---

## 19. Plan de construcción por pasos (con criterio de aceptación)

Construir en este orden. Cada paso solo se da por bueno si cumple su "criterio de aceptación" y el dueño lo confirma.

**Paso 1 — Motor de reglas + validación** (empezar AQUÍ)

- Carga los dos Excel, aplica jornada 8am/sábado 7am (Dropi) y fecha de creación (Effi), cuenta prendas (columna CANTIDAD/Cantidad), aplica exclusiones (Dropi: cancelado/devolución/novedad; Effi: "cambio" y Miguel).
- Muestra una tabla por jornada: **Propias / Dropi / Total**.
- *Criterio:* con un export completo, los números cuadran con la hoja manual del dueño; con la muestra, descarta 4 canceladas (Dropi) y 1 (Miguel, Effi).

**Paso 2 — Fines de semana y festivos**

- Detecta bloques (sáb+dom, +lunes si no laborable), festivos oficiales de Colombia + calendario manual, y calcula las dos vistas: real y repartida (enteros, sobrante al último día).
- *Criterio:* un bloque de ejemplo produce real y repartida correctas; los ejemplos numéricos de la sección 5.3 dan exacto.

**Paso 3 — Rankings y tienda→vendedor**

- Identificación de tienda (nombre→número→"no identificada"), tabla editable tienda→vendedor, ranking por vendedor (Effi+Dropi) y por tienda.
- *Criterio:* el ranking suma bien Effi+Dropi por persona; una tienda sin mapear queda visible para asignarla.

**Paso 4 — Congelado + comparativos + cierre mensual**

- Congelar jornada al subir; comparativo de re-subidas; cierre mensual automático con reabrir.
- *Criterio:* re-subir una fecha cerrada no cambia el oficial y genera comparativo; el día 1 cierra el mes.

**Paso 5 — Tablero del administrador**

- Indicadores (sección 11), dos gráficas (real/repartida) con cantidad sobre las barras, rankings, top 1, metas editables con registro, herramienta de selección tipo calendario.
- *Criterio:* refleja los indicadores del "Resumen del mes" del dueño.

**Paso 6 — Tablero del vendedor**

- Sus ventas + ranking + VS top 10 (solo pantalla) + indicador de meta grupal 160. Sin meta individual, sin exportación. Vista repartida.
- *Criterio:* un vendedor no ve datos de otros ni botones de exportar.

**Paso 7 — Imágenes para WhatsApp**

- Solo admin, dos formatos (Total meta 200 / Propias meta 160), con Quino y cantidad sobre barras. Sin VS.
- *Criterio:* descarga PNG/JPG lista para el grupo.

**Paso 8 — Diseño fino (estética Quino)**

- Aplicar la identidad visual usando el HTML de referencia.

**Paso 9 — Login de dos roles + Supabase + PWA instalable**

- El dueño crea la cuenta de Supabase; se conecta; se empaqueta como PWA.

**Regla de oro:** no pasar de un paso al siguiente sin que el dueño confirme que entendió y que funciona.

---

## 20. Mensaje de arranque (pegar como primer mensaje en Cowork o Antigravity)

> Hola. Vamos a construir desde cero una app llamada **Jornada Quin** (consolida ventas diarias de ropa de dos fuentes, Dropi y Effi, en prendas; jornada 8am→8am; dos roles: administrador y vendedor).
>
> IMPORTANTE — limpieza: en la carpeta puede haber un `CLAUDE.md` viejo de un proyecto anterior que obliga a usar "tres agentes" que NO existen, y un `reporte-ventas.html` viejo. **Ignora esos archivos por completo.** El único documento válido es `jornada-quin-cowork.md`. Si quieres, archiva el `CLAUDE.md` viejo (pregúntame antes de borrar).
>
> Contexto: el intento anterior **nunca se terminó porque se volvió demasiado complejo y dejé de entenderlo** (no soy programador). Esta vez: **pasos pequeños, uno a la vez, validando y explicándome cada paso en simple antes de avanzar.** Si algo se pone complejo, párate y simplifícalo.
>
> Te adjunto: `jornada-quin-cowork.md` (la fuente de verdad — léela COMPLETA antes de programar), los dos Excel de ejemplo (Dropi y Effi), `Jornada Quin.html` (referencia visual) y el PNG de Quino.
>
> EMPECEMOS SOLO POR EL PASO 1 (motor de reglas + validación). Nada de diseño, login ni base de datos todavía. Necesito que: (1) cargue los dos Excel; (2) aplique la jornada 8am / sábado 7am en Dropi y la fecha de creación en Effi, contando prendas; (3) me muestre por día Propias / Dropi / Total para comparar contra mi hoja; (4) descarte lo que no cuenta (Dropi: canceladas, devoluciones, novedades; Effi: "cambio" y "miguel angel angarita ariza").
>
> Antes de programar, léete el `.md` completo y respóndeme con tu plan en pasos pequeños. No pases del Paso 1 sin mi confirmación.

---

## 21. Pendientes / a confirmar con datos reales

- Lista completa de **estatus de Dropi** (para afinar el filtro de devoluciones/novedades), con un export de mes completo.
- Cómo se marcan exactamente **devoluciones/novedades** en Dropi (valor de `ESTATUS` vs columna `NOVEDAD`).
- Reparto con **sobrante > 1**: ¿todo al último día (por defecto) o repartir de a uno desde el último? (sección 5.3).
- Tabla inicial **tienda → vendedor** (la define el admin).
- Cuenta y credenciales de **Supabase** (las crea el dueño).
- **Validación** de una jornada completa contra la hoja manual (sección 17).

---

*Fin del documento. Unidad: prendas. Estética: Quino (blanco/negro/cian). Lanzamiento objetivo: 1 de agosto. Este documento es la fuente de verdad.*
