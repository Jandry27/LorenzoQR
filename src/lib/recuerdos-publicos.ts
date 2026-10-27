import { randomInt } from 'node:crypto';
import { listarRecuerdos, MEMORIAL_ID } from './recuerdos-store';
import { fetchMemoriesByMemorialId } from './data';
import { Memory } from './types';
import { leerEditorial, leerFichas } from './editorial-store';
import type { EditorialMemorial, FichaFotografia } from './editorial-types';

export async function cargarAlbum(memorialId: string) {
  const originales = await fetchMemoriesByMemorialId(memorialId);
  const aportaciones = memorialId === MEMORIAL_ID ? (await listarRecuerdos()).filter(recuerdo => recuerdo.status === 'approved') : [];
  const fotografias: Memory[] = aportaciones.filter(recuerdo => recuerdo.has_photo).map(recuerdo => ({
    id: recuerdo.id, memorial_id: recuerdo.memorial_id, title: `Un recuerdo de ${recuerdo.author_name}`,
    story: recuerdo.message, media_url: `/api/recuerdos/${recuerdo.id}/foto`, media_type: 'image', life_stage: 'general',
    author_name: recuerdo.author_name, is_public: true, created_at: recuerdo.created_at,
  }));
  const [editorial, fichas] = await Promise.all([memorialId === MEMORIAL_ID ? leerEditorial() : Promise.resolve<EditorialMemorial>({ revision: '', dedicatoria: '', firma: '', legado: [] }), memorialId === MEMORIAL_ID ? leerFichas() : Promise.resolve<Record<string, FichaFotografia>>({})]);
  const memories = [...originales, ...fotografias].map(memory => {
    const ficha = fichas[memory.id];
    return ficha ? { ...memory, title: ficha.titulo, story: ficha.historia, people: ficha.personas || undefined, location: ficha.lugar || undefined, author_name: ficha.autor || undefined, approximate_year: ficha.anio ?? undefined } : memory;
  });
  return { editorial, memories, initialMemoryId: memories.length ? memories[randomInt(memories.length)].id : undefined,
    messages: aportaciones.filter(recuerdo => !recuerdo.has_photo).map(recuerdo => ({ id: recuerdo.id, author_name: recuerdo.author_name, message: recuerdo.message })) };
}
