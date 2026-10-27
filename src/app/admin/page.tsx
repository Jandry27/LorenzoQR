import { FamilyLogin, FamilyPanel } from '../../components/FamilyPanel';
import { sesionFamiliar } from '../../lib/familia-auth';
import { cargarAlbumAdmin } from '../../lib/recuerdos-publicos';
import { MEMORIAL_ID } from '../../lib/recuerdos-store';

export const dynamic = 'force-dynamic';

export default async function FamilyPage() {
  if (!await sesionFamiliar()) return <FamilyLogin />;
  const adminData = await cargarAlbumAdmin(MEMORIAL_ID);
  return (
    <FamilyPanel
      initialRecuerdos={adminData.aportaciones}
      initialEditorial={adminData.editorial}
      initialMemories={adminData.memories}
      initialFichas={adminData.fichas}
    />
  );
}
