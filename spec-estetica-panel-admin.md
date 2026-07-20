# Especificación de reestructuración — Panel del administrador

**Para Antigravity. Copiá todo este archivo como mensaje.**

Trabajás con **Tatiana**, la diseñadora de la marca y quien gestiona el proyecto.
Del diseño hablale de igual a igual y mostrale opciones en vez de decidir sola.
De la programación hablale en palabras simples: qué cambia en pantalla y cómo lo
comprueba ella abriendo la app. No avances de paso sin su confirmación.

---

## Estado y alcance

| Archivo | Estado | En esta especificación |
|---|---|---|
| `index.html` — vista del equipo | **Ya migrado.** Usa el sistema visual nuevo | **No se toca** |
| `quin-admin.html` — panel del admin | Recoloreado a oscuro, **sin reestructurar** | **Es todo el trabajo** |
| `Jornada Quin Actual.html` | Mockup de diseño | **Es la referencia** |

El problema a resolver es preciso: al panel del administrador se le cambiaron los
colores, pero **conserva la arquitectura vieja** — cinco pestañas, cajas
apiladas, tipografía chica y uniforme, tablas con bordes. El mockup propone otra
cosa: una página que se recorre, con jerarquía, aire y bloques con identidad.

**Esto es una reestructuración de layout, no un cambio de paleta.**

---

## La regla que manda sobre todas las demás

> **El diseño se adapta a la funcionalidad, nunca al revés.**

El mockup dibuja **menos cosas de las que el panel hace**. Eso no significa que
sobren: significa que el mockup no las dibujó. Nada se elimina, nada se
simplifica "porque no estaba en el diseño". Si algo no tiene lugar evidente,
**preguntale a Tatiana** antes de decidir.

Entregar un panel más lindo y más pobre es fallar la tarea.

---

# Parte 1 — El sistema visual

Todo esto ya existe en `Jornada Quin Actual.html`. **Copialo, no lo reinterpretes.**

## 1.1 Color

El panel del admin usa el **tema oscuro**, que en el mockup está acotado a
`#admin-section` y arranca en el comentario `TEMA OSCURO — PANEL ADMINISTRADOR`.

**Superficies (las cuatro profundidades)**

| Variable | Valor | Uso |
|---|---|---|
| `--d-bg` | `#070f11` | fondo de la página |
| `--d-sup` | `#0e1c1e` | superficie de tarjeta |
| `--d-sup-2` | `#14282b` | superficie anidada (dentro de una tarjeta) |
| `--d-sup-3` | `#0a1719` | superficie hundida (canales de barras, ítems) |

**Texto**

| Variable | Valor | Uso |
|---|---|---|
| `--d-txt` | `#eaf4f3` | principal |
| `--d-txt-2` | `#8fa5a7` | secundario |
| `--d-txt-3` | `#7d9396` | terciario |

**Marca y bordes**

| Variable | Valor | Uso |
|---|---|---|
| `--turquesa` | `#17c3c3` | acento principal, kickers, cifras destacadas |
| `--turquesa-osc` | `#078f94` | kickers sobre fondo claro |
| `--turquesa-prof` | `#06777b` | texto sobre menta |
| `--d-dropi` | `#5b8f94` | **las barras de Dropi, siempre** |
| `--d-borde` | `rgba(255,255,255,.075)` | borde de tarjeta |
| `--d-borde-2` | `rgba(255,255,255,.13)` | borde de control |
| `--d-sombra` | `0 1px 2px rgba(0,0,0,.4), 0 12px 34px rgba(0,0,0,.36)` | elevación |

**Texto sobre turquesa: `#06171a`.** Nunca blanco ni negro puro.

**Regla de contraste:** el turquesa se reserva para el acento. Si todo es
turquesa, nada destaca. Como máximo un KPI turquesa sólido por fila.

## 1.2 Tipografía

Familia del sistema, la misma del mockup:
`"Segoe UI Variable Display","Segoe UI",-apple-system,BlinkMacSystemFont,"Inter","Helvetica Neue",Arial,sans-serif`

