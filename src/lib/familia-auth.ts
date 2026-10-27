import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

import os from 'node:os';

export const COOKIE_FAMILIA = 'memorial_familia';
const DURACION = 8 * 60 * 60;

export async function claveFamiliar() {
  const esTest = process.env.MEMORIAL_DATA_DIR?.includes('memorial-integracion-');
  if (process.env.MEMORIAL_FAMILIA_CLAVE && !esTest) {
    return process.env.MEMORIAL_FAMILIA_CLAVE.trim();
  }
  const dir = path.resolve(/* turbopackIgnore: true */ process.env.MEMORIAL_DATA_DIR || (process.env.VERCEL || process.env.NODE_ENV === 'production' ? path.join(os.tmpdir(), '.memorial-data') : path.join(process.cwd(), '.memorial-data')));
  try { await mkdir(dir, { recursive: true, mode: 0o700 }); } catch {}
  const archivo = path.join(dir, 'clave-familiar');
  try { return (await readFile(archivo, 'utf8')).trim(); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  try { await writeFile(archivo, randomBytes(24).toString('base64url'), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  return (await readFile(archivo, 'utf8')).trim();
}

export function compararSeguro(a: string, b: string) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export async function crearSesion() {
  const vence = String(Math.floor(Date.now() / 1000) + DURACION);
  return `${vence}.${createHmac('sha256', await claveFamiliar()).update(vence).digest('hex')}`;
}

export async function sesionFamiliar() {
  const valor = (await cookies()).get(COOKIE_FAMILIA)?.value;
  if (!valor) return false;
  const [vence, firma, extra] = valor.split('.');
  if (extra || !vence || !firma || !/^\d+$/.test(vence) || Number(vence) <= Date.now() / 1000 || Number(vence) > Date.now() / 1000 + DURACION + 5) return false;
  const esperada = createHmac('sha256', await claveFamiliar()).update(vence).digest('hex');
  return compararSeguro(firma, esperada);
}

export function mismoOrigen(request: Request) {
  const origin = request.headers.get('origin');
  try { return Boolean(origin && new URL(origin).host === request.headers.get('host')); }
  catch { return false; }
}

// Límite global del prototipo local: memoria acotada y sin confiar en IPs aportadas por el cliente.
const limites = new Map<string, { cantidad: number; vence: number }>();
export function permitirIntento(tipo: 'envio' | 'acceso') {
  const ahora = Date.now();
  let contador = limites.get(tipo);
  if (!contador || contador.vence <= ahora) { contador = { cantidad: 0, vence: ahora + 60_000 }; limites.set(tipo, contador); }
  contador.cantidad++;
  return contador.cantidad <= (tipo === 'acceso' ? 10 : 20);
}

export async function leerJsonLimitado(request: Request, limite = 1024): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Falta el cuerpo');
  const partes: Uint8Array[] = []; let bytes = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limite) { await reader.cancel(); throw new Error('Cuerpo demasiado grande'); }
    partes.push(value);
  }
  const value: unknown = JSON.parse(Buffer.concat(partes).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Objeto no válido');
  return value as Record<string, unknown>;
}
