import { leerFoto, leerRecuerdo } from '@/lib/recuerdos-store';
import { sesionFamiliar } from '@/lib/familia-auth';

export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recuerdo = await leerRecuerdo(id);
  if (!recuerdo || !recuerdo.has_photo || (recuerdo.status !== 'approved' && !await sesionFamiliar())) return new Response(null, { status: 404 });
  const foto = await leerFoto(id);
  if (!foto) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(foto), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
