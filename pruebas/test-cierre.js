// Prueba del Paso 15 — cierre mensual automático el día 1, con opción de reabrir
const fs = require('fs');
const { JSDOM } = require('jsdom');

const HTML = fs.readFileSync(require('path').join(__dirname, '..', 'quin-admin.html'), 'utf8');

let fallos = 0, pruebas = 0;
function ok(nombre, cond, extra) {
  pruebas++;
  if (!cond) { fallos++; console.log('  FALLA  ' + nombre + (extra ? '  → ' + extra : '')); }
  else console.log('  ok     ' + nombre + (extra ? '  (' + extra + ')' : ''));
}

const graficas = {};
const instanciasChart = {};
function ChartFalso(el, cfg) {
  graficas[el.id] = cfg;
  instanciasChart[el.id] = this;
  this.destroy = () => { delete instanciasChart[el.id]; };
}
ChartFalso.getChart = el => instanciasChart[(typeof el === 'string') ? el : el.id];

let confirmar = true;
const alertas = [];

// hoy = 18-jul-2026, salvo que la prueba diga otra cosa
function arrancar(estado, hoy) {
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    beforeParse(w) {
      if (hoy) {
        const Real = w.Date, fijo = new Real(hoy + 'T10:00:00');
        function D(...a) { return a.length ? new Real(...a) : new Real(fijo); }
        D.prototype = Real.prototype;
        D.now = () => fijo.getTime();
        D.parse = Real.parse; D.UTC = Real.UTC;
        w.Date = new Proxy(Real, {
          construct(t, a) { return a.length ? new t(...a) : new t(fijo); },
          get(t, p) { return p === 'now' ? () => fijo.getTime() : t[p]; }
        });
      }
      w.Chart = ChartFalso;
      w.XLSX = { read: () => ({}), utils: {} };
      w.confirm = () => confirmar;
      w.alert = m => alertas.push(m);
      w.HTMLCanvasElement.prototype.getContext = () => ({
        save(){}, restore(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, fillText(){},
        setLineDash(){}, measureText(){ return { width: 10 }; }
      });
      Object.keys(estado || {}).forEach(k => w.localStorage.setItem(k, JSON.stringify(estado[k])));
    }
  });
  return dom.window;
}

function jor(p, d) {
  return { oficial: { p, d, ven: { 'Ana': p }, tie: { 'TiendaX': d } }, cerrada: '01-x-2026', fotos: [] };
}
function guardadas(w) { return JSON.parse(w.localStorage.getItem('quin.meses') || '{}'); }
function panel(w) { return w.document.getElementById('panelCierre').textContent.replace(/\s+/g, ' '); }

// junio: 3 días = 600 · julio: 2 días = 350
const BASE = {
  '2026-06-10': jor(150, 50),   // 200
  '2026-06-11': jor(160, 40),   // 200
  '2026-06-12': jor(170, 30),   // 200
  '2026-07-14': jor(120, 30),   // 150
  '2026-07-15': jor(150, 50)    // 200
};

console.log('\n=== 1. Al abrir la app, los meses que ya pasaron se cierran solos ===');
{
  const w = arrancar({ 'quin.jornadas': BASE }, '2026-07-18');
  const g = guardadas(w);
  ok('junio quedó cerrado solo', g['2026-06'] && g['2026-06'].estado === 'cerrado' && g['2026-06'].auto === true);
  ok('el sello de junio es 600 en 3 días',
     g['2026-06'].resumen.total === 600 && g['2026-06'].resumen.dias === 3,
     g['2026-06'].resumen.total + ' en ' + g['2026-06'].resumen.dias);
  ok('julio (mes en curso) NO se cerró', !g['2026-07']);
  ok('el panel avisa que se cerró solo', panel(w).includes('Se cerró solo junio 2026'));
  ok('julio sale como en curso', panel(w).includes('En curso'));
  ok('quedó traza del cierre automático',
     g['2026-06'].traza.length === 1 && g['2026-06'].traza[0].que === 'Cerrado automáticamente');
}

console.log('\n=== 2. Abrir de nuevo el mismo mes no vuelve a sellar ni duplica traza ===');
{
  const w1 = arrancar({ 'quin.jornadas': BASE }, '2026-07-18');
  const g1 = guardadas(w1);
  const w2 = arrancar({ 'quin.jornadas': BASE, 'quin.meses': g1 }, '2026-07-20');
  const g2 = guardadas(w2);
  ok('el sello de junio no cambió', g2['2026-06'].cerrado === g1['2026-06'].cerrado);
  ok('la traza sigue con una sola línea', g2['2026-06'].traza.length === 1);
  ok('la segunda vez ya no dice "se cerró solo"', !panel(w2).includes('Se cerró solo'));
}

