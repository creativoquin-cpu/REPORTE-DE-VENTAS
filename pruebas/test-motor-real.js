// Validación del MOTOR con los dos Excel REALES de la carpeta (§17).
// No se inventan datos: se leen los archivos tal cual y se comparan los
// resultados contra los "Números de referencia" del documento maestro.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const XLSX = require('xlsx');

const BASE = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(BASE, 'quin-admin.html'), 'utf8');

const F_EFFI  = 'Reporte de conceptos de remisiones de venta 2026-07-12.xlsx';
const F_DROPI = 'ordenes_productos_20260712_111712.xlsx';

let fallos = 0, pruebas = 0;
function ok(nombre, cond, extra) {
  pruebas++;
  if (!cond) { fallos++; console.log('  FALLA  ' + nombre + (extra ? '  → ' + extra : '')); }
  else console.log('  ok     ' + nombre + (extra ? '  (' + extra + ')' : ''));
}

// lee un Excel igual que lo hace la página: primera hoja, defval null, fechas como Date.
// OJO: las fechas que crea Node NO son "instanceof Date" dentro de la página (son de
// otro mundo de JavaScript). En el navegador real sí lo son, así que aquí se vuelven a
// crear con el Date de la página; si no, el motor las vería como texto raro y las
// descartaría, y la prueba estaría midiendo un problema del arnés, no del programa.
function leer(archivo, w) {
  const libro = XLSX.read(fs.readFileSync(path.join(BASE, archivo)), { type: 'buffer', cellDates: true });
  const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { defval: null });
  if (w) filas.forEach(r => Object.keys(r).forEach(c => {
    if (r[c] instanceof Date) r[c] = new w.Date(r[c].getTime());
  }));
  return filas;
}

function arrancar(hoy) {
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true,
    beforeParse(w) {
      const Real = w.Date, fijo = new Real(hoy + 'T10:00:00');
      w.Date = new Proxy(Real, {
        construct(t, a) { return a.length ? new t(...a) : new t(fijo); },
        get(t, p) { return p === 'now' ? () => fijo.getTime() : t[p]; }
      });
      w.Chart = function () { this.destroy = () => {}; };
      w.XLSX = XLSX;
      w.alert = () => {};
      w.HTMLCanvasElement.prototype.getContext = function () {
        return { fillRect(){}, fillText(){}, measureText(){ return { width: 10 }; },
                 beginPath(){}, closePath(){}, moveTo(){}, lineTo(){}, arcTo(){}, fill(){},
                 stroke(){}, save(){}, restore(){}, setLineDash(){}, drawImage(){} };
      };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,X';
      w.Image = class { set src(v) { setTimeout(() => this.onload && this.onload(), 0); } };
    }
  });
  return dom.window;
}

// carga los dos archivos en la página y recalcula, como si el admin los hubiera subido
function cargarReales(w) {
  w.filasEffi  = leer(F_EFFI, w);
  w.filasDropi = leer(F_DROPI, w);
  w.construirFiltros();
  w.calcular();
  return w.ultimoCalculo;
}

const w = arrancar('2026-07-14');
const filasEffi = leer(F_EFFI, w), filasDropi = leer(F_DROPI, w);

console.log('\n=== 0. Los archivos se leen ===');
ok('el Excel de Effi tiene filas', filasEffi.length > 0, filasEffi.length + ' filas');
ok('el Excel de Dropi tiene filas', filasDropi.length > 0, filasDropi.length + ' filas');
ok('Effi trae las columnas que espera el motor',
   ['Vendedor', 'Fecha creación', 'Cantidad'].every(c => c in filasEffi[0]),
   Object.keys(filasEffi[0]).join(', '));
ok('Dropi trae las columnas que espera el motor',
   ['ESTATUS', 'FECHA', 'HORA'].every(c => c in filasDropi[0]),
   Object.keys(filasDropi[0]).slice(0, 14).join(', '));

const C = cargarReales(w);
const dias = Object.keys(C).sort();
const sum = (f) => dias.reduce((a, k) => a + f(C[k]), 0);

