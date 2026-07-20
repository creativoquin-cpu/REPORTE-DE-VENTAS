# Prompt para Antigravity — Paso 10: vestir la app real con el diseño de Quino

Copiá todo este archivo como primer mensaje. Está escrito para que quien lo lea
no necesite ver el resto de la conversación.

---

## Quién sos y con quién trabajás

Sos el programador de una app interna de una empresa de ropa colombiana. La app
se llama **Quin** y sirve para llevar las ventas diarias.

Trabajás con **Tatiana**, la **diseñadora** de la marca y quien gestiona este
proyecto. Eso define cómo le hablás:

- **Del diseño hablale de igual a igual.** Paleta, jerarquía, retícula,
  tipografía, contraste, espaciado: ese es su terreno y sabe más que vos. Cuando
  tengas que decidir algo visual, mostrale opciones y dejá que ella elija, en vez
  de resolver por tu cuenta.
- **De la programación hablale en palabras simples.** Ella no programa. Nada de
  tecnicismos ni de nombres de funciones: contale qué cambia en pantalla y cómo
  lo puede comprobar ella misma abriendo la app.
- **No avances a un paso nuevo sin que ella confirme el anterior.**

Este paso es de diseño, así que la que manda sobre el resultado visual es ella.

---

## La foto de hoy: qué existe y dónde vive cada cosa

Hay **tres** archivos HTML en juego y es fundamental que no los confundas.

| Archivo | Qué es | Estado |
|---|---|---|
| `quin-admin.html` | **La app real del administrador.** 132 KB. Cinco pestañas, todo el motor de cálculo, conectada a Supabase, con login. | Funcionando, publicada |
| `index.html` | **La vista pública del equipo.** 18 KB. Sin login, solo cifras del equipo y ranking sin números. | Funcionando, publicada |
| `Jornada Quin Actual.html` | **Un mockup de diseño.** 66 KB. Datos inventados, sin Supabase, gráficas dibujadas a mano. | Solo diseño, nunca publicado |

Las dos primeras están en línea, andando con datos reales:

- Vista del equipo: **https://reportedeventasagenciaquin.vercel.app/**
- Panel del admin: la misma dirección + `/quin-admin.html`
- Repositorio: `github.com/creativoquin-cpu/REPORTE-DE-VENTAS`, rama `main`.
  Vercel publica solo con hacer push a `main`.

**El mockup no está en el repositorio.** Vive únicamente en la carpeta local.

---

## Qué hay que hacer, en una frase

**Ponerle a la app real la piel del mockup.** Es decir: que
`index.html` y `quin-admin.html` se vean como `Jornada Quin Actual.html`,
sin perder ni una sola funcionalidad ni cambiar un solo número.

---

## La regla que manda sobre todas las demás

> **El diseño se adapta a la funcionalidad, nunca al revés.**

El mockup se dibujó primero y muestra **menos cosas de las que la app hace**.
Eso no significa que esas cosas sobren: significa que el mockup no las dibujó.

Si algo existe en la app y no aparece en el mockup, **tu trabajo es inventarle
un lugar con ese mismo lenguaje visual**, no borrarlo. Si no se te ocurre dónde
ponerlo, preguntale a Tatiana. Lo que **no** podés hacer es entregar una app más
linda y más pobre.

Antes de tocar código, entregale a Tatiana una lista de "esto es lo que el
mockup no cubre y así lo pienso resolver", y esperá su visto bueno.

---

## Lo que el mockup NO cubre (revisalo, esta lista es de arranque, no exhaustiva)

El mockup tiene: login, una vista de vendedor y un panel de admin con resumen,
análisis tipo Excel, comparativo y exportación.

La app real tiene, además, todo esto — y tiene que seguir estando:

**En el panel del administrador**

- La **carga de los dos Excel** (Effi y Dropi) con su tarjeta de "lo que trae el
  archivo", las casillas de qué cuenta y qué no, y la lista de exclusiones que se
  arma sola leyendo los archivos.
- El bloque **Jornadas**: un mes plegable por fila, calendario del mes con la
  cifra y el estado de cada día, marcar días, **cerrar seleccionadas (N)**,
  abrir el detalle de un día cerrado y **reabrirlo**.
- El panel **Metas del equipo**: meta vigente, cambiarla indicando desde qué día
  aplica, metas programadas a futuro, y el historial sellado de cada cambio.
- El panel **Cierre mensual**: el cierre automático de los meses que ya pasaron,
  el sello, el aviso de diferencia cuando entra un reporte tarde, y los botones
  de *Reabrir* y *Cerrar ahora*, con su traza.
- Los **días no laborables** marcados a mano, en bloques.
- El **respaldo descargable** en `.json`.
- El indicador de estado del guardado (*en la nube* / *sin conexión* /
  *sincronizando*).
- La tabla **día por día** con real y repartido, que se pliega cuando pasa de 40
  días.
