import { Memorial, Memory } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

export const MEMORIAL_LORENZO: Memorial = {
  id: '00000000-0000-0000-0000-000000000002',
  family_id: '00000000-0000-0000-0000-000000100002',
  slug: 'lorenzo-chamba',
  full_name: 'Lorenzo Chamba',
  birth_date: '1933-04-28',
  death_date: '2026-10-20',
  epitaph: 'Siempre en nuestra memoria.',
  cover_image_url: '/photos/lorenzo-chamba/portada.png',
  avatar_image_url: '/photos/lorenzo-chamba/portada.png',
  avatar_image_position: 'center center',
  is_public: true,
  theme_color: 'olive',
  created_at: '2026-10-25T00:00:00Z',
  updated_at: '2026-10-25T00:00:00Z',
};

// Los títulos describen la imagen. Fechas, lugares, autores e historias esperan confirmación familiar.
const fotografiasSeleccionadas = [
  {
    "archivo": "IMG_0103.jpeg",
    "titulo": "Un paseo junto al estanque"
  },
  {
    "archivo": "IMG_3250.jpeg",
    "titulo": "Al aire libre, con su sombrero"
  },
  {
    "archivo": "IMG_1356.jpeg",
    "titulo": "Un momento compartido"
  },
  {
    "archivo": "0fee050b-ae5a-4083-aec6-9f1eae2dc7b9.jpeg",
    "titulo": "Juntos en una celebración"
  },
  {
    "archivo": "IMG_3247.jpeg",
    "titulo": "Una vista del campo"
  },
  {
    "archivo": "IMG_3255.jpeg",
    "titulo": "Un momento bajo el sol"
  },
  {
    "archivo": "IMG_4401.jpeg",
    "titulo": "Un encuentro en el patio"
  },
  {
    "archivo": "IMG_5429.jpeg",
    "titulo": "Alrededor de la mesa"
  },
  {
    "archivo": "IMG_5831.jpeg",
    "titulo": "Una mesa preparada para celebrar"
  },
  {
    "archivo": "IMG_5850.jpeg",
    "titulo": "Una fotografía junto al pastel"
  },
  {
    "archivo": "IMG_5855.jpeg",
    "titulo": "Un encuentro para recordar"
  },
  {
    "archivo": "c61981ff-cb16-4a9f-b1f1-eeb33f397400.jpeg",
    "titulo": "Una reunión al aire libre"
  }
];

export const RECUERDOS_LORENZO: Memory[] = fotografiasSeleccionadas.map(({ archivo, titulo }, indice) => ({
  id: `lorenzo-foto-${String(indice + 1).padStart(2, '0')}`,
  memorial_id: MEMORIAL_LORENZO.id,
  title: titulo,
  story: '',
  media_url: `/photos/lorenzo-chamba/${archivo}`,
  media_type: 'image',
  life_stage: 'general',
  is_public: true,
  created_at: MEMORIAL_LORENZO.created_at,
}));

export async function fetchMemorialBySlug(slug: string): Promise<Memorial | null> {
  // El memorial familiar local tiene una ruta propia; no se reutilizan identidades de muestra.
  if (slug === MEMORIAL_LORENZO.slug) return MEMORIAL_LORENZO;
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('memorials').select('*').eq('slug', slug).eq('is_public', true).maybeSingle();
  if (error) throw new Error('No se pudo cargar el memorial.');
  return data as Memorial | null;
}

export async function fetchMemoriesByMemorialId(memorialId: string): Promise<Memory[]> {
  if (memorialId === MEMORIAL_LORENZO.id) return RECUERDOS_LORENZO;
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('memories').select('*').eq('memorial_id', memorialId).eq('is_public', true).order('approximate_year', { ascending: true });
  if (error) throw new Error('No se pudieron cargar los recuerdos.');
  return (data ?? []) as Memory[];
}

