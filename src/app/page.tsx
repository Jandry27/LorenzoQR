import { MemorialExperience } from '../components/MemorialExperience';
import { MEMORIAL_LORENZO } from '../lib/data';
import { cargarAlbum } from '../lib/recuerdos-publicos';

export const dynamic = 'force-dynamic';
export default async function MemorialPage() {
  return <MemorialExperience memorial={MEMORIAL_LORENZO} {...await cargarAlbum(MEMORIAL_LORENZO.id)} />;
}
