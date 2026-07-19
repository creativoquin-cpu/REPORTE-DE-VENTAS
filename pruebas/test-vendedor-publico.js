// Prueba del paso 9.3 — página pública del equipo (index.html) y el
// ranking público que arma quin-admin.html para alimentarla.
//
// La idea central: index.html repite (no comparte) las reglas de cálculo
// de la pestaña "Vista del vendedor" de quin-admin.html, porque son dos
// archivos sueltos sin build. Esta prueba toma el MISMO mes de datos y
// comprueba que las dos páginas den exactamente los mismos números —
// así, si algún día se cambia una regla en un lado y no en el otro, la
// prueba avisa en vez de dejarlas desincronizadas en silencio.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const HTML_ADMIN = fs.readFileSync(require('path').join(__dirname, '..', 'quin-admin.html'), 'utf8');
const HTML_PUB   = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');

let fallos = 0, pruebas = 0;
function ok(nombre, cond, extra) {
  pruebas++;
  if (!cond) { fallos++; console.log('  FALLA  ' + nombre + (extra ? '  → ' + extra : '')); }
  else console.log('  ok     ' + nombre + (extra ? '  (' + extra + ')' : ''));
}

const graficas = {};
function ChartFalso(el, cfg) { graficas[el.id] = cfg; this.destroy = () => {}; }

function arrancar(html, hoy, antesDeUsar) {
  Object.keys(graficas).forEach(k => delete graficas[k]);
  const dom = new JSDOM(html, {
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
      if (antesDeUsar) antesDeUsar(w);
    }
  });
  return dom.window;
}

// jornada con detalle por vendedor (Effi) y por tienda (Dropi) — formato admin
function jor(ven, tie) {
  const p = Object.values(ven).reduce((a, b) => a + b, 0);
  const d = Object.values(tie).reduce((a, b) => a + b, 0);
  return { oficial: { p, d, ven, tie }, cerrada: 'x', fotos: [] };
}
function texto(w) { return w.document.getElementById('vendContenido').textContent.replace(/\s+/g, ' '); }

// Julio 2026, mismo mes que pruebas/test-vendedor.js.
// 13=lunes, 14=martes, 15=miércoles, 18=sábado, 19=domingo
const JUL = {
  '2026-07-13': jor({ Ana: 100, Beto: 60, Caro: 40 }, { TiendaX: 30 }),   // propias 200
  '2026-07-14': jor({ Ana: 90,  Beto: 70, Caro: 30 }, { TiendaX: 20 }),   // propias 190
  '2026-07-15': jor({ Ana: 80,  Beto: 50, Caro: 20 }, { TiendaX: 10 }),   // propias 150
  '2026-07-18': jor({ Ana: 41,  Beto: 20, Caro: 10 }, { TiendaX: 5 }),    // sábado, propias 71
  '2026-07-19': jor({ Ana: 9,   Beto: 10, Caro: 5  }, { TiendaX: 5 })     // domingo, propias 24
};
// Lo mismo, pero como lo vería un visitante sin sesión (solo fecha/propias/cerrada).
const JUL_PUBLICO = {};
Object.keys(JUL).forEach(k => { JUL_PUBLICO[k] = { p: JUL[k].oficial.p, cerrada: true }; });

console.log('\n=== 1. quin-admin.html arma bien el ranking público (sin cifras) ===');
let rankingCalculado;
{
  const w = arrancar(HTML_ADMIN, '2026-07-20', ww => {
    ww.localStorage.setItem('quin.jornadas', JSON.stringify(JUL));
  });
  rankingCalculado = w.filasRankingPublico('2026-07-13'.slice(0, 7));
  ok('hay tres puestos', rankingCalculado.length === 3, rankingCalculado.length);
  ok('puesto 1 es Ana (320)', rankingCalculado[0].nombre === 'Ana' && rankingCalculado[0].puesto === 1);
  ok('puesto 2 es Beto (210)', rankingCalculado[1].nombre === 'Beto' && rankingCalculado[1].puesto === 2);
  ok('puesto 3 es Caro (105)', rankingCalculado[2].nombre === 'Caro' && rankingCalculado[2].puesto === 3);
  ok('ninguna fila trae una cifra de ventas', rankingCalculado.every(x => Object.keys(x).sort().join(',') === 'mes,nombre,puesto'),
     JSON.stringify(rankingCalculado[0]));
  ok('el mes queda marcado', rankingCalculado.every(x => x.mes === '2026-07'));
}