console.log('\n=== 3. El sello NO cambia aunque entre un reporte tarde ===');
{
  const w1 = arrancar({ 'quin.jornadas': BASE }, '2026-07-18');
  const tarde = Object.assign({}, BASE, { '2026-06-13': jor(70, 30) });  // +100 en junio
  const w = arrancar({ 'quin.jornadas': tarde, 'quin.meses': guardadas(w1) }, '2026-07-20');
  const g = guardadas(w);
  ok('el sello sigue en 600', g['2026-06'].resumen.total === 600, 'sello ' + g['2026-06'].resumen.total);
  const dm = w.difMesSellado('2026-06');
  ok('la app ve la diferencia: hoy 700, +100', dm.ahora === 700 && dm.dif === 100, dm.ahora + ' / ' + dm.dif);
  ok('el panel muestra la diferencia', panel(w).includes('+100 prendas frente al sello'));
  ok('el panel dice qué hacer', panel(w).includes('Reábrelo y ciérralo de nuevo'));
  w.mostrar(2); w.mes.value = '2026-06'; w.pintarTablero();
  const tab = w.document.getElementById('contenido').textContent.replace(/\s+/g, ' ');
  ok('el tablero avisa que el mes está cerrado con 600', tab.includes('600') && tab.includes('Mes cerrado'));
  ok('el tablero avisa que hoy dan 700', tab.includes('Hoy los datos dan 700'));
}

console.log('\n=== 4. Reabrir y volver a cerrar sí actualiza el sello ===');
{
  const w1 = arrancar({ 'quin.jornadas': BASE }, '2026-07-18');
  const tarde = Object.assign({}, BASE, { '2026-06-13': jor(70, 30) });
  const w = arrancar({ 'quin.jornadas': tarde, 'quin.meses': guardadas(w1) }, '2026-07-20');

  confirmar = true;
  w.document.querySelector('.cierreReabrir').click();
  let g = guardadas(w);
  ok('junio quedó reabierto', g['2026-06'].estado === 'abierto' && g['2026-06'].cerrado === null);
  ok('la traza registra la reapertura',
     g['2026-06'].traza.some(t => t.que === 'Reabierto' && t.total === 600));
  ok('el panel dice que no se cierra solo', panel(w).includes('no se cierra solo'));
  w.mostrar(2); w.mes.value = '2026-06'; w.pintarTablero();
  ok('el tablero avisa que está reabierto',
     w.document.getElementById('contenido').textContent.includes('Mes reabierto'));

  w.mostrar(1);
  w.document.querySelector('.cierreCerrar[data-m="2026-06"]').click();
  g = guardadas(w);
  ok('ahora el sello es 700 en 4 días',
     g['2026-06'].resumen.total === 700 && g['2026-06'].resumen.dias === 4,
     g['2026-06'].resumen.total + ' en ' + g['2026-06'].resumen.dias);
  ok('quedó marcado como cierre a mano', g['2026-06'].auto === false && g['2026-06'].estado === 'cerrado');
  ok('la traza tiene las tres cosas en orden',
     g['2026-06'].traza.map(t => t.que).join(' | ') ===
     'Cerrado automáticamente | Reabierto | Vuelto a cerrar a mano',
     g['2026-06'].traza.map(t => t.que).join(' | '));
  ok('ya no hay diferencia contra el sello', w.difMesSellado('2026-06').dif === 0);
}

console.log('\n=== 5. Un mes reabierto NO se vuelve a cerrar solo al abrir la app ===');
{
  const w1 = arrancar({ 'quin.jornadas': BASE }, '2026-07-18');
  const w2 = arrancar({ 'quin.jornadas': BASE, 'quin.meses': guardadas(w1) }, '2026-07-20');
  confirmar = true;
  w2.document.querySelector('.cierreReabrir').click();
  const w3 = arrancar({ 'quin.jornadas': BASE, 'quin.meses': guardadas(w2) }, '2026-08-02');
  const g = guardadas(w3);
  ok('junio sigue abierto después de reabrir la app', g['2026-06'].estado === 'abierto');
  ok('julio sí se cerró solo al llegar agosto', g['2026-07'] && g['2026-07'].estado === 'cerrado');
  ok('el sello de julio es 350 en 2 días',
     g['2026-07'].resumen.total === 350 && g['2026-07'].resumen.dias === 2,
     g['2026-07'].resumen.total + ' en ' + g['2026-07'].resumen.dias);
  ok('el aviso nombra solo a julio',
     panel(w3).includes('Se cerró solo julio 2026') && !panel(w3).includes('junio 2026.'));
}

console.log('\n=== 6. Cerrar a mano el mes en curso, y cancelar el aviso no hace nada ===');
{
  const w = arrancar({ 'quin.jornadas': BASE }, '2026-07-18');
  confirmar = false;
  w.document.querySelector('.cierreCerrar[data-m="2026-07"]').click();
  ok('si cancelo el aviso, julio no se cierra', !guardadas(w)['2026-07']);
  confirmar = true;
  w.document.querySelector('.cierreCerrar[data-m="2026-07"]').click();
  const g = guardadas(w);
  ok('al confirmar, julio queda cerrado a mano en 350',
     g['2026-07'].estado === 'cerrado' && g['2026-07'].auto === false && g['2026-07'].resumen.total === 350);
  ok('la traza dice "Cerrado a mano"', g['2026-07'].traza[0].que === 'Cerrado a mano');
}

