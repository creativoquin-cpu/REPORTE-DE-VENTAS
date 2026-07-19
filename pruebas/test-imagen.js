// Prueba del Paso 7 — imágenes para WhatsApp
// jsdom no trae canvas, así que se usa un lienzo falso que ANOTA todo lo que se
// dibuja. Así se puede comprobar cada número, cada texto y cada barra.
const fs = require('fs');
const { JSDOM } = require('/tmp/node_modules/jsdom');

const HTML = fs.readFileSync('/sessions/zen-laughing-fermi/mnt/REPORTE DE VENTAS/quin-admin.html', 'utf8');

let fallos = 0, pruebas = 0;
function ok(nombre, cond, extra) {
  pruebas++;
  if (!cond) { fallos++; console.log('  FALLA  ' + nombre + (extra ? '  → ' + extra : '')); }
  else console.log('  ok     ' + nombre + (extra ? '  (' + extra + ')' : ''));
}

function lienzoFalso() {
  const ops = [];
  const ctx = {
    ops, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
    font: '10px sans', textAlign: 'left', textBaseline: 'alphabetic',
    _x: 0, _y: 0,
    fillRect(x, y, w, h) { ops.push({ op: 'rect', x, y, w, h, color: this.fillStyle }); },
    fillText(t, x, y) { ops.push({ op: 'text', t: String(t), x, y, color: this.fillStyle, font: this.font, align: this.textAlign }); },
    measureText(t) { return { width: String(t).length * parseInt(this.font.match(/(\d+)px/)[1], 10) * 0.55 }; },
    beginPath() { this._pts = []; },
    closePath() {},
    moveTo(x, y) { this._x = x; this._y = y; (this._pts || (this._pts = [])).push([x, y]); },
    lineTo(x, y) { ops.push({ op: 'line', x1: this._x, y1: this._y, x2: x, y2: y, color: this.strokeStyle, w: this.lineWidth, dash: this._dash }); this._x = x; this._y = y; this._pts.push([x, y]); },
    arcTo(x1, y1, x2, y2, r) { this._x = x1; this._y = y1; this._pts.push([x1, y1], [x2, y2]); },
    // un rectángulo redondeado se dibuja con beginPath + moveTo + arcTo y luego fill:
    // se reconstruye a partir de los puntos del trazo
    fill() {
      if (!this._pts || !this._pts.length) return;
      const xs = this._pts.map(p => p[0]), ys = this._pts.map(p => p[1]);
      const x = Math.min(...xs), y = Math.min(...ys);
      ops.push({ op: 'rect', x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, color: this.fillStyle, redondo: true });
      this._pts = [];
    },
    stroke() {},
    save() {}, restore() {}, setLineDash(d) { this._dash = d && d.length ? d : null; },
    drawImage(im, x, y, w, h) { ops.push({ op: 'img', x, y, w, h }); }
  };
  return ctx;
}

let descargas = [];
function arrancar(estado, hoy) {
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true,
    beforeParse(w) {
      if (hoy) {
        const Real = w.Date, fijo = new Real(hoy + 'T10:00:00');
        w.Date = new Proxy(Real, {
          construct(t, a) { return a.length ? new t(...a) : new t(fijo); },
          get(t, p) { return p === 'now' ? () => fijo.getTime() : t[p]; }
        });
      }
      w.Chart = function () { this.destroy = () => {}; };
      w.XLSX = { read: () => ({}), utils: {} };
      w.alert = m => descargas.push({ alerta: m });
      w.HTMLCanvasElement.prototype.getContext = function () {
        if (!this._ctx) this._ctx = lienzoFalso();
        return this._ctx;
      };
      w.HTMLCanvasElement.prototype.toDataURL = function () { return 'data:image/png;base64,XXXX'; };
      // la mascota es un SVG en data: URI; en jsdom no carga, se simula
      w.Image = class { set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); } };
      Object.keys(estado || {}).forEach(k => w.localStorage.setItem(k, JSON.stringify(estado[k])));
    }
  });
  return dom.window;
}