console.log('\n=== 1. Totales contra los números de referencia (§17) ===');
// El archivo trae 99 unidades. El motor descarta 1 del vendedor que viene apagado
// por defecto ("miguel angel angarita ariza"), así que lo contado es 98.
{
  const crudoEffi = filasEffi.reduce((a, r) => a + Number(r['Cantidad'] || 0), 0);
  ok('el archivo de Effi trae 99 unidades', crudoEffi === 99, String(crudoEffi));
  ok('el motor cuenta 98 (descarta 1 del vendedor apagado por defecto)',
     sum(v => v.propias) === 98, String(sum(v => v.propias)));
}
ok('DROPI suma 20 unidades (24 filas − 4 canceladas)',
   sum(v => v.dropi) === 20, String(sum(v => v.dropi)));
ok('el total combinado es 118', sum(v => v.propias + v.dropi) === 118,
   String(sum(v => v.propias + v.dropi)));

console.log('\n=== 2. EFFI también usa el corte de jornada ===');
// El archivo trae 9 unidades del sábado 11-jul entre las 02:00 y las 06:09, o sea
// ANTES del corte de las 7am del sábado: pertenecen a la jornada del viernes.
// Decidido por el dueño el 19-jul-2026 (corrige la decisión 1 de la bitácora).
ok('las 98 propias quedan en la jornada del viernes 2026-07-10',
   C['2026-07-10'] && C['2026-07-10'].propias === 98,
   C['2026-07-10'] ? String(C['2026-07-10'].propias) : 'no existe el día');
ok('el sábado no se queda con las de la madrugada',
   C['2026-07-11'] && C['2026-07-11'].propias === 0,
   C['2026-07-11'] ? String(C['2026-07-11'].propias) : 'no existe el día');
ok('ningún otro día tiene propias',
   dias.filter(k => k !== '2026-07-10' && C[k].propias > 0).length === 0,
   dias.filter(k => k !== '2026-07-10' && C[k].propias > 0).join(',') || 'ninguno');
{
  const ven = (C['2026-07-10'] || {}).ven || {};
  const top = Object.keys(ven).sort((a, b) => ven[b] - ven[a])[0];
  ok('la vendedora líder es Lucenith Quintero Leon con 24 (§17)',
     top === 'Lucenith Quintero Leon' && ven[top] === 24, top + ' = ' + ven[top]);
  ok('el vendedor apagado por defecto no aparece en el detalle',
     !('miguel angel angarita ariza' in ven));
  // "DROPI - ROCKETFY" viene como vendedor dentro del archivo de Effi. El dueño
  // confirmó (19-jul-2026) que es venta propia y no está duplicada en Dropi.
  ok('DROPI - ROCKETFY cuenta como venta propia (confirmado por el dueño)',
     ven['DROPI - ROCKETFY'] === 1, String(ven['DROPI - ROCKETFY']));
}

console.log('\n=== 3. DROPI día por día ===');
// crudo por día operativo: jue 09 → 1 · vie 10 → 11 · sáb 11 → 8 (el bloque sin repartir)
const crudo = { '2026-07-09': 1, '2026-07-10': 11, '2026-07-11': 8 };
Object.keys(crudo).forEach(k => {
  ok('Dropi crudo ' + k + ' = ' + crudo[k],
     C[k] && C[k].dropi === crudo[k], C[k] ? String(C[k].dropi) : 'no existe el día');
});

console.log('\n=== 3b. El reparto del fin de semana ===');
// OJO — segunda diferencia contra el §17, que esperaba 07-11 → 2, 07-12 → 3, 07-13 → 3.
// El motor solo arma días entre el primero y el último CON datos. Este archivo se
// exportó el domingo 12 a las 11am, así que el rango termina el sábado 11: el domingo
// y el lunes festivo todavía no existen y el bloque no se puede formar. Las 8 unidades
// del sábado se quedan en el sábado. Al cargar el archivo del lunes el bloque se arma
// y el reparto se corrige solo.
ok('el rango va del 09 al 11 de julio (hasta el último día con datos)',
   dias.join(',') === '2026-07-09,2026-07-10,2026-07-11', dias.join(','));