| Rol | Tamaño | Peso | Tracking |
|---|---|---|---|
| Título de cabecera | 34 px | 900 | −.024em |
| Título de sección (`.sec-title`) | 34 px | 900 | −.024em |
| Título de tarjeta (`.card-title`) | 25 px | 900 | −.018em |
| Título de meta (`.meta-title`) | 28 px | 900 | −.02em |
| Cifra de KPI (`.kpi-value`) | 48 px | 900 | −.035em |
| Kicker (`.kicker`) | 13 px | 900 | **+.14em**, mayúsculas |
| Cuerpo / etiquetas | 16 px | 400–600 | normal |
| Etiqueta de gráfica | 12–13 px | 600–800 | normal |

Dos reglas que sostienen el look y hoy no se cumplen:

1. **Toda cifra lleva `font-variant-numeric: tabular-nums`.** Sin excepción. Las
   columnas de números tienen que alinearse.
2. **El kicker siempre va arriba del título**, en mayúsculas y turquesa. Es el
   recurso que ordena la lectura de toda la página.

## 1.3 Forma

- Radios: `--r: 18px` (tarjeta), `--r-sm: 12px` (control), `--r-lg: 26px`
  (tarjeta grande). Píldoras y barras: `999px`.
- Barras de gráfica: `border-radius: 9px 9px 4px 4px`.
- Relleno de tarjeta: **26 px**. La tarjeta de calendario, 32 px.
- Separación entre bloques: **22 px**. Entre secciones: **44 px**.
- Ancho máximo: **1240 px**, con 24 px de aire lateral.

## 1.4 Movimiento

Una sola curva: `cubic-bezier(.22,1,.36,1)`.

- Barras y rellenos al aparecer: 0.9–1.1 s.
- Estados de control (hover, foco): 0.16–0.18 s.
- Foco de campo: `box-shadow: 0 0 0 4px rgba(23,195,195,.16)`.

Nada parpadea, nada rebota, nada se mueve en bucle.

## 1.5 Quino

Está en el mockup como `<symbol id="quino">`, un SVG en línea. Se copia tal cual
y se usa con `<use href="#quino"/>`: no pesa, no pide red, escala sin perder
nitidez. **No uses los PNG de `iconos/` para esto.**

En el panel va en la cabecera, a 52 px.

---

# Parte 2 — La reestructuración

## 2.1 La decisión que hay que tomar primero

El mockup muestra el panel como **una sola página que se recorre**. El panel real
tiene **cinco pestañas** y bastante más contenido del que el mockup dibuja.

Hay dos caminos y **los dos son válidos**. Antes de escribir código, presentale
a Tatiana los dos con un boceto de cada uno y **esperá que ella elija**:

**Camino A — Pestañas con el lenguaje nuevo.** Se conservan las cinco pestañas y
se rediseña su interior con el sistema del mockup. Menos riesgo, cambio más
chico, el admin no tiene que reaprender dónde está cada cosa. La página larga del
mockup se aplica dentro de la pestaña *Tablero*.

**Camino B — Página única con anclas.** Se disuelven las pestañas en una sola
página larga como el mockup, con una barra de navegación que salta a cada
bloque. Más fiel al mockup, pero mueve todo de lugar y el trabajo diario del
admin (subir Excel, cerrar jornadas) es de tarea, no de lectura — y una página
larga sirve peor para eso.

**Recomendación honesta:** el Camino A. El mockup diseñó la parte de *mirar* el
negocio, no la de *operarlo*. Pero la decisión es de Tatiana.

Lo que sigue describe cómo se ve cada bloque, y aplica igual en los dos caminos.

## 2.2 Cabecera (nueva, hoy no existe)

Barra fija arriba (`position: sticky`), fondo `--d-sup`, borde inferior
`--d-borde`. De izquierda a derecha:

1. **Quino** a 52 px.
2. **Bloque de texto:** kicker `PANEL ADMINISTRADOR` en turquesa · título
   `Agencia Quin` a 34/900 · fecha larga del día en `--d-txt-2`
   ("Sábado, 18 de julio de 2026").
3. **Bloque derecho:** el indicador de estado de guardado como píldora
   (`● Al día` sobre `rgba(23,195,195,.15)`), la píldora de rol sobre turquesa
   con texto `#06171a`, y el botón *Ver pantalla vendedor*.

