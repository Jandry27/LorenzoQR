import Image from 'next/image';
import type { LegadoItem } from '../lib/editorial-types';
import { MARCA } from '../lib/marca';

export function LegacySection({ items }: { items: LegadoItem[] }) {
  return <section className="legacy-section" aria-labelledby="legacy-title"><Image className="legacy-brand-symbol" src={MARCA.simbolo} width={26} height={39} alt="" unoptimized /><p className="eyebrow">SU HUELLA EN NOSOTROS</p><h2 id="legacy-title">Lo que nos dejó</h2>
    {items.length ? <article className="legacy-story" aria-label="La historia que guardamos de Lorenzo">{items.map(item => <section className="legacy-passage" key={item.id}><h3 className="sr-only">{item.titulo}</h3><p className="legacy-body">{item.texto}</p>{item.autor && <p className="legacy-author">{item.autor}</p>}</section>)}</article> : <p className="legacy-empty">La familia está reuniendo sus enseñanzas, sus frases y esos pequeños gestos que seguimos recordando.</p>}
  </section>;
}
