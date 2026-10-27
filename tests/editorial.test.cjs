const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
  module._compile(outputText, filename);
};
const validacion = require('../src/lib/editorial-validation.ts');
const store = require('../src/lib/editorial-store.ts');
let dir;
const anterior = process.env.MEMORIAL_DATA_DIR;
before(async () => { dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'editorial-memorial-')); process.env.MEMORIAL_DATA_DIR = dir; });
after(async () => { if (anterior === undefined) delete process.env.MEMORIAL_DATA_DIR; else process.env.MEMORIAL_DATA_DIR = anterior; await fsp.rm(dir, { recursive: true, force: true }); });

test('la dedicatoria inicial se conserva y no se inventan recuerdos del legado', async () => {
  const inicial = await store.leerEditorial();
  assert.equal(inicial.dedicatoria, 'Hay recuerdos que nos vuelven a encontrar.');
  assert.deepEqual(inicial.legado, []);
});

test('se permiten historias y fechas vacías; se rechazan metadatos inválidos', () => {
  const ficha = validacion.validarFicha({ titulo: ' Una foto ', historia: '', anio: null });
  assert.equal(ficha.titulo, 'Una foto'); assert.equal(ficha.historia, ''); assert.equal(ficha.anio, null);
  assert.throws(() => validacion.validarFicha({ titulo: '', anio: null }));
  assert.throws(() => validacion.validarFicha({ titulo: 'Foto', anio: 2026.5 }));
  assert.throws(() => validacion.validarFicha({ titulo: 'Foto', anio: new Date().getFullYear() + 1 }));
  assert.throws(() => validacion.validarEditorial({ dedicatoria: 'x'.repeat(1001), legado: [] }));
  assert.throws(() => validacion.validarEditorial({ legado: [{ titulo: 'Título', texto: '' }] }));
  assert.throws(() => validacion.validarEditorial({ legado: Array.from({ length: 13 }, () => ({ titulo: 'Título', texto: 'Texto' })) }));
});

test('el guardado editorial persiste, crea IDs y protege contra sesiones desactualizadas', async () => {
  const payload = { revision: '', dedicatoria: 'Texto sintético de prueba', firma: 'Prueba', legado: [{ titulo: 'Una enseñanza de prueba', texto: 'Contenido sintético, no es un recuerdo real.', autor: '' }] };
  const guardado = await store.guardarEditorial(payload);
  assert.match(guardado.legado[0].id, /^[a-f0-9-]{36}$/);
  assert.deepEqual(await store.leerEditorial(), guardado);
  await assert.rejects(store.guardarEditorial(payload), error => error.status === 409);
  const resultados = await Promise.allSettled([
    store.guardarEditorial({ ...guardado, dedicatoria: 'Edición A' }),
    store.guardarEditorial({ ...guardado, dedicatoria: 'Edición B' }),
  ]);
  assert.equal(resultados.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(resultados.filter(item => item.status === 'rejected' && item.reason.status === 409).length, 1);
  const historial = await fsp.readdir(path.join(dir, 'editorial', 'historial'));
  assert.equal(historial.length, 1);
});

test('las fichas se separan por foto y los IDs no permiten escapar de la carpeta', async () => {
  await store.guardarFicha('lorenzo-foto-01', { revision: '', titulo: 'Título de prueba', historia: 'Historia de prueba', personas: 'Persona de prueba', autor: '', lugar: '', anio: null });
  const fichas = await store.leerFichas();
  assert.equal(fichas['lorenzo-foto-01'].historia, 'Historia de prueba');
  assert.equal(fichas['lorenzo-foto-02'], undefined);
  await assert.rejects(store.guardarFicha('../../otra-carpeta', { revision: '', titulo: 'Prueba' }), error => error.status === 404);
  await assert.rejects(store.guardarFicha('lorenzo-foto-01', { revision: '', titulo: 'Prueba' }), error => error.status === 409);
});
