# Reglas de negocio de Quin — referencia consolidada

> Estas son las reglas que **no pueden cambiar de comportamiento** al migrar
> a Next.js, salvo que el dueño del negocio lo pida explícitamente. Cada
> regla indica su fuente para poder verificarla contra el código real. Ver
> también [`ARCHITECTURE.md`](./ARCHITECTURE.md) para el mapa del sistema.

## 1. Corte de jornada (día operativo)

- La jornada de un día corre de **8:00am a 8:00am del día siguiente**, salvo
  los **sábados, que cortan a las 7:00am** (la madrugada del sábado hasta
  las 6:59am pertenece al viernes).
- Aplica tanto a **Dropi** (fecha+hora combinadas) como a **Effi**. Effi
  aplica el corte solo cuando la celda trae hora; si no trae hora, se toma
  el día tal cual.
  - Corrección del 19-jul-2026 ("decisión 1 de la bitácora"): originalmente
    se pensó que Effi no necesitaba el corte; se corrigió al encontrar 9
    unidades registradas entre 2am y 6:09am de un sábado que en realidad
    pertenecían a la jornada del viernes.
- Fuente: `bitacora-quin.md` (decisión 1), `quin-admin.html:482-508`,
  `index.html` (lógica idéntica, comentario "idéntico a quin-admin.html").
- Casos límite verificados en `pruebas/test-motor-real.js`: sábado 06:59 →
  viernes; sábado 07:01 → sábado; domingo 07:59 → sábado; martes 08:01 →
  martes; martes 07:59 → lunes.

## 2. Festivos de Colombia

- Se calculan **en vivo** (algoritmo de Gauss/Meeus para Pascua + fechas
  fijas + fechas trasladadas al lunes siguiente vía Ley Emiliani), no están
  hardcodeados como lista estática.
- **Nuevo festivo desde 2026**: Virgen de Chiquinquirá (9 de julio,
  trasladada al lunes siguiente) — activo con el guard `if (y >= 2026)`.
  Como la fecha actual del sistema es 2026-07-21, esta rama ya está activa
  en producción.
- El listado completo de 19 festivos de 2026 está verificado por fecha
  exacta en `pruebas/test-motor-real.js`.
- Fuente: `bitacora-quin.md` (decisión 3), `quin-admin.html:527-546`,
  `index.html:178-203` (código duplicado a propósito, mismo algoritmo).

## 3. Reparto de fin de semana / festivos

- Los días no laborables consecutivos (sábado+domingo, o bloques extendidos
  por festivos adyacentes) se agrupan en **bloques**, y su total se reparte
  parejo en enteros entre los días del bloque.
- **Todo el sobrante va al último día del bloque** (ej. 8 entre 3 días →
  2, 3, 3 — nunca 2.67 cada uno).
  - Confirmado explícitamente aunque la planilla manual de junio repartía
    distinto: el dueño indicó seguir la regla programada de ahora en
    adelante, no la planilla histórica.
- Effi y Dropi se reparten **de forma independiente** (no se combinan antes
  de repartir).
- Un festivo entre semana que no es adyacente a un fin de semana **no** se
  reparte.
- Fuente: `bitacora-quin.md` (decisión 6), `prompt_reporte_ventas.md`,
  `quin-admin.html:556-574` (`repartir`, `armarBloques`).

## 4. Ingesta de datos (Effi y Dropi)

- Ambas plataformas se miden en **unidades de prenda**, nunca en dinero.
- **Effi**: suma la columna `Cantidad`; excluye filas cuyo `Vendedor` sea
  vacío o coincida exactamente con nombres marcados como excluidos por
  defecto (ej. "Cambios", "Miguel" — coincidencia exacta, no afecta nombres
  compuestos).
- **Dropi**: suma `Cantidad` (no dinero); excluye filas con
  `Estatus = "Cancelado"`; opcionalmente descarta filas con nota de
  "NOVEDAD" (casilla activable).
- Los filtros de qué vendedor/estatus cuenta se **auto-detectan** de lo que
  trae el archivo subido — no están hardcodeados — y el usuario puede
  prender/apagar cada uno; esa elección se conserva al volver a subir un
  archivo nuevo (`fusionar`).
- Fuente: `bitacora-quin.md` (decisión 2), `prompt_reporte_ventas.md`,
  `quin-admin.html:1012-1029`.

## 5. Rankings: Effi y Dropi nunca se mezclan

- **En Dropi, la tienda ES el vendedor** — no existe mapeo tienda→persona.
- Effi (por vendedor) y Dropi (por tienda) generan **rankings separados**,
  nunca combinados en una sola lista.
- Pero sí se **suman** en los totales generales: Total = Propias (Effi) +
  Dropi.
- Fuente: `bitacora-quin.md` (decisiones 4 y 5), `quin-admin.html:591,1783`.

## 6. Metas del equipo (historial versionado)

- Las metas son **del equipo**, no individuales.
- Cada cambio de meta crea una **fila nueva** en el historial; **nunca se
  edita ni se borra** una fila existente.
- La meta vigente para una fecha es la **última fila registrada cuyo
  `desde` ya llegó** (orden por fecha efectiva) — así los días pasados
  conservan la meta que tenían cuando ocurrieron, aunque después se agregue
  una meta nueva.
- Si dos metas tienen la misma fecha `desde`, la **más reciente guardada
  gana**; la anterior queda marcada "reemplazada" pero sigue visible.
- Se pueden programar metas **futuras** ("programada"), que no afectan el
  presente hasta que llegue su fecha, y se pueden quitar mientras estén
  pendientes.
- Validación al guardar: `total > 0`, `propias >= 0`, `propias <= total`, y
  el cambio debe ser distinto al vigente (no se permite guardar un no-op).