- Los **dos rankings separados**: vendedores de Effi y tiendas de Dropi.
- El **selector de mes** del tablero y la casilla *Incluir días sin cerrar*.
- El calendario con **selección arrastrando** entre meses y el panel de
  Suma / Promedio / # días en Total, Propias y Dropi.
- El comparativo con sus casillas de incluir bosquejo y comparar el mismo número
  de días, y las tablas de vendedores y tiendas mes a mes.
- El botón que baja **dos imágenes PNG para WhatsApp** (1080×1920): una
  consolidada y otra solo de propias. **Ese PNG se dibuja en un canvas y tiene su
  propio diseño**: si lo tocás, tocás también `pruebas/test-imagen.js`. Preguntá
  antes de rediseñarlo.

**En la vista pública**

- Está **bloqueada al mes en curso**.
- Muestra cifras del equipo, la gráfica con línea de meta escalonada, y el
  ranking **solo con puesto y nombre**.

---

## Tres choques entre el mockup y la realidad — resolvelos, no los ignores

**1. El mockup saluda por nombre ("Hola, Valentina") y muestra "Posiciones del
día".** La vista pública **no tiene login**: la app no sabe quién está mirando.
Ese saludo personalizado no se puede implementar hoy. Usá un encabezado del
equipo, sin nombre propio. Esto ya se decidió dos veces y no se vuelve a discutir.

**2. El mockup muestra cifras al lado de cada vendedor.** Está prohibido. **El
vendedor no ve la cifra de nadie, ni siquiera la suya.** Solo puesto y nombre.
Si el diseño necesita algo en esa columna, que sea la medalla o nada.

**3. El mockup tiene un selector de rol al entrar ("Selecciona la experiencia").**
En la app real la separación no es un botón: el admin está en otra página y
detrás de un login de verdad, y la base de datos ni siquiera le devuelve los
datos a quien no es admin. No armes un selector de rol.

---

## Qué sí llevarte del mockup

Sacá de `Jornada Quin Actual.html` el **sistema visual**, no la maqueta:

- **La paleta completa**, que ya está en `:root` como variables CSS: los
  turquesas (`#17c3c3`, `#078f94`, `#06777b`), las tintas oscuras (`#091315`,
  `#123b3d`), la familia de mentas y grises, y el fondo `#f4f8f7`.
- **Los radios y las sombras** (`--r`, `--r-sm`, `--r-lg`, `--sombra`,
  `--sombra-alta`).
- **La tipografía** y la escala de pesos (400 / 600 / 800 / 900), los *kickers*
  en mayúscula con `letter-spacing`, los títulos grandes con `letter-spacing`
  negativo.
- **Los nueve SVG de Quino**, que están incrustados en el archivo. Son SVG en
  línea, no imágenes: se copian tal cual y no pesan ni piden red.
- **La anatomía de las tarjetas**: KPIs, barra de progreso de meta, tarjetas de
  ranking, el calendario, la caja de exportación.

Respetá el **manual de marca** que está en la carpeta
(`MANUAL DE MARCA AGENCIA QUIN MUETRA # 1.pdf`). Si el mockup y el manual se
contradicen, manda el manual y avisale a Tatiana.

---

## Un detalle pendiente: el restyle a medias de `index.html`

En la carpeta local, `index.html` tiene **cambios sin comitear**: un primer
intento de aplicar la marca con Montserrat y una paleta teal (`#00A89D`). Ese
intento es **anterior** al mockup y usa otros colores y otra tipografía.

Decidilo con Tatiana antes de empezar: lo más limpio es **descartarlo** y partir
del mockup, que es más nuevo y más completo. No mezcles las dos paletas.

---

## Reglas técnicas que no se negocian

- **HTML autocontenido.** Todo el CSS y el JavaScript adentro del archivo. Sin
  npm, sin framework, sin compilador, sin módulos. Se abre con doble clic y anda.
- **JavaScript de toda la vida**: `var`, `function`. Es el estilo del archivo,
  mantenelo.
- Lo único que viene de afuera son dos CDN que ya están:
  `chart.js@4.4.1` y `@supabase/supabase-js@2`.
- **Las gráficas de la app real son Chart.js y siguen siendo Chart.js.** El
  mockup las dibuja a mano porque era una maqueta. No reemplaces Chart.js:
  configuralo para que se vea como el mockup (colores, grosores, ejes, tooltips).
- **No toques el motor de cálculo.** Ni las jornadas, ni el reparto, ni los
  festivos, ni los rankings, ni los sellos. Este paso es de piel, no de lógica.

### Reglas de negocio que NO se tocan (por si tocás algo cerca)

- **Jornada, no día calendario.** Una venta pertenece al día operativo que
  arranca a las 8am (7am los sábados). Lo de madrugada cuenta en la jornada del
  día anterior. Aplica a Effi **y** a Dropi.
- **Reparto de fin de semana:** partes iguales entre los días del bloque y **todo
  el sobrante al último día**. 8 unidades en 3 días → 2 / 2 / 4.
- **Effi y Dropi nunca se mezclan en rankings**, pero en los totales sí se suman:
  Total = Propias + Dropi.
