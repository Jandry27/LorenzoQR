import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
const carpeta = path.resolve(process.env.MEMORIAL_DATA_DIR || '.memorial-data');
await mkdir(carpeta, { recursive: true, mode: 0o700 });
const archivo = path.join(carpeta, 'clave-familiar');
try { await writeFile(archivo, randomBytes(24).toString('base64url'), { flag: 'wx', mode: 0o600 }); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
console.log('Clave para el espacio familiar (no la compartas con visitantes):');
console.log((await readFile(archivo, 'utf8')).trim());