- Valores por defecto si no hay historial: `META_TOTAL = 200`,
  `META_PROPIAS = 160`.
- Fuente: `bitacora-quin.md` (decisión 14), `supabase-esquema.sql:45-58`,
  `quin-admin.html:436-452,1349-1450`, verificado en `pruebas/test-metas.js`.

## 7. Cierre de jornadas (días)

- Al cerrar un día, su cifra queda **oficial y no cambia**. Si se vuelve a
  subir el mismo día después, la cifra oficial se respeta y la nueva se
  guarda solo como **comparación** (historial de re-subidas, `fotos[]`).
- Un día cargado pero no cerrado ("bosquejo"/borrador) **nunca sobreescribe**
  un día ya cerrado oficialmente.
- Fuente: `quin-admin.html:745-748,768-769,1472-1473`.

## 8. Sellado mensual (cierre de mes)

- Cada mes se cierra automáticamente **solo la primera vez** que se abre la
  app en el mes siguiente, y **solo cuenta jornadas cerradas** (nunca
  bosquejo/borrador).
- Al sellarse, el resumen del mes **queda congelado y no cambia**, aunque
  después lleguen reportes tarde para ese mes. Si hace falta incluirlos, hay
  que **reabrir el mes y volverlo a cerrar** manualmente.
- Un mes que el admin reabrió **no se vuelve a cerrar solo** — queda
  esperando cierre manual; el próximo mes que transcurra sigue
  auto-cerrándose con normalidad.
- Toda apertura/cierre/re-cierre queda en una **traza de auditoría**
  ordenada ("Cerrado automáticamente" / "Reabierto" / "Vuelto a cerrar a
  mano").
- La vista Comparativo siempre muestra la **cifra en vivo**, con la cifra
  sellada anotada al lado y una advertencia cuando difieren — nunca
  reemplaza la cifra en vivo por la sellada.
- Fuente: `bitacora-quin.md` (decisiones 9 y 10), `quin-admin.html:1118-1346`
  (paso 15 de la bitácora), verificado en `pruebas/test-cierre.js`.

## 9. Vista pública / vendedor

- **Sin login, sin datos privados**: solo lee lo que la base deja leer a
  cualquiera (metas, días no laborables, ranking ya calculado, y de
  `jornadas` **solo** fecha, propias y si está cerrada — nunca detalle por
  vendedor ni por tienda).
- El vendedor **nunca ve cifras individuales de nadie**, ni las suyas ni las
  de otros — solo posición en el ranking + nombre. Se probó y se descartó
  explícitamente un gráfico "VS" incluso sin números.
- **No hay filtro "ver como [vendedor]"** — hasta que exista login
  diferenciado por vendedor, la vista es siempre a nivel de equipo completo.
- La vista está **fija al mes actual**, sin navegación a meses anteriores.
- Las reglas de cálculo (reparto, meta del día) son **las mismas** que usa
  el admin — verificado por `pruebas/test-vendedor-publico.js`, que compara
  ambos cálculos para que no se desalineen con el tiempo.
- Fuente: `bitacora-quin.md` (decisiones 8, 11, 12, 16), `index.html:152-161`.

## 10. Seguridad: aplicada en la base de datos, no en el código

- El detalle por vendedor y por tienda **nunca sale de la base sin ser
  administrador** — y eso se logra con `GRANT` a nivel de **columna** en
  Postgres, no ocultando código en el cliente (cualquiera puede leer el
  código de una página web).
- Ser un usuario autenticado **no alcanza** para ser administrador: hace
  falta estar en la tabla `admins`, chequeada por la función
  `privado.es_admin()` (vive en un esquema no expuesto a la API).
- **Al migrar a Next.js, este principio no se relaja**: cualquier gate de
  autenticación en middleware/servidor es solo UX — el permiso real sigue
  viviendo en RLS.
- Fuente: `supabase-esquema.sql:1-23,98-150`.

## 11. Imágenes de WhatsApp

- Se generan **2 imágenes verticales 1080×1920** por botón: una consolidada
  (Propias + Dropi) y una solo-propias, descargadas con 700ms de diferencia
  (algunos navegadores descartan la segunda descarga si son simultáneas).
- Usan **cifras repartidas** (las mismas que ve el vendedor), incluyendo
  días cargados-pero-no-cerrados, con una nota de advertencia cuando los
  hay.
- Siempre son del **último día cargado** y del **mes que se está
  registrando actualmente** — nunca del mes seleccionado en el tablero (para
  no mandar por error la imagen de un mes viejo).
- **Nunca muestran "VS" ni nombres de personas** — regla explícita y
  verificada con test de texto (`pruebas/test-imagen.js` busca por regex que
  no aparezcan nombres ni la palabra "vs"/"ranking").
- Fuente: `bitacora-quin.md` (decisiones 13, 14, 15), `quin-admin.html:2153-2160`.

## 12. Reglas de UI/arquitectura que también son "de negocio"

- **"El diseño se adapta a la funcionalidad, nunca al revés"** — ningún
  rediseño visual puede recortar una función solo porque el mockup no la
  dibujó (`spec-estetica-panel-admin.md`).
- La pestaña "Vista del vendedor" del admin **reutiliza literalmente**
  `index.html` (vía iframe hoy; vía el mismo componente React en la
  migración) — nunca debe haber dos implementaciones separadas calculando
  lo mismo, porque eso ya causó bugs de desincronización en el pasado
  (`quin-admin.html:2448-2452`).
- Toda la administración de datos es **exclusiva del admin** — el equipo
  nunca sube ni edita nada, solo consulta.