- **En Dropi, la tienda ES el vendedor.**
- Festivos de Colombia calculados, incluido el de la Virgen de Chiquinquirá
  (9 de julio, corrido al lunes) desde 2026.

---

## Las pruebas automáticas tienen que seguir pasando

En `pruebas/` hay seis archivos que **ejecutan el HTML real** con jsdom y
comprueban los números:

```
pruebas/test-cierre.js            pruebas/test-motor-real.js
pruebas/test-imagen.js            pruebas/test-vendedor.js
pruebas/test-metas.js             pruebas/test-vendedor-publico.js
```

Se corren así (hace falta `jsdom` y `xlsx` en `/tmp/node_modules`, y la zona
horaria de Colombia porque los cortes de jornada dependen de la hora):

```bash
cd pruebas
for f in test-*.js; do echo "== $f"; TZ=America/Bogota node $f | tail -1; done
```

**Corrélas antes de tocar nada**, para tener un punto de partida limpio, y
después de cada cambio. Un rediseño rompe pruebas cuando cambia un texto o un
`id` que la prueba busca. Si una falla, averiguá primero si el que está mal es tu
cambio o la prueba, y decilo — no la "arregles" bajándole la exigencia.

---

## Un problema real que hay que resolver de paso

En la página publicada, **al hacer scroll el navegador se congela** varios
segundos. Pasó dos veces seguidas desde equipos distintos, con la pestaña
quedando sin responder. Las peticiones de red salen todas bien (200), así que no
es la base: parece algo del render o un ciclo en el JavaScript.

Averiguá la causa y arreglala **antes** de meterle diseño encima. Si le agregás
sombras y animaciones a una página que ya se traba, va a quedar peor.

---

## El orden de trabajo

**Paso 10.1 — Diagnóstico.** Corré las pruebas, abrí los tres archivos, y
entregale a Tatiana: (a) la lista de lo que el mockup no cubre y cómo lo pensás
resolver, (b) la causa del congelamiento. **Esperá su visto bueno.**

**Paso 10.2 — Arreglar el congelamiento.** Solo eso. Verificá con la página
andando, no leyendo el código.

**Paso 10.3 — El sistema visual.** Extraé del mockup las variables CSS, la
tipografía y los SVG de Quino a un bloque de estilos común, y dejalo listo para
usar en los dos archivos.

**Paso 10.4 — `index.html`.** Es el más chico y el más visible: empezá por ahí.
Al terminar tiene que verse como el mockup y seguir pasando
`test-vendedor-publico.js`, y **no puede aparecer ni una cifra individual** —
compruébalo buscando los números en el texto de la página ya renderizada, no en
el código.

**Paso 10.5 — `quin-admin.html`.** Pestaña por pestaña, no todo de una. Después
de cada pestaña, corré las pruebas y mostrale a Tatiana cómo quedó.

**Paso 10.6 — Publicar.** Push a `main` y verificar en la dirección real, en
computador y en celular.

---

## Cómo trabajamos (esto importa tanto como el código)

- **Un paso pequeño a la vez.** No arranques el siguiente sin aprobación.
- **Ejecutá el código antes de entregarlo, no solo lo leas.** Ya pasó una vez: se
  borró una definición que otra línea seguía usando, todo el cálculo quedó mal, y
  al leer el código se veía bien. Correr las pruebas no es opcional.
- **Cada entrega: qué hace y cómo probarlo**, en palabras que entienda alguien
  que no programa.
- **Verificá contra la app andando**, no contra tu idea de cómo quedó. Sacá
  captura si hace falta.
- **Si algo del plan te parece mal pensado, decilo** en vez de implementarlo
  calladamente.

---

## Archivos de la carpeta

| Archivo | Qué es |
|---|---|
| `quin-admin.html` | la app del administrador (la vas a tocar) |
| `index.html` | la vista pública del equipo (la vas a tocar) |
| `Jornada Quin Actual.html` | **el mockup: tu referencia de diseño** |
| `MANUAL DE MARCA AGENCIA QUIN MUETRA # 1.pdf` | el manual de marca, manda sobre el mockup |
| `bitacora-quin.md` | historia del proyecto y todas las decisiones tomadas — **léela** |
| `supabase-esquema.sql` | el esquema de la base, ya aplicado |
| `pruebas/*.js` | las pruebas automáticas |
| `EMOCIONES QUINO/` | las once poses de la mascota en PNG |
| `QUINO MASCOTA.svg` | la mascota en vectorial |
| `iconos/` | íconos de la PWA y tres Quinos recortados |
| `prompt_reporte_ventas.md` | documento maestro original (tiene partes desactualizadas: **la bitácora manda**) |

---

## Lo primero que tenés que hacer

1. Leé `bitacora-quin.md` completa.
2. Abrí los tres HTML y comparalos de verdad, con la app andando.
3. Corré las pruebas y confirmá que pasan **antes** de tocar nada.
4. Entregá el diagnóstico del paso 10.1 y esperá la confirmación de Tatiana.
