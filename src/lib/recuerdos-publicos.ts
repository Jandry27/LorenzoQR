import { randomInt } from 'node:crypto';
import { listarRecuerdos, MEMORIAL_ID } from './recuerdos-store';
import { fetchMemoriesByMemorialId } from './data';
import { Memory } from './types';
import { leerEditorial, leerFichas } from './editorial-store';
import type { EditorialMemorial, FichaFotografia } from './editorial-types';

export async function cargarAlbum(memorialId: string) {
  const originales = await fetchMemoriesByMemorialId(memorialId);
  let aportaciones: Awaited<ReturnType<typeof listarRecuerdos>> = [];
  try {
    aportaciones = memorialId === MEMORIAL_ID ? (await listarRecuerdos()).filter(recuerdo => recuerdo.status === 'approved') : [];
  } catch (err) {
    console.warn('Aviso al listar aportaciones en cargarAlbum:', err);
  }
  const fotografias: Memory[] = aportaciones.filter(recuerdo => recuerdo.has_photo).map(recuerdo => ({
    id: recuerdo.id, memorial_id: recuerdo.memorial_id, title: `Un recuerdo de ${recuerdo.author_name}`,
    story: recuerdo.message, media_url: `/api/recuerdos/${recuerdo.id}/foto`, media_type: 'image', life_stage: 'general',
    author_name: recuerdo.author_name, is_public: true, created_at: recuerdo.created_at,
  }));
  let editorial: EditorialMemorial = { revision: '', dedicatoria: 'Hay recuerdos que nos vuelven a encontrar.', firma: '', legado: [] };
  let fichas: Record<string, FichaFotografia> = {};
  try {
    [editorial, fichas] = await Promise.all([
      memorialId === MEMORIAL_ID ? leerEditorial() : Promise.resolve<EditorialMemorial>({ revision: '', dedicatoria: '', firma: '', legado: [] }),
      memorialId === MEMORIAL_ID ? leerFichas() : Promise.resolve<Record<string, FichaFotografia>>({})
    ]);
  } catch (err) {
    console.warn('Aviso al leer editorial o fichas en cargarAlbum:', err);
  }
  const memories = [...originales, ...fotografias]
    .filter(memory => !fichas[memory.id]?.oculta)
    .map(memory => {
      const ficha = fichas[memory.id];
      return ficha ? { ...memory, title: ficha.titulo, story: ficha.historia, people: ficha.personas || undefined, location: ficha.lugar || undefined, author_name: ficha.autor || undefined, approximate_year: ficha.anio ?? undefined } : memory;
    });
  return { editorial, memories, initialMemoryId: memories.length ? memories[randomInt(memories.length)].id : undefined,
    messages: aportaciones.filter(recuerdo => !recuerdo.has_photo).map(recuerdo => ({ id: recuerdo.id, author_name: recuerdo.author_name, message: recuerdo.message })) };
}

export async function cargarAlbumAdmin(memorialId: string) {
  const originales = await fetchMemoriesByMemorialId(memorialId);
  let aportaciones: Awaited<ReturnType<typeof listarRecuerdos>> = [];
  try {
    aportaciones = memorialId === MEMORIAL_ID ? await listarRecuerdos() : [];
  } catch (err) {
    console.warn('Aviso al listar aportaciones en cargarAlbumAdmin:', err);
  }
  const fotografias: Memory[] = aportaciones.filter(recuerdo => recuerdo.has_photo).map(recuerdo => ({
    id: recuerdo.id, memorial_id: recuerdo.memorial_id, title: `Un recuerdo de ${recuerdo.author_name}`,
    story: recuerdo.message, media_url: `/api/recuerdos/${recuerdo.id}/foto`, media_type: 'image', life_stage: 'general',
    author_name: recuerdo.author_name, is_public: recuerdo.status === 'approved', created_at: recuerdo.created_at,
  }));
  let editorial: EditorialMemorial = { revision: '', dedicatoria: 'Hay recuerdos que nos vuelven a encontrar.', firma: '', legado: [] };
  let fichas: Record<string, FichaFotografia> = {};
  try {
    [editorial, fichas] = await Promise.all([
      memorialId === MEMORIAL_ID ? leerEditorial() : Promise.resolve<EditorialMemorial>({ revision: '', dedicatoria: '', firma: '', legado: [] }),
      memorialId === MEMORIAL_ID ? leerFichas() : Promise.resolve<Record<string, FichaFotografia>>({})
    ]);
  } catch (err) {
    console.warn('Aviso al leer editorial o fichas en cargarAlbumAdmin:', err);
  }
  const memories = [...originales, ...fotografias].map(memory => {
    const ficha = fichas[memory.id];
    return {
      ...(ficha ? { ...memory, title: ficha.titulo, story: ficha.historia, people: ficha.personas || undefined, location: ficha.lugar || undefined, author_name: ficha.autor || undefined, approximate_year: ficha.anio ?? undefined } : memory),
      oculta: Boolean(ficha?.oculta)
    };
  });
  return { editorial, memories, fichas, aportaciones };
}
