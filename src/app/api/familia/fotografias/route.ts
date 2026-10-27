import { mismoOrigen, sesionFamiliar } from '@/lib/familia-auth';
import { crearFotoAdmin, ErrorRecuerdo } from '@/lib/recuerdos-store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!mismoOrigen(request) || !await sesionFamiliar()) {
    return Response.json({ error: 'Sesión no autorizada.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) {
    return Response.json({ error: 'El formulario no es válido.' }, { status: 400 });
  }
  try {
    const formulario = await request.formData();
    const result = await crearFotoAdmin(formulario);
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ErrorRecuerdo) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error('Error al subir fotografía desde admin:', error);
    return Response.json({ error: 'No pudimos subir la fotografía. Inténtalo de nuevo.' }, { status: 500 });
  }
}
