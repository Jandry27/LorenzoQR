const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

// Carga los módulos de dominio con el compilador ya instalado, sin un runner adicional.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};
const discovery = require('../src/lib/discovery.ts');
const memories = ['juventud', 'familia', 'legado', 'legado'].map((life_stage, i) => ({ id: `m${i}`, life_stage }));
let storage;
beforeEach(() => {
  storage = new Map();
  global.window = {};
  global.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  global.localStorage = global.sessionStorage;
});

test('recorre todos los recuerdos antes de repetir y nunca repite consecutivamente', () => {
  for (let run = 0; run < 50; run++) {
    storage.clear();
    const chosen = [];
    for (let i = 0; i < 4; i++) chosen.push(discovery.selectNextDiscoveryMemory(memories, 'family', chosen.at(-1)?.id));
    assert.equal(new Set(chosen.map(m => m.id)).size, 4);
    const next = discovery.selectNextDiscoveryMemory(memories, 'family', chosen.at(-1).id);
    assert.notEqual(next.id, chosen.at(-1).id);
  }
});
test('alterna etapas cuando hay candidatos sin visitar de otra etapa', () => {
  discovery.markMemoryAsViewed('family', 'm2');
  const next = discovery.selectNextDiscoveryMemory(memories, 'family', 'm2');
  assert.notEqual(next.life_stage, 'legado');
});
test('tolera historial inválido y almacenamiento bloqueado', () => {
  storage.set('memorial_seen_memories_family', '{"unexpected":true}');
  assert.deepEqual(discovery.getRecentlyViewedIds('family'), []);
  storage.set('memorial_seen_memories_family', '{');
  assert.deepEqual(discovery.getRecentlyViewedIds('family'), []);
  global.sessionStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  global.localStorage = global.sessionStorage;
  assert.ok(discovery.selectNextDiscoveryMemory(memories, 'family', 'm0'));
});
test('separa los historiales familiares y contempla cero o un recuerdo', () => {
  discovery.markMemoryAsViewed('family-a', 'm0');
  assert.deepEqual(discovery.getRecentlyViewedIds('family-b'), []);
  assert.equal(discovery.selectNextDiscoveryMemory([memories[0]], 'family').id, 'm0');
  assert.throws(() => discovery.selectNextDiscoveryMemory([], 'family'), /No hay recuerdos/);
});

test('un enlace desconocido nunca simula el memorial de otra persona', async () => {
  // Aísla las pruebas de cualquier configuración real de Supabase.
  const originalLoad = Module._load;
  Module._load = function (name, ...args) {
    if (name === './supabase') return { isSupabaseConfigured: false, supabase: null };
    return originalLoad.call(this, name, ...args);
  };
  let data;
  try { data = require('../src/lib/data.ts'); } finally { Module._load = originalLoad; }
  assert.equal(await data.fetchMemorialBySlug('persona-inexistente'), null);
  assert.equal((await data.fetchMemorialBySlug('lorenzo-chamba')).id, data.MEMORIAL_LORENZO.id);
  assert.deepEqual(await data.fetchMemoriesByMemorialId('otro-memorial'), []);
  assert.equal(await data.fetchMemorialBySlug('manuel-restrepo'), null);
});


test('con doce fotografías conserva el ciclo entre visitas y no repite al iniciar otro', () => {
  const album = Array.from({ length: 12 }, (_, i) => ({ id: `foto-${i}`, life_stage: 'general' }));
  const vistos = [];
  for (let i = 0; i < album.length; i++) vistos.push(discovery.selectNextDiscoveryMemory(album, 'lorenzo').id);
  assert.equal(new Set(vistos).size, album.length);
  assert.notEqual(discovery.selectNextDiscoveryMemory(album, 'lorenzo').id, vistos.at(-1));
});