ok('el domingo 12 todavía no existe', !C['2026-07-12']);
ok('las 8 del sábado se quedan en el sábado mientras no exista el resto del bloque',
   C['2026-07-11'].repD === 8, String(C['2026-07-11'].repD));
ok('repartir no cambia el total del periodo',
   dias.reduce((a, k) => a + C[k].repD, 0) === dias.reduce((a, k) => a + C[k].dropi, 0));
ok('el sábado 11-jul se marca no laborable', !!C['2026-07-11'].motivo, String(C['2026-07-11'].motivo));
ok('el lunes 13-jul es festivo (Virgen de Chiquinquirá, Ley 2578 de 2026)',
   w.festivosColombia(2026)['2026-07-13'] === 'Virgen de Chiquinquirá',
   String(w.festivosColombia(2026)['2026-07-13']));

// y se comprueba que el reparto SÍ funciona cuando el bloque está completo
{
  const w2 = arrancar('2026-07-14');
  w2.filasEffi = [];
  w2.filasDropi = leer(F_DROPI, w2).concat([{
    FECHA: '14-07-2026', HORA: '10:00', ESTATUS: 'ENTREGADO', CANTIDAD: 1, TIENDA: 'Tiko'
  }]);
  w2.construirFiltros(); w2.calcular();
  const C2 = w2.ultimoCalculo;
  // 8 entre 3 días = 2 por día y el sobrante (2) al último → 2 / 2 / 4.
  // El §17 esperaba 2/3/3, pero eso es anterior a la decisión 6 de la bitácora
  // ("todo el sobrante al último día"), confirmada por el dueño.
  ok('con el bloque completo, el sábado reparte 2', C2['2026-07-11'].repD === 2, String(C2['2026-07-11'].repD));
  ok('el domingo recibe 2', C2['2026-07-12'].repD === 2, String(C2['2026-07-12'].repD));
  ok('el lunes festivo recibe 4 (base 2 + el sobrante)',
     C2['2026-07-13'].repD === 4, String(C2['2026-07-13'].repD));
  ok('el bloque repartido suma los 8 crudos',
     ['2026-07-11','2026-07-12','2026-07-13'].reduce((a,k)=>a+C2[k].repD,0) === 8);
}
{
  const tie = {};
  dias.forEach(k => Object.keys(C[k].tie || {}).forEach(t => { tie[t] = (tie[t] || 0) + C[k].tie[t]; }));
  const top = Object.keys(tie).sort((a, b) => tie[b] - tie[a])[0];
  ok('la tienda líder es Tiko con 9', top === 'Tiko' && tie[top] === 9, top + ' = ' + tie[top]);
}

console.log('\n=== 4. Combinado por día ===');
ok('10-jul combinado = 109 (98 propias + 11 Dropi)',
   C['2026-07-10'].propias + C['2026-07-10'].dropi === 109,
   String(C['2026-07-10'].propias + C['2026-07-10'].dropi));
ok('el último día con datos es 2026-07-11', dias[dias.length - 1] === '2026-07-11', dias[dias.length - 1]);
ok('11-jul combinado = 8 (solo Dropi)',
   C['2026-07-11'].propias + C['2026-07-11'].dropi === 8,
   String(C['2026-07-11'].propias + C['2026-07-11'].dropi));

console.log('\n=== 5. Los filtros salen solos de los archivos ===');
{
  const est = w.listaEstatus.map(x => x.valor);
  ok('la lista de estatus se armó sola', est.length > 0, est.join(', '));
  ok('aparece CANCELADO entre los estatus', est.indexOf('CANCELADO') !== -1);
  ok('CANCELADO viene desmarcado',
     w.listaEstatus.filter(x => x.valor === 'CANCELADO').every(x => !x.cuenta));
  const ven = w.listaVend.map(x => x.valor);
  ok('la lista de vendedores se armó sola', ven.length > 0, ven.length + ' vendedores');
  ok('aparece la vendedora líder en la lista', ven.indexOf('Lucenith Quintero Leon') !== -1);
}