function jor(p, d) {
  return { oficial: { p, d, ven: { Ana: p }, tie: { TiendaX: d } }, cerrada: 'x', fotos: [] };
}
// Julio 2026: 13 lun, 14 mar, 15 mié, 16 jue, 17 vie, 18 sáb, 19 dom
const JUL = {
  '2026-07-13': jor(150, 50),   // 200
  '2026-07-14': jor(140, 60),   // 200
  '2026-07-15': jor(120, 30),   // 150
  '2026-07-18': jor(60, 11),    // sábado 71
  '2026-07-19': jor(20, 4)      // domingo 24
};
// total: 645 (200+200+150+71+24) · propias 490 · bloque sáb+dom 95 → 47/48 · propias 80 → 40/40

function textos(ctx) { return ctx.ops.filter(o => o.op === 'text').map(o => o.t); }
// barras = rectángulos dentro del área de la gráfica (evita confundirlas con
// las franjas de color de los cuadros o la píldora de la meta)
function barras(ctx, color) {
  return ctx.ops.filter(o => o.op === 'rect' && o.color === color &&
    o.y >= 1000 && o.y + o.h <= 1495 && o.w < 100 && o.h > 1)
    .sort((a, b) => a.x - b.x);
}

console.log('\n=== 1. Los números del día ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(2);
  const d = w.imgDatos();
  // último día cargado: domingo 19-jul. Bloque sáb+dom: propias 80 → 40/40, Dropi 15 → 7/8
  ok('el día reportado es el último cargado', d.dia === '2026-07-19', d.dia);
  ok('total del día = 48 (repartido)', d.diaTotal === 48, String(d.diaTotal));
  ok('propias del día = 40', d.diaP === 40, String(d.diaP));
  ok('Dropi del día = 8', d.diaD === 8, String(d.diaD));
  ok('propias + Dropi = el total del día', d.diaP + d.diaD === d.diaTotal);
  ok('promedio del mes por día = 129', d.prom === 129, String(d.prom));
  ok('la meta del día = 200', d.metaDia === 200, String(d.metaDia));
  ok('el mes entero suma 645', d.total === 645, String(d.total));
  ok('barras repartidas: 200,200,150,47,48',
     d.claves.map(k => d.rep[k]).join(',') === '200,200,150,47,48',
     d.claves.map(k => d.rep[k]).join(','));
  ok('lo repartido suma lo mismo que el mes',
     d.claves.reduce((a, k) => a + d.rep[k], 0) === 645);
}

console.log('\n=== 2. El día que cumple la meta ===');
{
  const soloLunes = { '2026-07-13': jor(150, 60) };   // 210, meta 200
  const w = arrancar({ 'quin.jornadas': soloLunes }, '2026-07-20');
  w.mostrar(2);
  const d = w.imgDatos();
  ok('total del día = 210', d.diaTotal === 210, String(d.diaTotal));
  const ctx = w.document.createElement('canvas').getContext('2d');
  w.imgDibujar(ctx, d, null);
  const T = textos(ctx);
  ok('dice que cumplió la meta', T.includes('Meta cumplida'));
  ok('no dice que faltaron', !T.some(t => t.startsWith('Faltaron')));
}

console.log('\n=== 3. Lo que queda escrito en la imagen ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(2);
  const ctx = w.document.createElement('canvas').getContext('2d');
  const d = w.imgDatos();
  w.imgDibujar(ctx, d, null);
  const T = textos(ctx);
  ok('lleva la marca', T.includes('QUIN'));
  ok('dice que es del día', T.includes('Ventas del día'));
  ok('dice la fecha del día', T.some(t => /19-jul/.test(t)), T.slice(0, 5).join('|'));
  ok('la cifra grande es el total del día (48)', T.includes('48'));
  ok('lleva la meta del día en el encabezado', T.includes('Meta 200 prendas'));
  ok('dice cuánto faltó', T.includes('Faltaron 152 para la meta'));
  ok('cuadro de propias', T.includes('Propias (Effi)') && T.includes('40'));
  ok('cuadro de Dropi', T.includes('Dropi') && T.includes('8'));
  ok('cuadro de promedio del mes', T.includes('Promedio del mes') && T.includes('129') && T.includes('por día'));
  ok('lleva el mes día por día', T.some(t => t.includes('El mes día por día · julio 2026')));
  ok('dice el total del mes y los días', T.includes('645 prendas en 5 días'));
  ok('cada barra lleva su cantidad encima',
     ['200', '150', '47', '48'].every(v => T.includes(v)));
  ok('lleva las fechas debajo', ['13', '14', '15', '18', '19'].every(v => T.includes(v)));
  ok('la línea roja lleva rotulada la meta', T.includes('Meta 200'));
  ok('leyenda de propias, Dropi y meta del día',
     T.includes('Propias (Effi)') && T.includes('Dropi') && T.includes('Meta del día'));
  ok('avisa que va repartido', T.some(t => t.includes('repartidos entre sus días')));
  ok('dice cuándo se generó', T.some(t => t.startsWith('Actualizado')));
  ok('NO lleva VS ni nombres de personas',
     !T.some(t => /\bvs\b|ranking|\bAna\b|Tienda/i.test(t)),
     T.filter(t => /\bvs\b|ranking|\bAna\b|Tienda/i.test(t)).join(','));
}

