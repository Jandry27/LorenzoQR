import { MemorialExperience } from '../components/MemorialExperience';
import { MEMORIAL_LORENZO, RECUERDOS_LORENZO } from '../lib/data';
import { cargarAlbum } from '../lib/recuerdos-publicos';

export const dynamic = 'force-dynamic';

export default async function MemorialPage() {
  let album: Awaited<ReturnType<typeof cargarAlbum>>;
  try {
    album = await cargarAlbum(MEMORIAL_LORENZO.id);
  } catch (error) {
    console.error('Error cargando álbum en MemorialPage:', error);
    album = {
      editorial: { revision: '', dedicatoria: 'Hay recuerdos que nos vuelven a encontrar.', firma: '', legado: [] },
      memories: RECUERDOS_LORENZO,
      initialMemoryId: RECUERDOS_LORENZO[0]?.id,
      messages: [],
    };
  }
  return <MemorialExperience memorial={MEMORIAL_LORENZO} {...album} />;
}