console.log('\n=== 6. El desglose cuadra con el total (nada se pierde) ===');
dias.forEach(k => {
  const v = C[k];
  const sv = Object.keys(v.ven || {}).reduce((a, x) => a + v.ven[x], 0);
  const st = Object.keys(v.tie || {}).reduce((a, x) => a + v.tie[x], 0);
  ok('  ' + k + ': el detalle por vendedor suma las propias', sv === v.propias, sv + ' vs ' + v.propias);
  ok('  ' + k + ': el detalle por tienda suma el Dropi', st === v.dropi, st + ' vs ' + v.dropi);
});

console.log('\n=== 7. Los 19 festivos de 2026 ===');
{
  const esp = ['2026-01-01','2026-01-12','2026-03-23','2026-04-02','2026-04-03','2026-05-01',
               '2026-05-18','2026-06-08','2026-06-15','2026-06-29','2026-07-13','2026-07-20',
               '2026-08-07','2026-08-17','2026-10-12','2026-11-02','2026-11-16','2026-12-08','2026-12-25'];
  const R = w.festivosColombia(2026);          // { "2026-01-01": "Año Nuevo", ... }
  const hallados = Object.keys(R).sort();
  ok('son 19 festivos', hallados.length === 19, String(hallados.length));
  ok('coinciden uno por uno con la lista del documento',
     hallados.join(',') === esp.join(','),
     hallados.filter(x => esp.indexOf(x) === -1).join(',') || 'ninguno sobra');
}

console.log('\n=== 8. Bordes del turno (con los datos reales cargados) ===');
{
  // el corte es 8am entre semana y 7am el sábado
  // jornadaDe(año, mes, día, hora) devuelve el día operativo al que pertenece
  const casos = [
    ['sábado 11-jul 06:59 cae en el viernes', 2026, 7, 11, 6.983, '2026-07-10'],
    ['sábado 11-jul 07:01 es ya el sábado',   2026, 7, 11, 7.017, '2026-07-11'],
    ['domingo 12-jul 07:59 cuenta como sábado', 2026, 7, 12, 7.983, '2026-07-11'],
    ['martes 14-jul 08:01 es su propio día',  2026, 7, 14, 8.017, '2026-07-14'],
    ['martes 14-jul 07:59 cuenta como el lunes', 2026, 7, 14, 7.983, '2026-07-13']
  ];
  casos.forEach(c => {
    const k = w.jornadaDe(c[1], c[2], c[3], c[4]);
    ok(c[0], k === c[5], k);
  });
}

console.log('\n=== 9. La fecha de Effi, en todos los formatos ===');
{
  const casos = [
    ['fecha como Date, 2am del sábado → viernes', new w.Date(2026, 6, 11, 2, 0), '2026-07-10'],
    ['fecha como Date, 8am del sábado → sábado',  new w.Date(2026, 6, 11, 8, 0), '2026-07-11'],
    ['texto AAAA-MM-DD con hora de madrugada',   '2026-07-11 02:00:28', '2026-07-10'],
    ['texto AAAA-MM-DD con hora de la tarde',    '2026-07-11 15:20:00', '2026-07-11'],
    ['texto DD/MM/AAAA con hora de madrugada',   '11/07/2026 03:15',    '2026-07-10'],
    ['texto sin hora se queda en su día',        '2026-07-11',          '2026-07-11'],
    ['martes 07:59 → lunes',                     '2026-07-14 07:59:00', '2026-07-13'],
    ['martes 08:01 → martes',                    '2026-07-14 08:01:00', '2026-07-14'],
    ['celda vacía no rompe',                      null,                  null]
  ];
  casos.forEach(c => ok(c[0], w.fechaEffi(c[1]) === c[2], String(w.fechaEffi(c[1]))));
}

console.log(fallos ? '\nFALLARON ' + fallos + ' de ' + pruebas : '\nPasaron las ' + pruebas + ' pruebas');
process.exit(fallos ? 1 : 0);