console.log('\n=== 4. El desglose del día cuadra con las barras ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(2);
  const ctx = w.document.createElement('canvas').getContext('2d');
  const d = w.imgDatos();
  w.imgDibujar(ctx, d, null);
  const azules = barras(ctx, '#2a78d6'), verdes = barras(ctx, '#1baf7a');
  ok('hay una barra azul (propias) por día', azules.length === 5, azules.length + ' barras');
  ok('hay una barra verde (Dropi) por día', verdes.length === 5, verdes.length + ' barras');
  ok('la barra del día reportado es la última',
     Math.round(azules[4].x) > Math.round(azules[3].x));
}

console.log('\n=== 5. Las barras son proporcionales y la meta es escalonada ===');
{
  const w = arrancar({
    'quin.jornadas': JUL,
    'quin.metas': [{ id: 1, desde: '2026-07-15', total: 100, propias: 80, cuando: 'x', quien: 'Administrador' }]
  }, '2026-07-20');
  w.mostrar(2);
  const d = w.imgDatos();
  ok('la meta de cada día viene del historial', d.metas.join(',') === '200,200,100,100,100', d.metas.join(','));
  // con meta 100 desde el 15: cumplen 13, 14 (200) y 15 (150) y no 47/48 → 3
  const enMeta = d.claves.filter((k, i) => d.rep[k] >= d.metas[i]).length;
  ok('días en meta con la meta de cada día = 3', enMeta === 3, String(enMeta));

  const ctx = w.document.createElement('canvas').getContext('2d');
  w.imgDibujar(ctx, d, null);
  const lineas = ctx.ops.filter(o => o.op === 'line' && o.color === '#d03b3b');
  ok('la línea de meta lleva un tramo por día', lineas.length === 5, lineas.length + ' tramos');
  ok('los tramos cambian de altura al cambiar la meta',
     Math.round(lineas[0].y1) !== Math.round(lineas[2].y1),
     Math.round(lineas[0].y1) + ' vs ' + Math.round(lineas[2].y1));
  ok('los primeros dos tramos están a la misma altura',
     Math.round(lineas[0].y1) === Math.round(lineas[1].y1));
  // barra de 200 debe ser el doble de alto que la de 100 (proporción)
  ok('se dibujó una barra azul por día', barras(ctx, '#2a78d6').length === 5,
     barras(ctx, '#2a78d6').length + ' barras');
}

console.log('\n=== 6. Nada se sale del lienzo ===');
{
  // mes completo de 31 días, el caso más apretado
  const largo = {};
  for (let i = 1; i <= 31; i++) {
    const k = '2026-07-' + String(i).padStart(2, '0');
    largo[k] = jor(100 + i, 20);
  }
  const w = arrancar({ 'quin.jornadas': largo }, '2026-07-31');
  w.mostrar(2);
  const d = w.imgDatos();
  ok('toma los 31 días', d.n === 31, String(d.n));
  const ctx = w.document.createElement('canvas').getContext('2d');
  w.imgDibujar(ctx, d, null);
  const fuera = ctx.ops.filter(o => {
    if (o.op === 'rect') return o.x < 0 || o.y < 0 || o.x + o.w > 1080 || o.y + o.h > 1920;
    if (o.op === 'text') return o.x < 0 || o.y < 0 || o.y > 1920;
    if (o.op === 'line') return o.y1 < 0 || o.y1 > 1920 || o.x2 > 1080;
    return false;
  });
  ok('ningún elemento se sale del lienzo 1080×1920', fuera.length === 0,
     JSON.stringify(fuera.slice(0, 2)));
  const nums = ctx.ops.filter(o => o.op === 'text' && o.align === 'center');
  ok('con 31 días siguen saliendo las 31 cantidades y las 31 fechas',
     nums.length === 62, nums.length + ' textos centrados');
  const B = barras(ctx, '#2a78d6');
  ok('las barras no se montan unas sobre otras',
     B.length === 31 && B.every((b, i) => i === 0 || b.x >= B[i-1].x + B[i-1].w),
     B.length + ' barras sin traslape');
}

