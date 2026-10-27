import { FamilyLogin } from '../../../components/FamilyPanel';
import { FamilyEditor } from '../../../components/FamilyEditor';
import { sesionFamiliar } from '../../../lib/familia-auth';
import { leerFichas } from '../../../lib/editorial-store';
import { cargarAlbum } from '../../../lib/recuerdos-publicos';
import { MEMORIAL_ID } from '../../../lib/recuerdos-store';

export const dynamic = 'force-dynamic';
export default async function AlbumEditorPage() {
  if (!await sesionFamiliar()) return <FamilyLogin />;
  const [album, fichas] = await Promise.all([cargarAlbum(MEMORIAL_ID), leerFichas()]);
  return <FamilyEditor initialEditorial={album.editorial} initialMemories={album.memories} revisions={Object.fromEntries(Object.entries(fichas).map(([id, ficha]) => [id, ficha.revision]))} />;
}
