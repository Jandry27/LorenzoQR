import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MemorialExperience } from '../../../components/MemorialExperience';
import { fetchMemorialBySlug } from '../../../lib/data';

import { cargarAlbum } from '../../../lib/recuerdos-publicos';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const memorial = await fetchMemorialBySlug(slug);
  if (!memorial) return { title: 'Memorial no encontrado' };
  return { title: `${memorial.full_name} · En su memoria`, description: memorial.epitaph };
}

export default async function MemorialSlugPage({ params }: Props) {
  const { slug } = await params;
  const memorial = await fetchMemorialBySlug(slug);
  if (!memorial) notFound();
  return <MemorialExperience memorial={memorial} {...await cargarAlbum(memorial.id)} />;
}
