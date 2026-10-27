import { randomUUID } from 'node:crypto';
import type { EditorialMemorial, FichaFotografia } from './editorial-types';

export class ErrorEdicion extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export const esIdFotografia = (id: string) => /^lorenzo-foto-\d{2}$/.test(id) || /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id);
const esUuid = (id: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id);

function texto(value: unknown, limite: number, campo: string, obligatorio = false) {
  if (value !== undefined && typeof value !== 'string') throw new ErrorEdicion(`Revisa el campo «${campo}».`);
  const normalizado = (value as string | undefined)?.trim() || '';
  if (normalizado.length > limite || (obligatorio && !normalizado)) throw new ErrorEdicion(`Revisa el campo «${campo}» (máximo ${limite} caracteres).`);
  return normalizado;
}

export function validarRevision(value: unknown) {
  if (value !== '' && (typeof value !== 'string' || !esUuid(value))) throw new ErrorEdicion('La revisión no es válida. Recarga el editor.');
  return value as string;
}

export function validarEditorial(value: Record<string, unknown>): Omit<EditorialMemorial, 'revision'> {
  if (!Array.isArray(value.legado) || value.legado.length > 12) throw new ErrorEdicion('Puedes publicar hasta 12 recuerdos en «Lo que nos dejó».');
  const ids = new Set<string>();
  const legado = value.legado.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new ErrorEdicion('Revisa los recuerdos del legado.');
    if (item.id && (typeof item.id !== 'string' || !esUuid(item.id))) throw new ErrorEdicion('Uno de los recuerdos no tiene un identificador válido.');
    const id = item.id || randomUUID();
    if (ids.has(id)) throw new ErrorEdicion('Hay dos recuerdos con el mismo identificador.');
    ids.add(id);
    return { id, titulo: texto(item.titulo, 100, 'Título del recuerdo', true), texto: texto(item.texto, 1200, 'Palabras del recuerdo', true), autor: texto(item.autor, 150, 'Firma') };
  });
  return { dedicatoria: texto(value.dedicatoria, 1000, 'Dedicatoria'), firma: texto(value.firma, 150, 'Firma de la dedicatoria'), legado };
}

export function validarFicha(value: Record<string, unknown>): Omit<FichaFotografia, 'revision'> {
  const anio = value.anio ?? null;
  if (anio !== null && (typeof anio !== 'number' || !Number.isInteger(anio) || anio < 1800 || anio > new Date().getFullYear())) throw new ErrorEdicion('Indica un año válido o deja la fecha vacía si no la conoces.');
  return { titulo: texto(value.titulo, 180, 'Título', true), historia: texto(value.historia, 5000, 'Historia'), personas: texto(value.personas, 500, 'Personas'), lugar: texto(value.lugar, 150, 'Lugar'), autor: texto(value.autor, 150, 'Compartido por'), anio };
}
