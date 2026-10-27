import { mkdir, readFile, readdir, rename, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { supabaseAdmin } from './supabase';

export const MEMORIAL_ID = '00000000-0000-0000-0000-000000000002';
export const MAX_FOTO_BYTES = 8 * 1024 * 1024;
const carpeta = () => {
  if (process.env.MEMORIAL_DATA_DIR) {
    return path.resolve(process.env.MEMORIAL_DATA_DIR);
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
    return path.join(os.tmpdir(), '.memorial-data');
  }
  return path.resolve(path.join(process.cwd(), '.memorial-data'));
};
const idValido = (id: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id);

export interface RecuerdoEnviado {
  id: string;
  memorial_id: string;
  author_name: string;
  author_relationship: string;
  message: string;
  has_photo: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export class ErrorRecuerdo extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

async function prepararCarpeta() {
  const dir = path.join(carpeta(), 'recuerdos');
  try {
    await mkdir(dir, { recursive: true, mode: 0o700 });
  } catch {
    // Si el entorno es de solo lectura, no detenemos el sistema
  }
  return dir;
}

async function guardarRegistro(recuerdo: RecuerdoEnviado) {
  try {
    const dir = await prepararCarpeta();
    const temporal = path.join(dir, `${recuerdo.id}.${randomUUID()}.tmp`);
    await writeFile(temporal, JSON.stringify(recuerdo), { mode: 0o600 });
    await rename(temporal, path.join(dir, `${recuerdo.id}.json`));
  } catch (err) {
    console.warn('Registro en disco local diferido:', err);
  }
}

export async function leerRecuerdo(id: string): Promise<RecuerdoEnviado | null> {
  if (!idValido(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(carpeta(), 'recuerdos', `${id}.json`), 'utf8')) as RecuerdoEnviado;
  } catch {
    // Continuar con Supabase si no está en disco local
  }
  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin.from('contributions').select('*').eq('id', id).maybeSingle();
      if (data) {
        return {
          id: data.id,
          memorial_id: data.memorial_id,
          author_name: data.author_name,
          author_relationship: data.author_relationship || '',
          message: data.message,
          has_photo: Boolean(data.photo_url),
          status: data.status,
          created_at: data.created_at,
        };
      }
    } catch {}
  }
  return null;
}

