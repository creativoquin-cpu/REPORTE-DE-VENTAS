// Prueba del Paso 6 del plan — vista del vendedor (pestaña 5)
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
function ChartFalso(el, cfg) { graficas[el.id] = cfg; this.destroy = () => {}; }

function arrancar(estado, hoy) {
  Object.keys(graficas).forEach(k => delete graficas[k]);
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
      w.Chart = ChartFalso;
      w.XLSX = { read: () => ({}), utils: {} };
      w.confirm = () => true;
      w.HTMLCanvasElement.prototype.getContext = () => ({
        save(){}, restore(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, fillText(){},
        setLineDash(){}, measureText(){ return { width: 10 }; }
      });
      Object.keys(estado || {}).forEach(k => w.localStorage.setItem(k, JSON.stringify(estado[k])));
    }
  });
  return dom.window;
}

// jornada con detalle por vendedor (Effi) y por tienda (Dropi)
function jor(ven, tie) {
  const p = Object.values(ven).reduce((a, b) => a + b, 0);
  const d = Object.values(tie).reduce((a, b) => a + b, 0);
  return { oficial: { p, d, ven, tie }, cerrada: 'x', fotos: [] };
}
function texto(w) { return w.document.getElementById('vendContenido').textContent.replace(/\s+/g, ' '); }

// Julio 2026. 13=lunes, 14=martes, 15=miércoles, 16=jueves, 17=viernes, 18=sábado, 19=domingo
const JUL = {
  '2026-07-13': jor({ Ana: 100, Beto: 60, Caro: 40 }, { TiendaX: 30 }),   // propias 200
  '2026-07-14': jor({ Ana: 90,  Beto: 70, Caro: 30 }, { TiendaX: 20 }),   // propias 190
  '2026-07-15': jor({ Ana: 80,  Beto: 50, Caro: 20 }, { TiendaX: 10 }),   // propias 150
  '2026-07-18': jor({ Ana: 41,  Beto: 20, Caro: 10 }, { TiendaX: 5 }),    // sábado, propias 71
  '2026-07-19': jor({ Ana: 9,   Beto: 10, Caro: 5  }, { TiendaX: 5 })     // domingo, propias 24
};

console.log('\n=== 1. Arranque de la vista ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(5);
  ok('no existe filtro por vendedor', w.document.querySelectorAll('#vista5 select').length === 0,
     w.document.querySelectorAll('#vista5 select').length + ' selectores');
  ok('avisa que está bloqueado al mes en curso y a cifras del equipo',
     w.document.getElementById('vendMes').textContent.includes('julio 2026') &&
     w.document.getElementById('vendMes').textContent.includes('solo cifras del equipo'));
}

console.log('\n=== 2. Cómo va el equipo ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(5);
  const t = texto(w);
  // propias: 200+190+150+71+24 = 635 en 5 días → promedio 127
  ok('prendas propias del equipo = 635', t.includes('Prendas propias del equipo635'),
     (t.match(/Prendas propias del equipo.{0,10}/) || [''])[0]);
  ok('promedio del equipo = 127', t.includes('Promedio por día127'),
     (t.match(/Promedio por día.{0,8}/) || [''])[0]);
  // meta 160: 200 sí, 190 sí, 150 no, sáb/dom repartidos 47 y 48 no → 2 de 5
  ok('días en meta = 2 de 5', t.includes('Días en meta2') && t.includes('de 5 días'),
     (t.match(/Días en meta.{0,12}/) || [''])[0]);
  ok('mejor día del equipo = 200 el 13-jul', t.includes('Mejor día del equipo200'),
     (t.match(/Mejor día del equipo.{0,20}/) || [''])[0]);
}

console.log('\n=== 3. El fin de semana se ve repartido ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(5);
  const eq = graficas.gEquipo.data.datasets[0].data;
  // bloque sáb+dom: 71+24 = 95 → 47 y 48 (sobrante al último día)
  ok('lunes a miércoles quedan sin repartir', eq[0] === 200 && eq[1] === 190 && eq[2] === 150, eq.join(','));
  ok('el bloque sáb+dom se reparte en 47 y 48', eq[3] === 47 && eq[4] === 48, eq[3] + ',' + eq[4]);
  ok('repartir no cambia el total', eq.reduce((a, b) => a + b, 0) === 635,
     String(eq.reduce((a, b) => a + b, 0)));
}

console.log('\n=== 4. El ranking no muestra cifras, y ya no hay gráfica de comparación ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(5);
  ok('no se dibuja ninguna gráfica de vendedores', !graficas.gVs);
  ok('solo se dibuja la del equipo', !!graficas.gEquipo);
  const t = texto(w);
  ok('no queda rastro del bloque de comparación', !t.includes('Cómo van los vendedores'));
  ok('la tabla del ranking no tiene columna de prendas', !t.includes('# Vendedor Prendas'));
  ok('salen los tres nombres con su puesto', t.includes('Ana') && t.includes('Beto') && t.includes('Caro'));
  ok('la cifra de Ana (320) no aparece', !t.includes('320'));
  ok('la cifra de Beto (210) no aparece', !t.includes('210'));
  ok('la cifra de Caro (105) no aparece', !t.includes('105'));
}