console.log('\n=== 6b. El mes de la imagen no depende del selector del tablero ===');
{
  const conJunio = Object.assign({
    '2026-06-10': jor(500, 100), '2026-06-11': jor(500, 100)
  }, JUL);
  const w = arrancar({ 'quin.jornadas': conJunio }, '2026-07-20');
  w.mostrar(2);
  w.mes.value = '2026-06';                       // el admin mira junio en el tablero
  const d = w.imgDatos();
  ok('la imagen sigue siendo de julio (mes en curso)', d.m === '2026-07', d.m);
  ok('no se cuela ninguna cifra de junio', d.total === 645, String(d.total));
  ok('el aviso dice de qué mes sale la imagen',
     w.document.getElementById('avisoImg').textContent.includes('julio 2026'),
     w.document.getElementById('avisoImg').textContent);

  // con un archivo cargado manda el mes del archivo
  w.ultimoCalculo = { '2026-08-03': { propias: 10, dropi: 5, ven: {}, tie: {} } };
  ok('si hay archivo cargado, manda el mes del archivo', w.mesImagen() === '2026-08', w.mesImagen());
}

console.log('\n=== 7. Descarga y casos borde ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(2);
  const enlaces = [];
  const crear = w.document.createElement.bind(w.document);
  w.document.createElement = function (t) {
    const el = crear(t);
    if (t === 'a') { el.click = function () { enlaces.push({ href: el.href, name: el.download }); }; }
    return el;
  };
  w.document.getElementById('btnImg').click();
  return new Promise(res => setTimeout(() => {
    ok('el botón descarga un PNG', enlaces.length === 1 &&
       String(enlaces[0].href).startsWith('data:image/png'), JSON.stringify(enlaces.map(e => e.name)));
    ok('el nombre del archivo lleva el día', enlaces[0].name === 'quin-2026-07-19.png', enlaces[0].name);

    // mes sin datos: avisa en vez de romperse
    const w2 = arrancar({}, '2026-07-20');
    w2.mostrar(2);
    descargas = [];
    w2.descargarImagen();
    ok('sin datos avisa y no descarga nada',
       descargas.length === 1 && descargas[0].alerta.includes('Todavía no hay datos'),
       JSON.stringify(descargas));

    console.log('\n=== 8. Nada de lo anterior se rompió ===');
    const w3 = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
    w3.mostrar(2);
    const tab = w3.document.getElementById('contenido').textContent.replace(/\s+/g, ' ');
    ok('el tablero sigue dando 645', tab.includes('Total del mes645'),
       (tab.match(/Total del mes.{0,10}/) || [''])[0]);
    w3.mostrar(1);
    ok('la pestaña 1 sigue completa',
       w3.document.getElementById('congelado').textContent.includes('Jornadas') &&
       w3.document.getElementById('panelMetas').textContent.includes('Metas del equipo') &&
       w3.document.getElementById('panelCierre').textContent.includes('Cierre mensual'));
    w3.mostrar(4);
    ok('el comparativo sigue pintando', w3.document.getElementById('cmpContenido').textContent.includes('Mes a mes'));
    w3.mostrar(5);
    ok('la vista del vendedor sigue pintando',
       w3.document.getElementById('vendContenido').textContent.includes('Cómo va el equipo'));
    ok('la vista del vendedor no tiene botones de descarga',
       w3.document.querySelectorAll('#vista5 button').length === 0);
    ok('en el tablero hay un solo botón de imagen',
       w3.document.querySelectorAll('#vista2 button').length === 1,
       w3.document.querySelectorAll('#vista2 button').length + ' botones');

    console.log('\n' + (fallos ? 'FALLARON ' + fallos + ' de ' + pruebas : 'Pasaron las ' + pruebas + ' pruebas'));
    process.exit(fallos ? 1 : 0);
  }, 50));
}
