import { crearRecuerdo, ErrorRecuerdo, MAX_FOTO_BYTES } from '@/lib/recuerdos-store';
import { mismoOrigen, permitirIntento } from '@/lib/familia-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!mismoOrigen(request)) return Response.json({ error: 'El envío debe hacerse desde el memorial.' }, { status: 403 });
  if (!permitirIntento('envio')) return Response.json({ error: 'Hay muchos envíos en este momento. Inténtalo dentro de un minuto.' }, { status: 429 });
  const limite = MAX_FOTO_BYTES + 64 * 1024;
  if (Number(request.headers.get('content-length')) > limite) return Response.json({ error: 'La fotografía debe pesar menos de 8 MB.' }, { status: 413 });
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return Response.json({ error: 'El formulario no es válido.' }, { status: 400 });
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new ErrorRecuerdo('No recibimos el formulario.');
    const partes: Uint8Array[] = []; let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limite) { await reader.cancel(); throw new ErrorRecuerdo('La fotografía debe pesar menos de 8 MB.', 413); }
      partes.push(value);
    }
    const formulario = await new Response(Buffer.concat(partes), { headers: { 'content-type': request.headers.get('content-type')! } }).formData();
    const recuerdo = await crearRecuerdo(formulario);
    return Response.json({ id: recuerdo.id, status: recuerdo.status }, { status: 201 });
  } catch (error) {
    if (error instanceof ErrorRecuerdo) return Response.json({ error: error.message }, { status: error.status });
    console.error('No se pudo guardar un recuerdo:', error instanceof Error ? error.name : 'Error');
    return Response.json({ error: 'No pudimos guardar tu recuerdo. Conserva tu texto y vuelve a intentarlo.' }, { status: 500 });
  }
}
