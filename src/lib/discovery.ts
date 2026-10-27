import { Memory } from './types';

const PREFIX = 'memorial_seen_memories_';
function almacenamiento() {
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch {}
  return typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;
}

export function getRecentlyViewedIds(memorialId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(almacenamiento()?.getItem(`${PREFIX}${memorialId}`) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function markMemoryAsViewed(memorialId: string, memoryId: string, maxHistory = 500): void {
  if (typeof window === 'undefined') return;
  try {
    const ids = getRecentlyViewedIds(memorialId);
    almacenamiento()?.setItem(`${PREFIX}${memorialId}`, JSON.stringify([memoryId, ...ids.filter(id => id !== memoryId)].slice(0, maxHistory)));
  } catch { /* El recorrido sigue funcionando cuando el navegador bloquea el almacenamiento. */ }
}

export function selectNextDiscoveryMemory(memories: Memory[], memorialId: string, currentMemoryId?: string): Memory {
  if (!memories.length) throw new Error('No hay recuerdos disponibles');
  const recientes = getRecentlyViewedIds(memorialId);
  const actualId = currentMemoryId || recientes[0];
  const actual = memories.find(memory => memory.id === actualId);
  let candidatos = memories.filter(memory => memory.id !== actualId && !recientes.includes(memory.id));
  if (!candidatos.length) {
    // Inicia una nueva vuelta aleatoria, conservando el actual para no repetirlo al cambiar de ciclo.
    try { almacenamiento()?.setItem(`${PREFIX}${memorialId}`, JSON.stringify(actualId ? [actualId] : [])); } catch {}
    candidatos = memories.filter(memory => memory.id !== actualId);
  }
  if (!candidatos.length) candidatos = memories;
  const otraEtapa = candidatos.filter(memory => memory.life_stage !== actual?.life_stage);
  if (otraEtapa.length) candidatos = otraEtapa;
  const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
  markMemoryAsViewed(memorialId, elegido.id, memories.length);
  return elegido;
}
