# Prompt para Antigravity — Paso 9: sacar los datos del navegador

Copiá todo este archivo como primer mensaje. Está escrito para que quien lo lea
no necesite ver el resto de la conversación.

---

## Quién sos y qué vas a tocar

Sos el programador de una app interna de una empresa de ropa colombiana. La app
se llama **Quin** y sirve para llevar las ventas diarias. La usa **Jonatan**, el
dueño, que **no es programador**: explicale todo en palabras simples, sin
tecnicismos, y no avances a un paso nuevo sin que él confirme el anterior.

Vas a trabajar sobre un solo archivo: **`quin-admin.html`**. Es un HTML
autocontenido (todo el JavaScript y el CSS adentro), sin compilador, sin npm,
sin framework. Se abre y funciona. **Mantené ese estilo**: JavaScript de toda la
vida (`var`, `function`), sin módulos ni herramientas de build.

---

## Qué hace la app hoy (no lo rompas)

Cinco pestañas:

1. **Cargar y validar** — el admin sube dos Excel (Effi y Dropi), marca qué
   cuenta y qué no, y "congela" jornadas.
2. **Tablero** — totales del mes, promedios, gráficas, rankings, y un botón que
   baja dos imágenes para WhatsApp.
3. **Calendario** — seleccionar días, marcar no laborables.
4. **Comparativo** — mes contra mes, con los sellos de cierre.
5. **Vista del vendedor** — lo único que un vendedor puede ver.

### Reglas de negocio que NO se tocan

- **Jornada, no día calendario.** Una venta pertenece al día operativo que
  arranca a las 8am (7am los sábados). Lo vendido de madrugada cuenta en la
  jornada del día anterior. Aplica **tanto a Dropi como a Effi**.
- **Reparto de fin de semana.** Las ventas de sábado, domingo y festivos pegados
  se reparten en partes iguales entre los días del bloque, y **todo el sobrante
  va al último día**. Ejemplo: 8 unidades en 3 días → 2 / 2 / 4.
- **Effi y Dropi nunca se mezclan en rankings** (son personas distintas), pero
  **en los totales sí se suman**: Total = Propias + Dropi.
- **En Dropi, la tienda ES el vendedor.**
- **El vendedor no ve cifras de nadie**, ni siquiera las suyas. Solo puesto y
  nombre en el ranking, y las cifras del equipo.
- Festivos de Colombia calculados, incluido el nuevo de la Virgen de
  Chiquinquirá (9 de julio, corrido al lunes) desde 2026.

### Hay pruebas automáticas y tienen que seguir pasando

En la carpeta `pruebas/` hay cinco archivos que **ejecutan el HTML real** con
jsdom y comprueban los números:

```
pruebas/test-cierre.js       50 pruebas
pruebas/test-imagen.js       84 pruebas
pruebas/test-metas.js        49 pruebas
pruebas/test-motor-real.js   58 pruebas  (usa los Excel reales de la carpeta)
pruebas/test-vendedor.js     40 pruebas
```

Se corren así (hace falta `jsdom` y `xlsx` en `/tmp/node_modules`, y la zona
horaria de Colombia porque los cortes de jornada dependen de la hora):

```bash
cd pruebas
for f in test-*.js; do echo "== $f"; TZ=America/Bogota node $f | tail -1; done
```

**Las 281 tienen que seguir pasando después de cada cambio tuyo.** Si alguna
falla, primero averiguá si el que está mal es tu cambio o la prueba, y decilo.

---

## La base de datos ya está montada

Proyecto Supabase ya creado, con el esquema aplicado y probado.

```
URL:    https://vhczimiicebyuytikdat.supabase.co
Clave pública (publishable):  sb_publishable_l2PnEnItch_emRRYyoBohQ_STf5yj_V
```

Esa clave es pública a propósito: va en el código de la página y no da acceso a
nada privado. El esquema completo está en **`supabase-esquema.sql`**, léelo antes
de escribir nada.

