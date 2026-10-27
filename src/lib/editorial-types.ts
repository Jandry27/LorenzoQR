export interface LegadoItem {
  id: string;
  titulo: string;
  texto: string;
  autor: string;
}

export interface EditorialMemorial {
  revision: string;
  dedicatoria: string;
  firma: string;
  legado: LegadoItem[];
}

export interface FichaFotografia {
  revision: string;
  titulo: string;
  historia: string;
  personas: string;
  lugar: string;
  autor: string;
  anio: number | null;
}

export type TamanoLectura = 'normal' | 'grande' | 'muy-grande';
export interface PreferenciasLectura {
  tamano: TamanoLectura;
  contraste: boolean;
  movimientoReducido: boolean;
}
