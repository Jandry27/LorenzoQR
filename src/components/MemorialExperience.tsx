'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Camera, LockKeyhole } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { MemorialHero } from './MemorialHero';
import { SmartDiscoveryCard } from './SmartDiscoveryCard';
import { CollectionModal } from './CollectionModal';
import { TributeModal } from './TributeModal';
import { selectNextDiscoveryMemory, markMemoryAsViewed, getRecentlyViewedIds } from '../lib/discovery';
import { Memorial, Memory } from '../lib/types';
import type { EditorialMemorial } from '../lib/editorial-types';
import { LegacySection } from './LegacySection';
import { ReadingOptions, useReadingPreferences } from './ReadingOptions';
import { DeveloperFooter } from './DeveloperContact';
import { MemorialBackground } from './MemorialBackground';
import { useAnimacionMemorial } from './useAnimacionMemorial';

type Mensaje = { id: string; author_name: string; message: string };
export function MemorialExperience({ memorial, memories, initialMemoryId, messages = [], editorial }: { editorial: EditorialMemorial; memorial: Memorial; memories: Memory[]; initialMemoryId?: string; messages?: Mensaje[] }) {
  const [currentMemory, setCurrentMemory] = useState<Memory | undefined>(memories.find(memory => memory.id === initialMemoryId) || memories[0]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [modal, setModal] = useState<'album' | 'tribute' | 'reading' | null>(null);
  const { preferences, update: updateReading } = useReadingPreferences();
  const raiz = useRef<HTMLDivElement>(null);
  useAnimacionMemorial(raiz, preferences.movimientoReducido);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef<Memory | undefined>(undefined);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!initialized.current && memories.length) {
      const initial = memories.find(memory => memory.id === initialMemoryId) || memories[0];
      const next = getRecentlyViewedIds(memorial.id).includes(initial.id) ? selectNextDiscoveryMemory(memories, memorial.id) : initial;
      markMemoryAsViewed(memorial.id, next.id, memories.length);
      initialized.current = next;
    }
    if (initialized.current) timer.current = setTimeout(() => setCurrentMemory(initialized.current), 0);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [memories, memorial.id, initialMemoryId]);

  function discoverNext() {
    if (isDiscovering || !currentMemory) return;
    setIsDiscovering(true);
    timer.current = setTimeout(() => {
      setCurrentMemory(selectNextDiscoveryMemory(memories, memorial.id, currentMemory.id));
      setIsDiscovering(false);
    }, preferences.movimientoReducido || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200);
  }

  function selectMemory(memory: Memory, scrollToSection = true) {
    if (timer.current) clearTimeout(timer.current);
    setIsDiscovering(false);
    setCurrentMemory(memory);
    markMemoryAsViewed(memorial.id, memory.id, memories.length);
    if (scrollToSection) section.current?.scrollIntoView({ behavior: preferences.movimientoReducido || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  return <div ref={raiz} className="memorial-experience" data-reading={preferences.tamano} data-contrast={preferences.contraste ? 'high' : 'normal'} data-motion={preferences.movimientoReducido ? 'reduced' : 'system'}>
    <MemorialBackground />
    <AppHeader memorial={memorial} onOpenReading={() => setModal('reading')} />
    <MemorialHero memorial={memorial} onOpenTribute={() => setModal('tribute')} dedicatoria={editorial.dedicatoria} firma={editorial.firma} />
    <div className="memorial-body">
      <section className="memories-section" id="recuerdos" aria-labelledby="memories-title" ref={section}>
        <div className="section-heading"><div><p className="eyebrow">SU VIDA, EN PEQUEÑOS INSTANTES</p><h2 id="memories-title">Volver a recordarlo.</h2></div><button className="text-link" onClick={() => setModal('album')}>Ver el álbum <ArrowUpRight size={17} aria-hidden="true" /></button></div>
        {currentMemory ? <SmartDiscoveryCard reduceMotion={preferences.movimientoReducido} currentMemory={currentMemory} onDiscoverNext={discoverNext} isDiscovering={isDiscovering} memories={memories} onSelectMemory={memory => selectMemory(memory, false)} onOpenTribute={() => setModal('tribute')} /> : <p className="empty-state">La familia está preparando los primeros recuerdos.</p>}
      </section>
      {messages.length > 0 && <section className="written-memories" aria-labelledby="written-title"><p className="eyebrow">PALABRAS QUE PERMANECEN</p><h2 id="written-title">Así lo recordamos</h2>{messages.map(message => <blockquote key={message.id}><p>{message.message}</p><cite>{message.author_name}</cite></blockquote>)}</section>}
      <LegacySection items={editorial.legado} />
      <section className="share-invitation" aria-labelledby="share-title"><div className="invitation-icon"><Camera size={27} strokeWidth={1.2} aria-hidden="true" /></div><div><p className="eyebrow">UN RECUERDO TUYO, PARA TODOS</p><h2 id="share-title">¿Tienes una foto con Lorenzo?</h2><p>Una foto juntos. Algo que te enseñó. Esa anécdota que todavía te hace sonreír. También puede vivir aquí.</p><button onClick={() => setModal('tribute')}>Añadir mi recuerdo <ArrowUpRight size={17} aria-hidden="true" /></button><small>La familia revisará cada aportación antes de publicarla.</small></div></section>
      <footer className="memorial-footer"><DeveloperFooter /><div className="footer-meta"><p>En memoria de {memorial.full_name}</p><Link href="/admin"><LockKeyhole size={12} aria-hidden="true" />Espacio de la familia</Link></div></footer>
    </div>
    {modal === 'album' && <CollectionModal isOpen onClose={() => setModal(null)} memories={memories} onSelectMemory={selectMemory} />}
    {modal === 'tribute' && <TributeModal isOpen onClose={() => setModal(null)} memorialId={memorial.id} />}
    {modal === 'reading' && <ReadingOptions preferences={preferences} onChange={updateReading} onClose={() => setModal(null)} />}
  </div>;
}