El indicador de nube ya existe con sus tres estados —en la nube / sin conexión /
sincronizando—: se conservan los tres, con el color que ya usa cada uno.

## 2.3 Anatomía de cada bloque

**Sección.** `44px` arriba y abajo. Encabezado = kicker + `.sec-title`.

**KPI.** Tarjeta `--d-sup`, radio 18, relleno 22. Tres líneas: etiqueta 16/600 en
`--d-txt-2`, cifra 48/900 tabular, unidad 16/400 en `--d-txt-3`. Tres variantes
destacadas:

- **Total del día:** degradado `150deg, #17383a → #0d2224`, borde
  `1.5px rgba(23,195,195,.34)`, cifra en turquesa.
- **Propias:** fondo turquesa sólido, todo el texto en `#06171a`.
- **% Propias:** fondo `--d-sup-2`, etiqueta turquesa, cifra a 44 px.

En pantalla ancha van seis por fila; a 1100 px, tres; en celular, dos.

**Tarjeta de meta.** Kicker + título 28/900 + cifra 30/900 + barra de progreso +
píldora con el número + nota. La barra: canal `--d-sup-3` a 15 px de alto, relleno
en degradado `90deg, turquesa → turquesa-osc`, ambos a `999px`, animando el ancho
en 1.1 s.

**Tarjeta TOP.** Etiqueta 16/900 turquesa con +.11em · nombre 24/900 · dato
16/400 en `--d-txt-2`. Van cuatro por fila.

**Fila de ranking.** Rejilla `32px | 1fr | auto`. El puesto es un círculo de
29 px: el 1.º turquesa sólido, el 2.º `rgba(23,195,195,.4)`, el 3.º
`rgba(23,195,195,.22)`, el resto `--d-sup-2`. Debajo del nombre, una barra de
7 px proporcional al valor. Hover: fondo `--d-sup-2`.

**Gráficas.** Siguen siendo **Chart.js** — el mockup las dibuja a mano solo
porque era una maqueta. Configuralas para que se vean así: barras turquesa con
radio `9 9 4 4`, Dropi en `--d-dropi`, línea de meta punteada, grilla casi
invisible (`rgba(255,255,255,.05)`), sin bordes de eje, valores encima de la
barra en 13/800, y el tooltip con fondo `--d-sup-2` y radio 12.

**Calendario.** Tarjeta de radio 28 y relleno 32, partida en `1.5fr | 1fr`:
calendario a la izquierda, panel de selección a la derecha.

- Navegación: dos botones de 46×46 con radio 14, y el mes al centro.
- Casilla de día: mínimo 78 px de alto, radio 13, fondo `--d-sup-2`. Arriba a la
  izquierda el número de día en 12/700; abajo la cifra de prendas en 20/700.
- Estados: **en rango** `rgba(23,195,195,.16)` · **seleccionado** turquesa sólido
  con sombra · **vacío** transparente y sin eventos.
- Panel de selección: fondo `--d-sup-2`, radio 22, con los ítems de Suma /
  Promedio / # días sobre `--d-sup-3`.
- **Los estados que ya existen y el mockup no dibuja —día cerrado, día cargado
  sin cerrar (gris), día con revisión posterior (marca dorada), día no
  laborable— se conservan todos.** Redefiní su color dentro de esta paleta y
  **agregá una leyenda**, que hoy falta.

**Tarjeta de exportación.** Degradado `150deg, #17383a → #0d2224`, borde
turquesa al 28%. Kicker `CONTENIDO PARA COMPARTIR` + título + ayuda + los dos
botones: el de total en turquesa, el de propias en `--d-sup-2` con borde.

**Tablas.** Hoy tienen borde en cada celda. Van a: **sin bordes verticales**,
solo una línea `--d-borde` entre filas, encabezado en 12/600 mayúsculas
`--d-txt-3`, celdas numéricas tabulares y alineadas a la derecha, hover de fila
en `--d-sup-2`, y la tabla dentro de una `.card`.

