import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import sharp from 'sharp';

const carpeta = await mkdtemp(path.join(os.tmpdir(), 'memorial-integracion-'));
const reservar = createServer(); reservar.listen(0, '127.0.0.1'); await once(reservar, 'listening');
const port = reservar.address().port; await new Promise(resolve => reservar.close(resolve));
const base = `http://127.0.0.1:${port}`;
let server;
async function arrancar() {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { env: { ...process.env, MEMORIAL_DATA_DIR: carpeta }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No arrancó el servidor de prueba.')), 20000);
    server.stdout.on('data', data => { log += data; if (log.includes('Ready')) { clearTimeout(timer); resolve(); } });
    server.stderr.on('data', data => { log += data; });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`El servidor terminó: ${code}. ${log}`)); });
  });
}
async function parar() { if (server && server.exitCode === null) { const done = once(server, 'exit'); server.kill('SIGTERM'); await done; } }
const headers = { Origin: base };
const foto = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#bda67e' } }).jpeg().toBuffer();
function formulario(nombre = 'Prueba de integración') {
  const form = new FormData();
  form.set('memorial_id', '00000000-0000-0000-0000-000000000002');
  form.set('author_name', nombre); form.set('message', 'Texto de prueba, no es un recuerdo real.');
  return form;
}
try {
  await arrancar();
  const portada = await (await fetch(base + '/m/lorenzo-chamba')).text();
  assert.ok(portada.includes('portada.png'));
  const form = formulario(); form.set('photo', new File([foto], 'prueba.jpg', { type: 'image/jpeg' }));
  const envio = await fetch(base + '/api/recuerdos', { method: 'POST', headers, body: form });
  assert.equal(envio.status, 201); const pendiente = await envio.json();
  assert.equal(pendiente.status, 'pending');
  const registro = JSON.parse(await readFile(path.join(carpeta, 'recuerdos', pendiente.id + '.json'), 'utf8'));
  assert.equal(registro.author_name, 'Prueba de integración'); assert.equal(registro.has_photo, true);
  assert.equal((await fetch(base + `/api/recuerdos/${pendiente.id}/foto`)).status, 404);
  assert.equal((await fetch(base + '/api/familia/recuerdos')).status, 401);
  assert.equal((await fetch(base + `/api/familia/recuerdos/${pendiente.id}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{"status":"approved"}' })).status, 403);
  assert.ok(!(await (await fetch(base + '/')).text()).includes('Prueba de integración'));
  console.log('✓ Texto y foto guardados; pendientes ocultos y moderación protegida.');

  const invalida = formulario(); invalida.set('photo', new File(['<svg><script>alert(1)</script></svg>'], 'falsa.jpg', { type: 'image/jpeg' }));
  assert.equal((await fetch(base + '/api/recuerdos', { method: 'POST', headers, body: invalida })).status, 400);
  assert.equal((await fetch(base + '/api/recuerdos', { method: 'POST', body: formulario() })).status, 403);
  const enorme = formulario(); enorme.set('photo', new File([new Uint8Array(9 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' }));
  assert.equal((await fetch(base + '/api/recuerdos', { method: 'POST', headers, body: enorme })).status, 413);
  console.log('✓ Archivos falsos, envíos de otro origen y fotografías demasiado grandes rechazados.');

  const accesoIncorrecto = await fetch(base + '/api/familia/sesion', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ clave: 'incorrecta' }) });
  assert.equal(accesoIncorrecto.status, 401);
  const clave = (await readFile(path.join(carpeta, 'clave-familiar'), 'utf8')).trim();
  const acceso = await fetch(base + '/api/familia/sesion', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ clave }) });
  assert.equal(acceso.status, 200);
  const cookie = acceso.headers.get('set-cookie').split(';')[0];
  const auth = { ...headers, Cookie: cookie, 'Content-Type': 'application/json' };
  assert.equal((await fetch(base + `/api/recuerdos/${pendiente.id}/foto`, { headers: auth })).status, 200);
  const publicar = await fetch(base + `/api/familia/recuerdos/${pendiente.id}`, { method: 'PATCH', headers: auth, body: '{"status":"approved"}' });
  assert.equal(publicar.status, 200);
  assert.equal((await fetch(base + `/api/recuerdos/${pendiente.id}/foto`)).status, 200);
  assert.ok((await (await fetch(base + '/')).text()).includes('Prueba de integración'));
  console.log('✓ Acceso familiar, vista privada y publicación después de aprobar.');

  const editorialPayload = { revision: '', dedicatoria: 'Dedicatoria sintética de integración', firma: 'Prueba', legado: [{ titulo: 'Legado sintético', texto: 'Palabras de prueba que no se publican en el memorial real.', autor: 'Prueba' }] };
  assert.equal((await fetch(base + '/api/familia/editorial', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(editorialPayload) })).status, 403);
  const editorialResponse = await fetch(base + '/api/familia/editorial', { method: 'PUT', headers: auth, body: JSON.stringify(editorialPayload) });
  assert.equal(editorialResponse.status, 200);
  const editorial = await editorialResponse.json();
  assert.ok(editorial.legado[0].id);
  const fichaPayload = { revision: '', titulo: 'Fotografía sintética de integración', historia: 'Historia sintética de integración', personas: 'Personas de prueba', lugar: 'Lugar de prueba', autor: 'Prueba', anio: null };
  assert.equal((await fetch(base + '/api/familia/fotografias/lorenzo-foto-01', { method: 'PUT', headers: auth, body: JSON.stringify(fichaPayload) })).status, 200);
  assert.equal((await fetch(base + '/api/familia/fotografias/lorenzo-foto-99', { method: 'PUT', headers: auth, body: JSON.stringify(fichaPayload) })).status, 404);
  assert.equal((await fetch(base + '/api/familia/fotografias/lorenzo-foto-01', { method: 'PUT', headers: auth, body: JSON.stringify(fichaPayload) })).status, 409);
  assert.equal((await fetch(base + '/api/familia/editorial', { method: 'PUT', headers: auth, body: JSON.stringify(editorialPayload) })).status, 409);
  const paginaEditada = await (await fetch(base + '/m/lorenzo-chamba')).text();
  assert.ok(paginaEditada.includes(editorialPayload.dedicatoria));
  assert.ok(paginaEditada.includes('Legado sintético'));
  assert.ok(paginaEditada.includes(fichaPayload.historia));
  assert.ok(!(await (await fetch(base + '/admin/album')).text()).includes('La historia que conservamos'));
  assert.ok((await (await fetch(base + '/admin/album', { headers: auth })).text()).includes('La historia que conservamos'));
  console.log('✓ Dedicatoria, legado e historias guardados; editor protegido y conflictos de sesión detectados.');


  await parar(); await arrancar();
  assert.equal((await fetch(base + `/api/recuerdos/${pendiente.id}/foto`)).status, 200);
  assert.ok((await (await fetch(base + '/')).text()).includes(editorialPayload.dedicatoria));
  assert.ok((await (await fetch(base + '/')).text()).includes(fichaPayload.historia));
  const conservar = await fetch(base + `/api/familia/recuerdos/${pendiente.id}`, { method: 'PATCH', headers: auth, body: '{"status":"rejected"}' });
  assert.equal(conservar.status, 200);
  assert.equal((await fetch(base + `/api/recuerdos/${pendiente.id}/foto`)).status, 404);
  assert.ok(!(await (await fetch(base + '/')).text()).includes('Prueba de integración'));
  assert.equal(JSON.parse(await readFile(path.join(carpeta, 'recuerdos', pendiente.id + '.json'), 'utf8')).status, 'rejected');
  console.log('✓ Persistencia después de reiniciar y retirada reversible sin borrar el recuerdo.');
  console.log('Prueba completa aprobada. Solo se usaron archivos sintéticos en una carpeta temporal.');
} finally { await parar(); await rm(carpeta, { recursive: true, force: true }); }
