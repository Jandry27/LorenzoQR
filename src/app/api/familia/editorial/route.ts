import { leerJsonLimitado, mismoOrigen, sesionFamiliar } from '@/lib/familia-auth';
import { guardarEditorial } from '@/lib/editorial-store';
import { ErrorEdicion } from '@/lib/editorial-validation';

export async function PUT(request: Request) {
  if (!mismoOrigen(request) || !await sesionFamiliar()) return new Response(null, { status: 403 });
  let value: Record<string, unknown>;
  try { value = await leerJsonLimitado(request, 96 * 1024); }
  catch { return Response.json({ error: 'El formulario no es válido o es demasiado grande.' }, { status: 400 }); }
  try { return Response.json(await guardarEditorial(value)); }
  catch (error) {
    if (error instanceof ErrorEdicion) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: 'No pudimos guardar los cambios. Tu texto sigue en el editor.' }, { status: 500 });
  }
}