**Formularios y botones.** Campo: fondo `--d-sup-2`, borde `1.5px --d-borde-2`,
radio 14, relleno 14/16, texto 16. Foco: borde turquesa + halo. Botón primario:
turquesa, texto `#06171a`, 800, radio 14. Secundario: `--d-sup-2` con borde.
Destructivo (borrar historial, reabrir): borde rojo `#ff6b6b` y texto rojo sobre
fondo neutro — **nunca un botón rojo sólido**, para que no compita con las
acciones normales.

## 2.4 Dónde va lo que el mockup no dibujó

Esta es la parte que falta hoy. Cada bloque existente conserva **toda** su
función; lo que cambia es su presentación.

| Bloque actual | Qué se hace |
|---|---|
| **Carga de los dos Excel** | Dos zonas de arrastre lado a lado, fondo `--d-sup-2`, borde punteado `--d-borde-2`, radio 18, con Quino chico y el nombre del archivo cargado. Al lado, la tarjeta *Lo que trae el archivo* con sus cifras como mini-KPIs |
| **Qué cuenta y qué no** | Tarjeta con las casillas en rejilla de dos columnas; cada exclusión, una píldora que se apaga y se prende. Se conserva que la lista **se arma sola** leyendo los archivos |
| **Días no laborables** | Se resuelve dentro del calendario grande, con su estado propio y su entrada en la leyenda. Los bloques encontrados, como píldoras debajo |
| **Jornadas (mes plegable)** | Cada mes, una `.card` que se pliega. Adentro, el mismo calendario de la sección 2.3 con el estado de cada día. La barra *Cerrar seleccionadas (N)* queda **fija abajo** mientras haya algo marcado |
| **Detalle de un día cerrado** | Panel lateral con el mismo tratamiento que el panel de selección: oficial, última revisión, diferencia, cerrada el, y el botón *Reabrir* como secundario |
| **Metas del equipo** | Tarjeta de meta vigente + formulario *Aplica desde* + historial. El historial, tabla nueva; las metas programadas a futuro, píldoras turquesa al 15%; las reemplazadas, tachadas en `--d-txt-3` |
| **Cierre mensual** | Tarjeta por mes con el sello, y el aviso de diferencia como banda ámbar (`rgba(255,152,0,.14)` con texto `#ffb74d`), **no** como texto suelto. Botones *Reabrir* y *Cerrar ahora*. La traza, tabla plegada |
| **Selector de mes e *Incluir días sin cerrar*** | Barra de controles pegada bajo la cabecera: el mes como grupo de botones y la casilla como interruptor. El aviso de bosquejo, banda ámbar |
| **Tabla día por día** | Tabla nueva dentro de `.card`, con real y repartido. Se pliega pasando los 40 días, como hoy |
| **Comparativo mes a mes** | La tarjeta *Evolución* con su gráfica, al lado la de *Resumen del Mes* con la rejilla de tres ítems. Las tablas de vendedores y tiendas, debajo. Las dos casillas, en la barra de controles |
| **Respaldo descargable** | Botón secundario dentro de la tarjeta de exportación |
| **Imágenes para WhatsApp** | El botón vive en la tarjeta de exportación. **El PNG que se genera no se rediseña en este paso** |

## 2.5 Lo que NO se toca

- **El PNG de 1080×1920 para WhatsApp.** Se dibuja en un canvas, tiene su propio
  diseño y 84 pruebas encima. Si Antigravity cree que debería cambiar, lo
  propone; no lo hace.
- **El motor de cálculo.** Jornadas, reparto de fin de semana, festivos,
  rankings, sellos: nada de eso se toca. Este paso es de piel y de layout.
- **Las reglas de negocio.** La jornada arranca a las 8am (7am sábados) y aplica
  a Effi y a Dropi. El sobrante del reparto va al último día. Effi y Dropi no se
  mezclan en rankings pero sí en totales. En Dropi, la tienda es el vendedor.
- **La vista pública `index.html`**, ya migrada.
- **El candado de la base.** El visitante no tiene permiso sobre las columnas de
  detalle. No se afloja para que algo funcione más fácil.

---

# Parte 3 — Cómo se sabe que quedó bien

## 3.1 Criterios de aceptación

Marcá cada uno **con la app abierta**, no leyendo el código:

**Visuales**