export async function listarRecuerdos(): Promise<RecuerdoEnviado[]> {
  const mapa = new Map<string, RecuerdoEnviado>();
  try {
    const dir = await prepararCarpeta();
    const archivos = (await readdir(dir)).filter(file => file.endsWith('.json'));
    const recuerdosLocales = await Promise.all(archivos.map(file => leerRecuerdo(file.slice(0, -5))));
    recuerdosLocales.filter((value): value is RecuerdoEnviado => Boolean(value)).forEach(r => mapa.set(r.id, r));
  } catch {
    // Entorno serverless o sin archivos locales
  }

  const esTest = process.env.MEMORIAL_DATA_DIR?.includes('memorial-integracion-') || process.env.MEMORIAL_DATA_DIR?.includes('editorial-memorial-');
  if (supabaseAdmin && !esTest) {
    try {
      const { data, error } = await supabaseAdmin.from('contributions').select('*').eq('memorial_id', MEMORIAL_ID).order('created_at', { ascending: false });
      if (!error && data) {
        data.forEach(item => {
          mapa.set(item.id, {
            id: item.id,
            memorial_id: item.memorial_id,
            author_name: item.author_name,
            author_relationship: item.author_relationship || '',
            message: item.message,
            has_photo: Boolean(item.photo_url),
            status: item.status,
            created_at: item.created_at,
          });
        });
      }
    } catch {}
  }

  return Array.from(mapa.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function crearRecuerdo(formulario: FormData): Promise<RecuerdoEnviado> {
  const texto = (key: string) => typeof formulario.get(key) === 'string' ? (formulario.get(key) as string).trim() : '';
  const author_name = texto('author_name');
  const author_relationship = texto('author_relationship');
  const message = texto('message');
  const foto = formulario.get('photo');
  const tieneFoto = foto instanceof File && foto.size > 0;
  if (texto('memorial_id') !== MEMORIAL_ID) throw new ErrorRecuerdo('Este memorial no está disponible.', 404);
  if (!author_name || author_name.length > 150 || author_relationship.length > 100 || message.length > 5000) throw new ErrorRecuerdo('Revisa tu nombre y el tamaño de tu mensaje.');
  if (!message && !tieneFoto) throw new ErrorRecuerdo('Añade una fotografía o escribe un recuerdo.');
  if ((await listarRecuerdos()).length >= 500) throw new ErrorRecuerdo('El álbum necesita una revisión de la familia antes de recibir más recuerdos.', 503);

  let imagen: Buffer | undefined;
  if (tieneFoto) {
    if (foto.size > MAX_FOTO_BYTES) throw new ErrorRecuerdo('La fotografía debe pesar menos de 8 MB.', 413);
    try {
      const original = Buffer.from(await foto.arrayBuffer());
      const metadata = await sharp(original, { limitInputPixels: 40_000_000 }).metadata();
      if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error('Formato no admitido');
      // Normaliza orientación y tamaño; la salida no conserva ubicación GPS ni EXIF.
      imagen = await sharp(original, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch { throw new ErrorRecuerdo('No pudimos leer la imagen. Elige una fotografía JPG, PNG o WebP.'); }
  }
  const recuerdo: RecuerdoEnviado = {
    id: randomUUID(), memorial_id: MEMORIAL_ID, author_name, author_relationship, message,
    has_photo: Boolean(imagen), status: 'pending', created_at: new Date().toISOString(),
  };

  // Guardar en almacenamiento local si está disponible
  try {
    if (imagen) await writeFile(path.join(await prepararCarpeta(), `${recuerdo.id}.webp`), imagen, { mode: 0o600, flag: 'wx' });
    await guardarRegistro(recuerdo);
  } catch (diskErr) {
    console.warn('Almacenamiento local omitido en serverless:', diskErr);
  }

  // Sincronizar en Supabase
  const esTest = process.env.MEMORIAL_DATA_DIR?.includes('memorial-integracion-') || process.env.MEMORIAL_DATA_DIR?.includes('editorial-memorial-');
  if (supabaseAdmin && !esTest) {
    try {
      if (imagen) {
        await supabaseAdmin.storage.from('memorial-media').upload(`recuerdos/${recuerdo.id}.webp`, imagen, { contentType: 'image/webp', upsert: true });
      }
      await supabaseAdmin.from('contributions').insert({
        id: recuerdo.id,
        memorial_id: recuerdo.memorial_id,
        author_name: recuerdo.author_name,
        author_relationship: recuerdo.author_relationship,
        message: recuerdo.message,
        photo_url: tieneFoto ? `/api/recuerdos/${recuerdo.id}/foto` : null,
        status: recuerdo.status,
        created_at: recuerdo.created_at,
      });
    } catch (err) {
      console.warn('Sincronización con Supabase diferida:', err);
    }
  }

  return recuerdo;
}

export async function cambiarEstado(id: string, status: 'approved' | 'rejected') {
  const recuerdo = await leerRecuerdo(id);
  if (!recuerdo) throw new ErrorRecuerdo('No encontramos este recuerdo.', 404);
  const actualizado = { ...recuerdo, status };
  await guardarRegistro(actualizado);

  const esTest = process.env.MEMORIAL_DATA_DIR?.includes('memorial-integracion-') || process.env.MEMORIAL_DATA_DIR?.includes('editorial-memorial-');
  if (supabaseAdmin && !esTest) {
    try {
      await supabaseAdmin.from('contributions').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    } catch (err) {
      console.warn('Actualización en Supabase diferida:', err);
    }
  }

  return actualizado;
}

export async function leerFoto(id: string) {
  if (!idValido(id)) return null;
  try {
    return await readFile(path.join(carpeta(), 'recuerdos', `${id}.webp`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.storage.from('memorial-media').download(`recuerdos/${id}.webp`);
      if (!error && data) {
        return Buffer.from(await data.arrayBuffer());
      }
    } catch {}
  }
  return null;
}

export async function eliminarRecuerdo(id: string) {
  if (!idValido(id)) throw new ErrorRecuerdo('Identificador no válido.', 400);

  // Borrar de disco local si existe
  try {
    const dir = await prepararCarpeta();
    await rm(path.join(dir, `${id}.json`), { force: true });
    await rm(path.join(dir, `${id}.webp`), { force: true });
  } catch {}

  // Borrar de Supabase
  const esTest = process.env.MEMORIAL_DATA_DIR?.includes('memorial-integracion-') || process.env.MEMORIAL_DATA_DIR?.includes('editorial-memorial-');
  if (supabaseAdmin && !esTest) {
    try {
      await supabaseAdmin.from('contributions').delete().eq('id', id);
      await supabaseAdmin.storage.from('memorial-media').remove([`recuerdos/${id}.webp`]);
      const { data: editorial } = await supabaseAdmin.from('memorial_editorial').select('fichas').eq('memorial_id', MEMORIAL_ID).maybeSingle();
      if (editorial?.fichas && (editorial.fichas as Record<string, unknown>)[id]) {
        const fichasActualizadas = { ...(editorial.fichas as Record<string, unknown>) };
        delete fichasActualizadas[id];
        await supabaseAdmin.from('memorial_editorial').update({ fichas: fichasActualizadas, updated_at: new Date().toISOString() }).eq('memorial_id', MEMORIAL_ID);
      }
    } catch (err) {
      console.warn('Error al eliminar recuerdo de Supabase:', err);
    }
  }

  return { ok: true, id };
}

export async function crearFotoAdmin(formulario: FormData) {
  const texto = (key: string) => typeof formulario.get(key) === 'string' ? (formulario.get(key) as string).trim() : '';
  const titulo = texto('titulo') || 'Un momento especial';
  const historia = texto('historia');
  const personas = texto('personas');
  const lugar = texto('lugar');
  const autor = texto('autor') || 'Familia Chamba';
  const anioRaw = texto('anio');
  const anio = anioRaw ? Number(anioRaw) : null;
  const foto = formulario.get('photo');

  if (!(foto instanceof File) || foto.size === 0) {
    throw new ErrorRecuerdo('Selecciona una fotografía para subir al álbum.');
  }
  if (foto.size > MAX_FOTO_BYTES) {
    throw new ErrorRecuerdo('La fotografía debe pesar menos de 8 MB.', 413);
  }

  let imagen: Buffer;
  try {
    const original = Buffer.from(await foto.arrayBuffer());
    const metadata = await sharp(original, { limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
      throw new Error('Formato no admitido');
    }
    imagen = await sharp(original, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    throw new ErrorRecuerdo('No pudimos leer la imagen. Elige una fotografía JPG, PNG o WebP.');
  }

  const id = randomUUID();
  const recuerdo: RecuerdoEnviado = {
    id,
    memorial_id: MEMORIAL_ID,
    author_name: autor,
    author_relationship: 'Familia',
    message: historia || titulo,
    has_photo: true,
    status: 'approved',
    created_at: new Date().toISOString(),
  };

  try {
    await writeFile(path.join(await prepararCarpeta(), `${id}.webp`), imagen, { mode: 0o600, flag: 'wx' });
    await guardarRegistro(recuerdo);
  } catch {}

  const ficha = { titulo, historia, personas, lugar, autor, anio, revision: randomUUID() };

  const esTest = process.env.MEMORIAL_DATA_DIR?.includes('memorial-integracion-') || process.env.MEMORIAL_DATA_DIR?.includes('editorial-memorial-');
  if (supabaseAdmin && !esTest) {
    try {
      await supabaseAdmin.storage.from('memorial-media').upload(`recuerdos/${id}.webp`, imagen, { contentType: 'image/webp', upsert: true });
      await supabaseAdmin.from('contributions').insert({
        id: recuerdo.id,
        memorial_id: recuerdo.memorial_id,
        author_name: recuerdo.author_name,
        author_relationship: recuerdo.author_relationship,
        message: recuerdo.message,
        photo_url: `/api/recuerdos/${recuerdo.id}/foto`,
        status: 'approved',
        created_at: recuerdo.created_at,
      });

      const { data: editorial } = await supabaseAdmin.from('memorial_editorial').select('fichas').eq('memorial_id', MEMORIAL_ID).maybeSingle();
      const fichas = (editorial?.fichas as Record<string, unknown>) || {};
      fichas[id] = ficha;
      await supabaseAdmin.from('memorial_editorial').update({ fichas, updated_at: new Date().toISOString() }).eq('memorial_id', MEMORIAL_ID);
    } catch (err) {
      console.warn('Error al guardar foto admin en Supabase:', err);
    }
  }

  return { recuerdo, ficha };
}