console.log('\n=== 5. Meta del equipo con historial de metas ===');
{
  const w = arrancar({
    'quin.jornadas': JUL,
    'quin.metas': [{ id: 1, desde: '2026-07-15', total: 240, propias: 100, cuando: 'x', quien: 'Administrador' }]
  }, '2026-07-20');
  w.mostrar(5);
  const t = texto(w);
  ok('lo dice con todas las letras', t.includes('No hay meta individual'));
  // meta propias: 160 el 13 y 14; 100 desde el 15 → 200 sí, 190 sí, 150 sí, 47 no, 48 no
  ok('días en meta = 3 de 5', t.includes('Días en meta3'), (t.match(/Días en meta.{0,12}/) || [''])[0]);
  const pie = graficas.gEquipo.options.plugins.tooltip.callbacks.footer([{ dataIndex: 3 }]);
  ok('el tooltip del sábado usa la meta de ese día', pie === 'Meta del equipo 100 (faltan 53)', pie);
  ok('el eje sube hasta la meta más alta',
     graficas.gEquipo.options.scales.y.suggestedMax === 160,
     String(graficas.gEquipo.options.scales.y.suggestedMax));
}

console.log('\n=== 6. Lo que el vendedor NO puede ver ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(5);
  const t = texto(w);
  ok('no ve nada de Dropi', !t.includes('Dropi'));
  ok('no ve tiendas', !t.toLowerCase().includes('tienda'));
  ok('no ve el total Effi + Dropi', !t.includes('Total del mes'));
  ok('no ve el resumen del mes del administrador', !t.includes('Resumen del mes'));
  ok('no ve la gráfica de ventas reales sin repartir', !t.includes('Ventas reales'));
  ok('no ve comparativos entre meses', !t.includes('Mes a mes') && !t.includes('Evolución'));
  ok('no hay ningún botón ni selector en su vista',
     w.document.querySelectorAll('#vista5 button, #vista5 select, #vista5 input').length === 0);
  ok('solo se dibuja la gráfica del equipo', !!graficas.gEquipo && !graficas.gVs);
}

console.log('\n=== 7. Días sin cerrar y meses sin datos ===');
{
  const w = arrancar({}, '2026-07-20');
  w.ultimoCalculo = {
    '2026-07-13': { propias: 100, dropi: 20, ven: { Ana: 100 }, tie: { T: 20 } },
    '2026-07-14': { propias: 80,  dropi: 10, ven: { Ana: 80 },  tie: { T: 10 } }
  };
  w.mostrar(5);
  const t = texto(w);
  ok('con solo bosquejo igual muestra algo', t.includes('Prendas propias del equipo180'),
     (t.match(/Prendas propias del equipo.{0,10}/) || [''])[0]);
  ok('avisa que hay días sin cerrar', t.includes('2 días') && t.includes('no cierra el administrador'));

  const w2 = arrancar({ 'quin.jornadas': JUL }, '2026-09-05');
  w2.mostrar(5);
  ok('si el mes en curso no tiene ventas, lo dice sin romperse',
     texto(w2).includes('Todavía no hay ventas de este mes'));
  ok('y no muestra las de julio', !texto(w2).includes('Prendas propias del equipo'));
}

console.log('\n=== 8. Nada de lo anterior se rompió ===');
{
  const w = arrancar({ 'quin.jornadas': JUL }, '2026-07-20');
  w.mostrar(2);
  const tab = w.document.getElementById('contenido').textContent.replace(/\s+/g, ' ');
  // julio: propias 635 + dropi 70 = 705
  ok('el tablero del admin sigue dando 705', tab.includes('Total del mes705'),
     (tab.match(/Total del mes.{0,10}/) || [''])[0]);
  ok('el admin sí ve Dropi', tab.includes('Dropi'));
  w.mostrar(1);
  ok('la pestaña 1 sigue completa',
     w.document.getElementById('congelado').textContent.includes('Jornadas') &&
     w.document.getElementById('panelMetas').textContent.includes('Metas del equipo') &&
     w.document.getElementById('panelCierre').textContent.includes('Cierre mensual'));
  w.mostrar(3);
  ok('el calendario sigue pintando', w.document.getElementById('calMeses').innerHTML.length > 100);
  w.mostrar(4);
  ok('el comparativo sigue pintando', w.document.getElementById('cmpContenido').textContent.includes('Mes a mes'));
  w.mostrar(5);
  ok('la pestaña 5 queda marcada como activa', w.document.getElementById('tab5').className === 'on');
  ok('las otras pestañas quedan ocultas',
     w.document.getElementById('vista1').style.display === 'none' &&
     w.document.getElementById('vista5').style.display === '');
}

console.log('\n' + (fallos ? 'FALLARON ' + fallos + ' de ' + pruebas : 'Pasaron las ' + pruebas + ' pruebas'));
process.exit(fallos ? 1 : 0);