- [ ] Ninguna cifra de la pantalla usa fuente no tabular.
- [ ] Todo bloque tiene kicker arriba del título.
- [ ] Las cuatro profundidades se distinguen: fondo, tarjeta, anidada, hundida.
- [ ] Ningún texto queda bajo 4.5:1 de contraste. Ojo con `--d-txt-3` sobre
      `--d-sup-2`: verificalo, no lo supongas.
- [ ] Las barras de Dropi son `--d-dropi` en todas las gráficas.
- [ ] Ningún borde de celda vertical sobrevive en ninguna tabla.
- [ ] Quino está en la cabecera y es el SVG en línea, no un PNG.

**Funcionales — cada una tiene que seguir andando**

- [ ] Subir los dos Excel y ver la tarjeta *Lo que trae el archivo*.
- [ ] Marcar y desmarcar exclusiones, y que la lista se arme sola.
- [ ] Marcar días, cerrar seleccionadas, abrir un día cerrado y reabrirlo.
- [ ] Guardar una meta con fecha *desde*, ver el historial y una meta programada.
- [ ] Cierre mensual: sello, aviso de diferencia, reabrir y cerrar ahora.
- [ ] Calendario: selección arrastrando cruzando de un mes a otro, y el panel con
      Suma / Promedio / # días en Total, Propias y Dropi.
- [ ] Comparativo con y sin bosquejo, y con el mismo número de días.
- [ ] Bajar las dos imágenes de WhatsApp y el respaldo `.json`.
- [ ] Los tres estados del indicador de nube.
- [ ] Login, sesión que se mantiene, y cerrar sesión.

**Técnicos**

- [ ] Las pruebas de `pruebas/` pasan. Corrélas antes de empezar y después de
      cada bloque:
      `cd pruebas && for f in test-*.js; do echo "== $f"; TZ=America/Bogota node $f | tail -1; done`
- [ ] **La página no se traba al hacer scroll.** Este problema es real: se
      reprodujo dos veces desde equipos distintos, con la pestaña sin responder
      varios segundos. Verificá que quedó resuelto con la página andando.
- [ ] Sigue siendo un HTML autocontenido: sin npm, sin framework, sin
      compilador, JavaScript de toda la vida (`var`, `function`).
- [ ] Anda en celular. El admin lo abre desde el teléfono.

## 3.2 Orden de trabajo

1. **Decisión de arquitectura.** Presentá los caminos A y B con un boceto y
   esperá que Tatiana elija. No escribas código antes de esto.
2. **Base del sistema:** variables, tipografía, Quino, y las piezas comunes
   (tarjeta, KPI, tabla, botón, campo).
3. **Cabecera.**
4. **Bloque por bloque, en este orden:** resumen del día → metas → TOP y
   rankings → gráficas → calendario → comparativo → exportación → carga y
   validación → jornadas → cierre mensual.
5. Después de **cada** bloque: corré las pruebas y mostrale a Tatiana cómo quedó.
6. **Publicar:** push a `main`. Vercel publica solo.
   La app queda en `https://reportedeventasagenciaquin.vercel.app/`.

## 3.3 Cómo trabajamos

- **Un bloque a la vez.** No arranques el siguiente sin aprobación.
- **Ejecutá el código antes de entregarlo, no solo lo leas.** Ya pasó una vez: se
  borró una definición que otra línea seguía usando, todo el cálculo quedó mal, y
  al leer el código se veía bien.
- **Si algo del plan te parece mal pensado, decilo** en vez de implementarlo
  calladamente.
- **Si una prueba falla, averiguá primero si el que está mal es tu cambio o la
  prueba, y decilo.** No la arregles bajándole la exigencia.

## 3.4 Archivos

| Archivo | Qué es |
|---|---|
| `quin-admin.html` | lo que vas a reestructurar |
| `Jornada Quin Actual.html` | **la referencia de diseño** |
| `index.html` | la vista pública, ya migrada — **no se toca** |
| `MANUAL DE MARCA AGENCIA QUIN MUETRA # 1.pdf` | manda sobre el mockup si se contradicen |
| `bitacora-quin.md` | historia y decisiones del proyecto — **léela** |
| `supabase-esquema.sql` | el esquema de la base, ya aplicado |
| `pruebas/*.js` | las pruebas automáticas |