### Tablas

| Tabla | Qué guarda | Quién la lee |
|---|---|---|
| `jornadas` | una fila por día operativo: `fecha`, `propias`, `dropi`, `ven` (detalle por vendedor), `tie` (detalle por tienda), `cerrada` | el visitante solo `fecha`, `propias`, `cerrada` |
| `metas` | historial de metas: `desde`, `total`, `propias` | todos |
| `ajustes` | una fila, las casillas de qué cuenta y qué no | solo admin |
| `meses` | el sello del cierre mensual | solo admin |
| `dias_manuales` | días marcados a mano como no laborables | todos |
| `ranking_publico` | `mes`, `puesto`, `nombre` — **sin cifras** | todos |
| `admins` | quién es administrador | solo admin |

### Cómo está cerrado el candado (entendelo antes de tocar)

El detalle por vendedor no se esconde en el código de la página —cualquiera
puede leer ese código—, sino que **el visitante no tiene permiso sobre esas
columnas dentro de la base**. Se conceden columnas, no tablas. Si el visitante
pide `ven`, `tie` o `dropi`, Postgres le responde "permiso denegado".

Ya se comprobó atacándolo: el visitante ve las cifras de equipo y queda
bloqueado en el detalle por vendedor, el detalle por tienda, Dropi, ajustes,
sellos mensuales, y en cualquier intento de escribir o borrar. Un usuario con
sesión iniciada que **no** esté en la tabla `admins` tampoco puede nada.

**No aflojes esto para que algo te funcione más fácil.** Si necesitás un dato
nuevo en la vista pública, agregalo a `ranking_publico` o pedí que se conceda esa
columna puntual — nunca `grant select on public.jornadas to anon` a secas.

### Falta un paso manual que hace Jonatan

La cuenta de administrador todavía no existe. Él tiene que:

1. Supabase → **Authentication → Users → Add user**, con correo y contraseña,
   marcando *Auto Confirm User*.
2. Correr, con el ID que quedó:
   `insert into public.admins (user_id, nombre) values ('EL-ID', 'Jonatan');`
3. Apagar **Allow new users to sign up**.

Si todavía no está hecho, recordáselo antes de empezar con el login.

---

## Lo que hay que construir

### Paso 9.1 — La capa de guardado

Hoy todo el guardado pasa por dos funciones:

```js
function guardar(ll, d){ ... localStorage.setItem ... }
function leer(ll){ ... localStorage.getItem ... }
```

con cuatro llaves: `quin.jornadas`, `quin.ajustes`, `quin.metas`, `quin.meses`.

Escribí encima de eso una capa que hable con Supabase, **sin cambiar el resto de
la app**. Reglas:

- **El navegador sigue siendo la copia rápida.** Al abrir, la app pinta al toque
  con lo que tiene guardado local y en paralelo pide lo de la nube; cuando llega,
  refresca. Nunca una pantalla en blanco esperando internet.
- **Si no hay internet, la app funciona igual** y guarda local. Cuando vuelve la
  conexión, sincroniza.
- **Si el mismo día fue tocado en dos lados, gana el más reciente** (por eso las
  tablas tienen `actualizado`).
- Un indicador chiquito y honesto del estado: *guardado en la nube* / *sin
  conexión, guardado en este equipo* / *sincronizando*.

Usá `@supabase/supabase-js` por CDN (`<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">`).

**Antes de escribir la capa, mostrale a Jonatan un plan corto de cómo la vas a
hacer y esperá su visto bueno.**

### Paso 9.2 — El login del administrador

- Las pestañas 1 a 4 (todo lo del admin) piden correo y contraseña.
- La pestaña 5 (vista del vendedor) **no pide nada**.
- La sesión queda guardada: no tiene que escribir la clave cada vez.
- Botón de salir.
- Si alguien sin sesión intenta ver las pestañas del admin, no las ve. Y aunque
  las forzara, la base no le devuelve datos igual.

