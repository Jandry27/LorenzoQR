import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Memorial } from '../lib/types';

function fecha(value: string) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

export function MemorialHero({ memorial, onOpenTribute, dedicatoria, firma }: { memorial: Memorial; onOpenTribute: () => void; dedicatoria: string; firma: string }) {
  return <header className="memorial-cover">
    <div className="memorial-portrait-frame"><Image src={memorial.cover_image_url} alt={`Retrato conmemorativo de ${memorial.full_name}`} width={172} height={216} preload sizes="(max-width: 700px) 150px, 172px" className="memorial-portrait" /></div>
    <div className="identity-text"><p className="eyebrow">EN MEMORIA DE</p><h1>{memorial.full_name}</h1><p className="identity-dates"><time dateTime={memorial.birth_date}>{fecha(memorial.birth_date)}</time><span aria-hidden="true">—</span><time dateTime={memorial.death_date}>{fecha(memorial.death_date)}</time></p><span className="identity-signature">Siempre cerca, de otra manera.</span></div>
    {dedicatoria && <blockquote className="cover-message"><p>{dedicatoria}</p>{firma && <cite>{firma}</cite>}</blockquote>}
    <button className="glass-button cover-contribute" onClick={onOpenTribute}><Heart size={15} strokeWidth={1.5} aria-hidden="true" /> Dejar un recuerdo</button>
  </header>;
}
