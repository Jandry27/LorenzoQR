import { leerJsonLimitado, mismoOrigen, sesionFamiliar } from '@/lib/familia-auth';
import { guardarFicha } from '@/lib/editorial-store';
import { ErrorEdicion } from '@/lib/editorial-validation';
import { cargarAlbum } from '@/lib/recuerdos-publicos';
import { MEMORIAL_ID } from '@/lib/recuerdos-store';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mismoOrigen(request) || !await sesionFamiliar()) return new Response(null, { status: 403 });
  const { id } = await params;
  const album = await cargarAlbum(MEMORIAL_ID);
  if (!album.memories.some(memory => memory.id === id)) return new Response(null, { status: 404 });
  let value: Record<string, unknown>;
  try { value = await leerJsonLimitado(request, 32 * 1024); }
  catch { return Response.json({ error: 'El formulario no es válido o es demasiado grande.' }, { status: 400 }); }
  try { return Response.json(await guardarFicha(id, value)); }
  catch (error) {
    if (error instanceof ErrorEdicion) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: 'No pudimos guardar la historia. Tu texto sigue en el editor.' }, { status: 500 });
  }
}
