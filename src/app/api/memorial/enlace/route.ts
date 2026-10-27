import { networkInterfaces } from 'node:os';

function esLocal(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.startsWith('192.168.') || host.startsWith('10.') || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

export async function GET(request: Request) {
  const configurada = process.env.MEMORIAL_PUBLIC_URL;
  let url: URL;
  try { url = new URL(configurada || `${new URL(request.url).protocol}//${request.headers.get('host') || new URL(request.url).host}`); }
  catch { return Response.json({ error: 'No se pudo determinar el enlace.' }, { status: 500 }); }
  if (!['http:', 'https:'].includes(url.protocol)) return Response.json({ error: 'Revisa el enlace del memorial.' }, { status: 500 });
  if (!configurada && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    const redes = networkInterfaces();
    const interfaces = [...(redes.en0 || []), ...Object.values(redes).flatMap(values => values || [])];
    const direccion = interfaces.find(item => !item.internal && item.family === 'IPv4' && esLocal(item.address));
    if (direccion) url.hostname = direccion.address;
  }
  return Response.json({ baseUrl: url.origin, localOnly: esLocal(url.hostname) }, { headers: { 'Cache-Control': 'no-store' } });
}
