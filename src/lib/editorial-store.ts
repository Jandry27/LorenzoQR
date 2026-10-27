import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { EditorialMemorial, FichaFotografia } from './editorial-types';
import { ErrorEdicion, esIdFotografia, validarEditorial, validarFicha, validarRevision } from './editorial-validation';
import { supabaseAdmin } from './supabase';
import { MEMORIAL_ID } from './recuerdos-store';

const carpeta = () => path.join(path.resolve(/* turbopackIgnore: true */ process.env.MEMORIAL_DATA_DIR || path.join(process.cwd(), '.memorial-data')), 'editorial');
const predeterminado: EditorialMemorial = { revision: '', dedicatoria: 'Hay recuerdos que nos vuelven a encontrar.', firma: '', legado: [] };

async function leer<T>(nombre: string): Promise<T | null> {
  try { return JSON.parse(await readFile(path.join(carpeta(), nombre), 'utf8')) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
}

async function guardar(nombre: string, value: unknown) {
  await mkdir(carpeta(), { recursive: true, mode: 0o700 });
  const anterior = await leer<unknown>(nombre);
  if (anterior) {
    const historial = path.join(carpeta(), 'historial');
    await mkdir(historial, { recursive: true, mode: 0o700 });
    await writeFile(path.join(historial, `${Date.now()}-${randomUUID()}-${nombre}`), JSON.stringify(anterior), { mode: 0o600, flag: 'wx' });
  }
  const temporal = path.join(carpeta(), `${randomUUID()}.tmp`);
  await writeFile(temporal, JSON.stringify(value), { mode: 0o600 });
  await rename(temporal, path.join(carpeta(), nombre));
}

// Serializa las ediciones del servidor local y comprueba revisiones para no pisar otra sesión familiar.
let ultimaEdicion: Promise<unknown> = Promise.resolve();
function editar<T>(operation: () => Promise<T>) {
  const resultado = ultimaEdicion.then(operation, operation);
  ultimaEdicion = resultado.catch(() => undefined);
  return resultado;
}

export async function leerEditorial(): Promise<EditorialMemorial> {
  const esTest = process.env.MEMORIAL_DATA_DIR?.includes('editorial-memorial-') || process.env.MEMORIAL_DATA_DIR?.includes('memorial-integracion-');
  if (supabaseAdmin && !esTest) {
    try {
      const { data, error } = await supabaseAdmin.from('memorial_editorial').select('*').eq('memorial_id', MEMORIAL_ID).maybeSingle();
      if (!error && data) {
        return {
          revision: data.revision || '',
          dedicatoria: data.dedicatoria || predeterminado.dedicatoria,
          firma: data.firma || '',
          legado: (data.legado as EditorialMemorial['legado']) || [],
        };
      }
    } catch {}
  }
  return await leer<EditorialMemorial>('memorial.json') || { ...predeterminado, legado: [] };
}

export async function leerFichas(): Promise<Record<string, FichaFotografia>> {
  const esTest = process.env.MEMORIAL_DATA_DIR?.includes('editorial-memorial-') || process.env.MEMORIAL_DATA_DIR?.includes('memorial-integracion-');
  if (supabaseAdmin && !esTest) {
    try {
      const { data, error } = await supabaseAdmin.from('memorial_editorial').select('fichas').eq('memorial_id', MEMORIAL_ID).maybeSingle();
      if (!error && data?.fichas && typeof data.fichas === 'object') {
        return data.fichas as Record<string, FichaFotografia>;
      }
    } catch {}
  }

  let archivos: string[];
  try { archivos = await readdir(carpeta()); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}; throw error; }
  const entradas = await Promise.all(archivos.filter(file => file.startsWith('foto-') && file.endsWith('.json')).map(async file => {
    const id = file.slice(5, -5);
    return esIdFotografia(id) ? [id, await leer<FichaFotografia>(file)] as const : null;
  }));
  return Object.fromEntries(entradas.filter((entry): entry is readonly [string, FichaFotografia] => Boolean(entry?.[1])));
}

export async function guardarEditorial(value: Record<string, unknown>) {
  const revision = validarRevision(value.revision);
  const contenido = validarEditorial(value);
  return editar(async () => {
    const actual = await leerEditorial();
    if (actual.revision !== revision) throw new ErrorEdicion('La familia guardó cambios desde otra sesión. Recarga el editor antes de volver a guardar; tu texto sigue aquí.', 409);
    const actualizado: EditorialMemorial = { ...contenido, revision: randomUUID() };
    await guardar('memorial.json', actualizado);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('memorial_editorial').upsert({
          memorial_id: MEMORIAL_ID,
          dedicatoria: actualizado.dedicatoria,
          firma: actualizado.firma,
          legado: actualizado.legado,
          revision: actualizado.revision,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Sincronización editorial con Supabase diferida:', err);
      }
    }

    return actualizado;
  });
}

export async function guardarFicha(id: string, value: Record<string, unknown>) {
  if (!esIdFotografia(id)) throw new ErrorEdicion('No encontramos esa fotografía.', 404);
  const revision = validarRevision(value.revision);
  const contenido = validarFicha(value);
  return editar(async () => {
    const actual = await leer<FichaFotografia>(`foto-${id}.json`);
    if ((actual?.revision || '') !== revision) throw new ErrorEdicion('Esta historia cambió desde otra sesión. Recarga el editor antes de volver a guardar; tu texto sigue aquí.', 409);
    const actualizado: FichaFotografia = { ...contenido, revision: randomUUID() };
    await guardar(`foto-${id}.json`, actualizado);

    if (supabaseAdmin) {
      try {
        const fichasActuales = await leerFichas();
        fichasActuales[id] = actualizado;
        await supabaseAdmin.from('memorial_editorial').update({
          fichas: fichasActuales,
          updated_at: new Date().toISOString(),
        }).eq('memorial_id', MEMORIAL_ID);
      } catch (err) {
        console.warn('Sincronización de ficha con Supabase diferida:', err);
      }
    }

    return actualizado;
  });
}
