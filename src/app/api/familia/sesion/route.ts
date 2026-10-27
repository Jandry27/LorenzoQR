import { cookies } from 'next/headers';
import { claveFamiliar, compararSeguro, COOKIE_FAMILIA, crearSesion, mismoOrigen, permitirIntento, leerJsonLimitado } from '@/lib/familia-auth';

export async function POST(request: Request) {
  if (!mismoOrigen(request)) return new Response(null, { status: 403 });
  if (!permitirIntento('acceso')) return Response.json({ error: 'Espera un minuto antes de volver a intentarlo.' }, { status: 429 });
  if (Number(request.headers.get('content-length')) > 1024) return new Response(null, { status: 413 });
  let clave: unknown;
  try { clave = (await leerJsonLimitado(request)).clave; } catch { return new Response(null, { status: 400 }); }
  if (typeof clave !== 'string' || clave.length > 200 || !compararSeguro(clave, await claveFamiliar())) return Response.json({ error: 'La clave no es correcta.' }, { status: 401 });
  (await cookies()).set(COOKIE_FAMILIA, await crearSesion(), { httpOnly: true, sameSite: 'strict', secure: new URL(request.headers.get('origin')!).protocol === 'https:', maxAge: 8 * 60 * 60, path: '/' });
  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!mismoOrigen(request)) return new Response(null, { status: 403 });
  (await cookies()).delete(COOKIE_FAMILIA);
  return Response.json({ success: true });
}
