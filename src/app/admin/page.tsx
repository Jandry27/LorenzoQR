import { FamilyLogin, FamilyPanel } from '../../components/FamilyPanel';
import { sesionFamiliar } from '../../lib/familia-auth';
import { listarRecuerdos } from '../../lib/recuerdos-store';

export const dynamic = 'force-dynamic';
export default async function FamilyPage() {
  return await sesionFamiliar() ? <FamilyPanel initial={await listarRecuerdos()} /> : <FamilyLogin />;
}
