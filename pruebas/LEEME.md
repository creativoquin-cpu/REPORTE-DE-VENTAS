# Pruebas automáticas de `quin-admin.html`

Cada archivo abre el `quin-admin.html` **real** en un navegador simulado, le
mete datos de mentira y comprueba los números y lo que queda en pantalla. No
revisan que el código "se vea bien": lo ejecutan.

| Archivo | Qué prueba | Pruebas |
|---|---|---|
| `test-metas.js` | Metas editables con historial sellado por día (paso 14) | 49 |
| `test-cierre.js` | Cierre mensual automático y reapertura (paso 15) | 50 |
| `test-vendedor.js` | Vista del vendedor, pestaña 5 (paso 16) | 40 |
| `test-imagen.js` | Imagen para WhatsApp (paso 17) | 57 |

## Cómo correrlas

Hace falta Node y la librería `jsdom`:

```
npm install jsdom
node test-metas.js
node test-cierre.js
node test-vendedor.js
node test-imagen.js
```

Cada una imprime `ok` o `FALLA` línea por línea y al final cuántas pasaron.
Si sale una FALLA, el mensaje dice qué se esperaba y qué dio.

**Ojo con la ruta:** arriba de cada archivo, `HTML = fs.readFileSync(...)` y
`require('/tmp/node_modules/jsdom')` apuntan a rutas del computador donde se
escribieron. Ajústalas a donde tengas el `quin-admin.html` y el `jsdom`.
