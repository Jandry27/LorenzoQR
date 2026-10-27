import { listarRecuerdos } from '@/lib/recuerdos-store';
import { sesionFamiliar } from '@/lib/familia-auth';

export async function GET() {
  if (!await sesionFamiliar()) return new Response(null, { status: 401 });
  return Response.json(await listarRecuerdos(), { headers: { 'Cache-Control': 'private, no-store' } });
}