console.log('\n=== 2. index.html, alimentada con esos mismos datos, pinta lo mismo que el administrador ===');
{
  // Lo que la pestaña 5 del administrador muestra con el JUL de siempre:
  const wAdmin = arrancar(HTML_ADMIN, '2026-07-20', ww => {
    ww.localStorage.setItem('quin.jornadas', JSON.stringify(JUL));
  });
  wAdmin.mostrar(5);
  const tAdmin = texto(wAdmin);
  const eqAdmin = graficas.gEquipo.data.datasets[0].data.slice();

  // Lo mismo, del lado público: solo lo que un visitante puede leer.
  // Los datos se asignan DESPUÉS de arrancar (no en beforeParse): el propio
  // script de index.html declara "var jornadas = {}" al cargar, así que
  // asignarlo antes quedaría pisado apenas corre ese script.
  const wPub = arrancar(HTML_PUB, '2026-07-20');
  wPub.jornadas = JUL_PUBLICO;
  wPub.metas = [];
  wPub.diasManuales = {};
  wPub.rankingMes = rankingCalculado.map(x => ({ puesto: x.puesto, nombre: x.nombre }));
  wPub.pintarVendedorPublico();
  const tPub = texto(wPub);
  const eqPub = graficas.gEquipo.data.datasets[0].data.slice();

  ok('prendas propias del equipo = 635 en las dos páginas',
     tAdmin.includes('Prendas propias del equipo635') && tPub.includes('Prendas propias del equipo635'));
  ok('promedio por día = 127 en las dos páginas',
     tAdmin.includes('Promedio por día127') && tPub.includes('Promedio por día127'));
  ok('días en meta = 2 de 5 en las dos páginas',
     tAdmin.includes('Días en meta2') && tPub.includes('Días en meta2'));
  ok('mejor día del equipo = 200 en las dos páginas',
     tAdmin.includes('Mejor día del equipo200') && tPub.includes('Mejor día del equipo200'));
  ok('el reparto de fin de semana da exactamente igual en el gráfico',
     JSON.stringify(eqAdmin) === JSON.stringify(eqPub), eqAdmin.join(',') + ' vs ' + eqPub.join(','));
  ok('index.html también muestra los tres nombres', tPub.includes('Ana') && tPub.includes('Beto') && tPub.includes('Caro'));
  ok('index.html nunca muestra la cifra de Ana (320)', !tPub.includes('320'));
  ok('index.html nunca muestra la cifra de Beto (210)', !tPub.includes('210'));
  ok('index.html le pide a jornadas fecha, propias, cerrada y actualizado — nunca ven/tie con select("*")',
     HTML_PUB.includes('from("jornadas").select("fecha,propias,cerrada,actualizado")') &&
     !HTML_PUB.includes('from("jornadas").select("*")'));
}

console.log('\n=== 3. index.html sin ninguna venta cargada este mes ===');
{
  const w = arrancar(HTML_PUB, '2026-07-20');
  w.jornadas = {}; w.metas = []; w.diasManuales = {}; w.rankingMes = [];
  w.pintarVendedorPublico();
  ok('avisa que todavía no hay ventas cargadas',
     texto(w).includes('Todavía no hay ventas cargadas este mes'));
  ok('no revienta intentando dibujar el gráfico', !graficas.gEquipo);
}