console.log('\n=== 7. El sello guarda el detalle del mes (rankings, mejor/peor, metas) ===');
{
  const w = arrancar({
    'quin.jornadas': BASE,
    'quin.metas': [{ id: 1, desde: '2026-06-12', total: 250, propias: 200, cuando: 'x', quien: 'Administrador' }]
  }, '2026-07-18');
  const r = guardadas(w)['2026-06'].resumen;
  ok('guarda propias y Dropi', r.p === 480 && r.d === 120, r.p + ' / ' + r.d);
  ok('guarda el promedio', r.prom === 200, String(r.prom));
  ok('guarda el ranking de vendedores', r.ven['Ana'] === 480, String(r.ven['Ana']));
  ok('guarda el ranking de tiendas', r.tie['TiendaX'] === 120, String(r.tie['TiendaX']));
  ok('mejor y peor día (empatados en 200) quedan registrados', r.mejor.t === 200 && r.peor.t === 200);
  // 10 y 11-jun con meta 200 → cumplen; 12-jun con meta 250 → no
  ok('días en meta usan la meta de cada día: 2 de 3', r.enMetaT === 2, String(r.enMetaT));
  // propias 150,160 con meta 160 → solo el 11 cumple; 170 con meta 200 → no
  ok('días en meta de propias: 1 de 3', r.enMetaP === 1, String(r.enMetaP));
}

console.log('\n=== 8. El bosquejo (días sin cerrar) nunca entra al sello ===');
{
  const w = arrancar({ 'quin.jornadas': BASE }, '2026-07-18');
  // simulo un archivo cargado con un día de junio que NO está cerrado
  w.ultimoCalculo = { '2026-06-20': { propias: 500, dropi: 500, ven: {}, tie: {} } };
  w.pintarCierre();
  ok('el total mostrado de junio ignora lo no cerrado', panel(w).includes('600'));
  ok('el sello de junio sigue en 600', guardadas(w)['2026-06'].resumen.total === 600);
  ok('no aparece el 1000 del bosquejo', !panel(w).includes('1600') && !panel(w).includes('1000'));
}

console.log('\n=== 9. El comparativo marca los meses sellados ===');
{
  const w1 = arrancar({ 'quin.jornadas': BASE }, '2026-07-18');
  const tarde = Object.assign({}, BASE, { '2026-06-13': jor(70, 30) });
  const w = arrancar({ 'quin.jornadas': tarde, 'quin.meses': guardadas(w1) }, '2026-07-20');
  w.document.getElementById('cmpBos').checked = false;
  w.mostrar(4);
  const cmp = w.document.getElementById('cmpContenido').textContent.replace(/\s+/g, ' ');
  ok('junio sale con su sello', cmp.includes('sellado en 600'));
  ok('avisa que difiere', cmp.includes('difiere +100'));
  ok('los totales vivos siguen igual (junio 700, julio 350)', cmp.includes('700') && cmp.includes('350'));
}

console.log('\n=== 10. Nada de lo anterior se rompió ===');
{
  const w = arrancar({
    'quin.jornadas': BASE,
    'quin.metas': [{ id: 1, desde: '2026-07-15', total: 240, propias: 180, cuando: 'x', quien: 'Administrador' }]
  }, '2026-07-18');
  w.document.getElementById('incBos').checked = false;
  w.mostrar(2); w.mes.value = '2026-06'; w.pintarTablero();
  const t = w.document.getElementById('contenido').textContent.replace(/\s+/g, ' ');
  ok('tablero de junio: total 600', t.includes('Total del mes600'));
  ok('tablero de junio: promedio 200', t.includes('Promedio por día200'));
  ok('metas siguen funcionando (14-jul 200, 15-jul 240)',
     w.metaEn('2026-07-14').total === 200 && w.metaEn('2026-07-15').total === 240);
  ok('el panel de metas sigue ahí', w.document.getElementById('panelMetas').textContent.includes('Metas del equipo'));
  w.mostrar(3);
  ok('el calendario de selección sigue pintando', w.document.getElementById('calMeses').innerHTML.length > 100);
  w.mostrar(1);
  ok('la lista de jornadas sigue ahí', w.document.getElementById('congelado').textContent.includes('Jornadas'));
  ok('no hubo alertas inesperadas', alertas.length === 0, alertas.join(' | '));
}

console.log('\n' + (fallos ? 'FALLARON ' + fallos + ' de ' + pruebas : 'Pasaron las ' + pruebas + ' pruebas'));
process.exit(fallos ? 1 : 0);
