import { cambiarEstado, ErrorRecuerdo } from '@/lib/recuerdos-store';
import { mismoOrigen, sesionFamiliar, leerJsonLimitado } from '@/lib/familia-auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mismoOrigen(request) || !await sesionFamiliar()) return new Response(null, { status: 403 });
  if (Number(request.headers.get('content-length')) > 1024) return new Response(null, { status: 413 });
  try {
    const { status } = await leerJsonLimitado(request);
    if (status !== 'approved' && status !== 'rejected') return new Response(null, { status: 400 });
    return Response.json(await cambiarEstado((await params).id, status));
  } catch (error) {
    if (error instanceof ErrorRecuerdo) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: 'No pudimos guardar la revisión.' }, { status: 500 });
  }
}
