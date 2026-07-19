// Prueba del Paso 14 — metas editables con historial sellado por día
const fs = require('fs');
const { JSDOM } = require('/tmp/node_modules/jsdom');

const HTML = fs.readFileSync('/sessions/zen-laughing-fermi/mnt/REPORTE DE VENTAS/quin-admin.html', 'utf8');

let fallos = 0, pruebas = 0;
function ok(nombre, cond, extra) {
  pruebas++;
  if (!cond) { fallos++; console.log('  FALLA  ' + nombre + (extra ? '  → ' + extra : '')); }
  else console.log('  ok     ' + nombre + (extra ? '  (' + extra + ')' : ''));
}

// ---- Chart.js falso: guarda lo que se le pide dibujar -------------------
const graficas = {};
function ChartFalso(el, cfg) {
  graficas[el.id] = cfg;
  this.destroy = () => {};
}

function arrancar(estado) {
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    beforeParse(w) {
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

function jornada(p, d) {
  return { oficial: { p, d, ven: { 'Ana': p }, tie: { 'TiendaX': d } }, cerrada: '01-jul-2026 08:00', fotos: [] };
}

console.log('\n=== 1. Meta por defecto cuando no hay historial ===');
{
  const w = arrancar({});
  ok('meta de hoy = 200/160', w.metaHoy().total === 200 && w.metaHoy().propias === 160,
     w.metaHoy().total + '/' + w.metaHoy().propias);
  ok('un día viejo también da 200', w.metaEn('2020-03-05').total === 200);
  ok('el panel dice que usa valores de arranque',
     w.document.getElementById('panelMetas').textContent.includes('valores de arranque'));
}

console.log('\n=== 2. Un cambio de meta a mitad de mes: los días pasados conservan la suya ===');
{
  const w = arrancar({ 'quin.metas': [
    { id: 1, desde: '2026-07-16', total: 240, propias: 180, cuando: '16-jul-2026 09:00', quien: 'Administrador' }
  ]});
  ok('14-jul conserva 200/160', w.metaEn('2026-07-14').total === 200 && w.metaEn('2026-07-14').propias === 160,
     w.metaEn('2026-07-14').total + '/' + w.metaEn('2026-07-14').propias);
  ok('15-jul (día antes) sigue en 200', w.metaEn('2026-07-15').total === 200);
  ok('16-jul (el mismo día) ya es 240', w.metaEn('2026-07-16').total === 240 && w.metaEn('2026-07-16').propias === 180);
  ok('17-jul en adelante es 240', w.metaEn('2026-07-31').total === 240);
}

console.log('\n=== 3. Varios cambios encadenados y meta programada al futuro ===');
{
  const w = arrancar({ 'quin.metas': [
    { id: 3, desde: '2026-08-01', total: 260, propias: 200, cuando: '18-jul-2026', quien: 'Administrador' },
    { id: 1, desde: '2026-02-01', total: 180, propias: 140, cuando: '01-feb-2026', quien: 'Administrador' },
    { id: 2, desde: '2026-07-16', total: 240, propias: 180, cuando: '16-jul-2026', quien: 'Administrador' }
  ]});
  ok('enero conserva 200 (antes del primer cambio)', w.metaEn('2026-01-20').total === 200);
  ok('febrero a julio-15 → 180', w.metaEn('2026-02-01').total === 180 && w.metaEn('2026-07-15').total === 180);
  ok('julio-16 a julio-31 → 240', w.metaEn('2026-07-16').total === 240 && w.metaEn('2026-07-31').total === 240);
  ok('agosto → 260', w.metaEn('2026-08-05').total === 260);
  const t = w.document.getElementById('panelMetas').textContent;
  ok('la de agosto sale marcada como programada', t.includes('programada'));
  ok('la de julio sale marcada como vigente', t.includes('vigente'));
  ok('hay botón Quitar solo para la programada',
     w.document.querySelectorAll('.metaQuitar').length === 1,
     w.document.querySelectorAll('.metaQuitar').length + ' botones');
}

console.log('\n=== 4. Dos metas con la misma fecha: manda la registrada después, la vieja queda como traza ===');
{
  const w = arrancar({ 'quin.metas': [
    { id: 10, desde: '2026-07-01', total: 220, propias: 170, cuando: '01-jul-2026 08:00', quien: 'Administrador' },
    { id: 20, desde: '2026-07-01', total: 210, propias: 165, cuando: '02-jul-2026 10:00', quien: 'Administrador' }
  ]});
  ok('vale la última registrada (210)', w.metaEn('2026-07-05').total === 210, 'da ' + w.metaEn('2026-07-05').total);
  const t = w.document.getElementById('panelMetas').textContent;
  ok('la anterior queda visible como reemplazada', t.includes('reemplazada'));
  ok('el historial muestra las dos filas',
     w.document.querySelectorAll('#panelMetas tbody tr').length === 2,
     w.document.querySelectorAll('#panelMetas tbody tr').length + ' filas');
}

console.log('\n=== 5. Guardar una meta desde la pantalla ===');
{
  const w = arrancar({});
  w.document.getElementById('metaT').value = '250';
  w.document.getElementById('metaP').value = '190';
  w.document.getElementById('metaD').value = '2026-07-20';
  w.document.getElementById('metaGuardar').click();
  const g = JSON.parse(w.localStorage.getItem('quin.metas'));
  ok('quedó guardada en el navegador', g && g.length === 1 && g[0].total === 250 && g[0].propias === 190);
  ok('guarda cuándo y quién', !!g[0].cuando && g[0].quien === 'Administrador', g[0].cuando + ' · ' + g[0].quien);
  ok('19-jul conserva 200', w.metaEn('2026-07-19').total === 200);
  ok('20-jul ya es 250', w.metaEn('2026-07-20').total === 250);
  ok('el panel se repintó con la meta nueva',
     w.document.getElementById('panelMetas').textContent.includes('250'));

  // segundo cambio: la traza no se pierde
  w.document.getElementById('metaT').value = '230';
  w.document.getElementById('metaP').value = '180';
  w.document.getElementById('metaD').value = '2026-07-25';
  w.document.getElementById('metaGuardar').click();
  const g2 = JSON.parse(w.localStorage.getItem('quin.metas'));
  ok('ahora hay dos filas de historial', g2.length === 2, g2.length + ' filas');
  ok('20 a 24-jul siguen en 250', w.metaEn('2026-07-24').total === 250);
  ok('25-jul en adelante 230', w.metaEn('2026-07-25').total === 230);
  ok('el historial describe el cambio 250 → 230',
     w.document.getElementById('panelMetas').textContent.includes('250 → 230'));
}

console.log('\n=== 6. Validaciones al guardar ===');
{
  const w = arrancar({});
  function intentar(t, p, d) {
    w.document.getElementById('metaT').value = t;
    w.document.getElementById('metaP').value = p;
    w.document.getElementById('metaD').value = d;
    w.document.getElementById('metaGuardar').click();
    return w.document.getElementById('metaAviso').textContent;
  }
  ok('propias mayor que total se rechaza', intentar('200', '250', '2026-07-20').includes('no puede ser mayor'));
  ok('total en cero se rechaza', intentar('0', '10', '2026-07-20').includes('mayor que cero'));
  ok('sin fecha se rechaza', intentar('200', '160', '').includes('Falta la fecha'));
  ok('nada se guardó con los intentos malos', w.localStorage.getItem('quin.metas') === null ||
     JSON.parse(w.localStorage.getItem('quin.metas')).length === 0);
  ok('guardar la misma meta que ya rige se rechaza', intentar('200', '160', '2026-07-20').includes('No hay nada que cambiar'));
}

console.log('\n=== 7. Quitar una meta programada ===');
{
  const w = arrancar({ 'quin.metas': [
    { id: 7, desde: '2027-01-01', total: 300, propias: 240, cuando: '18-jul-2026', quien: 'Administrador' }
  ]});
  ok('antes de quitarla, 2027 da 300', w.metaEn('2027-02-01').total === 300);
  w.document.querySelector('.metaQuitar').click();
  ok('después de quitarla, 2027 vuelve a 200', w.metaEn('2027-02-01').total === 200);
  ok('el historial quedó vacío', JSON.parse(w.localStorage.getItem('quin.metas')).length === 0);
}

console.log('\n=== 8. El tablero cuenta los días en meta con la meta de cada día ===');
{
  // julio: 13,14,15 con 190 (meta 200 → no cumplen)  ·  16,17 con 210 (meta 240 → no cumplen)
  const w = arrancar({
    'quin.jornadas': {
      '2026-07-13': jornada(120, 70),   // 190
      '2026-07-14': jornada(130, 80),   // 210
      '2026-07-15': jornada(140, 60),   // 200
      '2026-07-16': jornada(150, 90),   // 240
      '2026-07-17': jornada(160, 90)    // 250
    },
    'quin.metas': [
      { id: 1, desde: '2026-07-16', total: 240, propias: 150, cuando: '16-jul-2026', quien: 'Administrador' }
    ]
  });
  w.document.getElementById('incBos').checked = false;
  w.mostrar(2);
  const txt = w.document.getElementById('contenido').textContent;
  // con meta 200 hasta el 15: cumplen 14 (210) y 15 (200) = 2
  // con meta 240 desde el 16: cumplen 16 (240) y 17 (250) = 2  → total 4
  ok('días en meta total = 4 de 5', /Días en meta total\s*4\s*de 5/.test(txt.replace(/([a-z0-9áéíóú])([A-ZÁÉÍÓÚ])/g,'$1 $2').replace(/(\d)(de |prendas|D[ií]as)/g,'$1 $2').replace(/\s+/g,' ')),
     (txt.replace(/\s+/g,' ').match(/Días en meta total.{0,30}/) || [''])[0]);
  ok('la leyenda muestra el rango de meta 200–240', txt.includes('Meta 200–240'));
  // propias: meta 160 hasta el 15 (120 no, 130 no, 140 no), meta 150 desde el 16 (150 sí, 160 sí) = 2
  ok('días en meta propias = 2 de 5', /Días en meta propias\s*2\s*de 5/.test(txt.replace(/(\d)(de )/g,'$1 $2').replace(/\s+/g,' ')),
     (txt.replace(/\s+/g,' ').match(/Días en meta propias.{0,30}/) || [''])[0]);
  ok('el total del mes sigue cuadrando (1090)', txt.replace(/\s+/g,' ').includes('Total del mes1090'),
     (txt.replace(/\s+/g,' ').match(/Total del mes.{0,20}/) || [''])[0]);
}

console.log('\n=== 9. Meta constante: se comporta como antes ===');
{
  const w = arrancar({
    'quin.jornadas': {
      '2026-06-10': jornada(150, 60),   // 210 cumple
      '2026-06-11': jornada(100, 50)    // 150 no
    }
  });
  w.document.getElementById('incBos').checked = false;
  w.mostrar(2);
  const txt = w.document.getElementById('contenido').textContent.replace(/\s+/g, ' ');
  ok('días en meta total = 1 de 2', /Días en meta total1de 2/.test(txt));
  ok('la leyenda dice Meta 200 (sin rango)', txt.includes('Meta 200') && !txt.includes('Meta 200–'));
}

console.log('\n=== 10. Las gráficas reciben la meta de cada día ===');
{
  const w = arrancar({
    'quin.jornadas': {
      '2026-07-14': jornada(100, 50),
      '2026-07-16': jornada(120, 60),
      '2026-07-17': jornada(130, 60)
    },
    'quin.metas': [
      { id: 1, desde: '2026-07-16', total: 240, propias: 180, cuando: '16-jul-2026', quien: 'Administrador' }
    ]
  });
  w.document.getElementById('incBos').checked = false;
  w.mostrar(2);
  ok('se dibujaron las dos gráficas', !!graficas.gReal && !!graficas.gRep);
  const yMax = graficas.gReal.options.scales.y.suggestedMax;
  ok('el eje sube hasta la meta más alta (240)', yMax === 240, 'suggestedMax = ' + yMax);
  const pie = graficas.gReal.options.plugins.tooltip.callbacks.footer([{ dataIndex: 0 }]);
  ok('el tooltip del 14-jul compara contra 200', pie.includes('meta 200') && pie.includes('faltan 50'), pie);
  const pie2 = graficas.gReal.options.plugins.tooltip.callbacks.footer([{ dataIndex: 2 }]);
  ok('el tooltip del 17-jul compara contra 240', pie2.includes('meta 240') && pie2.includes('faltan 50'), pie2);
}

console.log('\n=== 11. Nada de lo viejo se rompió (jornadas y comparativo) ===');
{
  const w = arrancar({
    'quin.jornadas': {
      '2026-05-10': jornada(100, 20),
      '2026-06-10': jornada(200, 40),
      '2026-06-11': jornada(180, 20)
    },
    'quin.metas': [{ id: 1, desde: '2026-06-01', total: 250, propias: 200, cuando: 'x', quien: 'Administrador' }]
  });
  w.mostrar(4);
  const cmp = w.document.getElementById('cmpContenido').textContent.replace(/\s+/g, ' ');
  ok('comparativo: mayo 120', cmp.includes('120'));
  ok('comparativo: junio 440', cmp.includes('440'));
  w.mostrar(3);
  ok('el calendario de selección pinta', w.document.getElementById('calMeses').innerHTML.length > 100);
  w.mostrar(1);
  ok('la pestaña 1 sigue mostrando Jornadas', w.document.getElementById('congelado').textContent.includes('Jornadas'));
  ok('el panel de metas vive en la pestaña 1', w.document.getElementById('panelMetas').textContent.includes('Metas del equipo'));
}

console.log('\n' + (fallos ? 'FALLARON ' + fallos + ' de ' + pruebas : 'Pasaron las ' + pruebas + ' pruebas'));
process.exit(fallos ? 1 : 0);