console.log('\n=== 4. paso 9.6 — el bosquejo (Excel subido, sin cerrar) también sube a la nube ===');
{
  // 13 y 14 ya están cerrados oficialmente. El 15 se acaba de cargar en un
  // Excel pero todavía nadie lo cerró — así se ve un mes a mitad de camino.
  const CERRADAS = { '2026-07-13': JUL['2026-07-13'], '2026-07-14': JUL['2026-07-14'] };
  const BOSQUEJO = { '2026-07-15': { propias: 150, dropi: 10, ven: { Ana: 80, Beto: 50, Caro: 20 }, tie: { TiendaX: 10 } } };

  const w = arrancar(HTML_ADMIN, '2026-07-20', ww => {
    ww.localStorage.setItem('quin.jornadas', JSON.stringify(CERRADAS));
  });
  // filasRankingPublico() lee "ultimoCalculo" (variable global del script, la
  // llena cargarExcels() de verdad); acá se asigna a mano después de arrancar
  // por la misma razón de siempre: el propio script la declara "var ultimoCalculo = {}".
  w.ultimoCalculo = BOSQUEJO;
  const filas = w.filasDeBosquejo(BOSQUEJO);
  ok('el día sin cerrar arma su fila para subir', filas['2026-07-15'] && filas['2026-07-15'].cerrada === false,
     JSON.stringify(filas));
  ok('esa fila trae la fecha como propia (no la del objeto)', filas['2026-07-15'].fecha === '2026-07-15');

  // Si ese mismo día YA está cerrado, el bosquejo no lo debe pisar.
  const filasConCerrado = w.filasDeBosquejo(Object.assign({}, BOSQUEJO, {
    '2026-07-13': { propias: 999, dropi: 999, ven: {}, tie: {} }
  }));
  ok('un día ya cerrado no se manda como bosquejo (no lo pisa)', !filasConCerrado['2026-07-13'],
     JSON.stringify(Object.keys(filasConCerrado)));

  const ranking = w.filasRankingPublico('2026-07');
  ok('el ranking público suma también lo que trae el bosquejo (Ana pasa de 190 a 270)',
     ranking[0].nombre === 'Ana', JSON.stringify(ranking));
  // Ana cerrada: 100+90=190. Con el bosquejo del 15 (80 más): 270. Sigue siendo la 1.

  // Del lado de index.html: un mes con 2 días cerrados y 1 sin cerrar.
  const wPub = arrancar(HTML_PUB, '2026-07-20');
  wPub.jornadas = {
    '2026-07-13': { p: 200, cerrada: true, actualizado: '2026-07-13T09:00:00.000Z' },
    '2026-07-14': { p: 190, cerrada: true, actualizado: '2026-07-14T09:00:00.000Z' },
    '2026-07-15': { p: 150, cerrada: false, actualizado: '2026-07-20T08:30:00.000Z' }
  };
  wPub.metas = []; wPub.diasManuales = {}; wPub.rankingMes = [];
  wPub.pintarVendedorPublico();
  const tPub = texto(wPub);
  ok('avisa que hay 1 día sin cerrar', tPub.includes('Hay 1 día que todavía no cierra el administrador'), tPub.slice(0,200));
  ok('el aviso dice cuándo se subió por última vez', tPub.includes('Subidas por última vez'));
  ok('el total del equipo SÍ incluye el bosquejo (200+190+150=540)', tPub.includes('Prendas propias del equipo540'),
     (tPub.match(/Prendas propias del equipo.{0,10}/) || [''])[0]);

  // Si los tres días ya están cerrados, no debería salir ningún aviso.
  const wPub2 = arrancar(HTML_PUB, '2026-07-20');
  wPub2.jornadas = {
    '2026-07-13': { p: 200, cerrada: true, actualizado: '2026-07-13T09:00:00.000Z' }
  };
  wPub2.metas = []; wPub2.diasManuales = {}; wPub2.rankingMes = [];
  wPub2.pintarVendedorPublico();
  ok('sin días abiertos, no aparece el aviso de bosquejo', !texto(wPub2).includes('todavía no cierra el administrador'));
}

console.log('\n=== 5. index.html no pide login ni trae nada del panel de administrador ===');
{
  ok('no hay formulario de login', !HTML_PUB.includes('loginNube') && !HTML_PUB.includes('signInWithPassword'));
  ok('no hay pestañas de administrador', !HTML_PUB.includes('Cargar y validar') && !HTML_PUB.includes('Excel de Dropi'));
}

console.log(`\n${fallos === 0 ? 'Pasaron' : 'FALLARON'} las ${pruebas} pruebas` + (fallos ? ` (${fallos} fallos)` : ''));
process.exit(fallos ? 1 : 0);