### Paso 9.3 — Separar la vista del vendedor

Hoy la vista del vendedor es la pestaña 5 del mismo archivo. Sacala a su propia
página (por ejemplo `index.html`), que:

- No pide login.
- Solo lee lo público: cifras del equipo, metas y `ranking_publico`.
- Está bloqueada al mes en curso.
- **No trae ni una cifra individual.** Comprobalo buscando los números en el
  texto de la página renderizada, no leyendo el código.

Cuando el admin cierra un mes, la app tiene que escribir el ranking ya calculado
en `ranking_publico` (solo puesto y nombre).

### Paso 9.4 — Que se instale como app (PWA)

Jonatan quiere **instalarla desde la web**: abrir la dirección una vez, darle
"Instalar", y que quede el ícono en el escritorio y en el celular, abriéndose sin
barra de navegador. Hace falta `manifest.json`, un service worker que guarde la
app para que abra sin conexión, e íconos. La mascota está en `QUINO MASCOTA.svg`.

### Paso 9.5 — Publicar

Ya hay `vercel.json`. Ajustá las rutas: la raíz debe servir la vista del
vendedor, y el admin queda en su propia dirección.

---

## Cómo trabajamos (esto importa tanto como el código)

- **Un paso pequeño a la vez.** No arranques el 9.2 sin que el 9.1 esté aprobado.
- **Ejecutá el código antes de entregarlo, no solo lo leas.** Ya pasó una vez:
  se borró una definición que otra línea seguía usando, todo el cálculo quedó mal
  y al leer el código se veía bien. Correr las pruebas no es opcional.
- **Cada entrega: qué hace y cómo probarlo**, en palabras que entienda alguien
  que no programa.
- **Verificá los números contra los datos reales** y decilo cuando algo no cuadre,
  aunque sea incómodo.
- **Si algo del plan te parece mal pensado, decilo** en vez de implementarlo
  calladamente.
- La organización visual del archivo tiene desorden conocido. **No lo reordenes
  ahora**: la estética es el último paso, y ahora la prioridad es que funcione.

## Cosas que ya se decidieron y no hay que volver a discutir

- La vista del vendedor **no tiene filtro por vendedor** ni comparación entre
  personas. Se probó y el dueño lo descartó dos veces.
- El sello mensual cuenta **solo jornadas cerradas**; los días cargados sin
  cerrar nunca entran al resumen sellado.
- La imagen de WhatsApp son **dos**, ambas del día: una consolidada
  (propias + Dropi) y otra solo de propias, y bajan con un solo botón.
- `DROPI - ROCKETFY` aparece como vendedor dentro del archivo de Effi y **sí es
  venta propia**. No lo marques como error.
- El vendedor `miguel angel angarita ariza` viene apagado por defecto, así que de
  las 99 unidades del Excel de ejemplo el motor cuenta 98. **No es un descuadre.**

## Archivos de la carpeta

| Archivo | Qué es |
|---|---|
| `quin-admin.html` | la app (lo que vas a tocar) |
| `supabase-esquema.sql` | el esquema de la base, ya aplicado |
| `bitacora-quin.md` | historia del proyecto y todas las decisiones tomadas — **léela** |
| `prompt_reporte_ventas.md` | documento maestro original (ojo: tiene partes desactualizadas, la bitácora manda) |
| `pruebas/*.js` | las 281 pruebas automáticas |
| `QUINO MASCOTA.svg` | la mascota, para los íconos |
| `Jornada Quin.html` | referencia de estética, para el último paso |

## Lo primero que tenés que hacer

1. Leé `bitacora-quin.md` y `supabase-esquema.sql`.
2. Corré las 281 pruebas y confirmá que pasan **antes** de tocar nada, para tener
   un punto de partida limpio.
3. Contale a Jonatan cómo pensás hacer el paso 9.1 y esperá su confirmación.
