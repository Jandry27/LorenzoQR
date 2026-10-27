'use client';

import { useState } from 'react';
import { ArrowUpRight, BookOpen, Maximize2, Shuffle } from 'lucide-react';
import { Memory } from '../lib/types';
import { PhotoRing } from './PhotoRing';
import { ContemplationModal } from './ContemplationModal';

export function SmartDiscoveryCard({ currentMemory, memories, onDiscoverNext, isDiscovering, onOpenTribute, onSelectMemory, reduceMotion }: { currentMemory: Memory; memories: Memory[]; onDiscoverNext: () => void; isDiscovering: boolean; onOpenTribute: () => void; onSelectMemory: (memory: Memory) => void; reduceMotion: boolean }) {
  const [view, setView] = useState<'photo' | 'story' | null>(null);
  return <>
    <PhotoRing currentMemory={currentMemory} memories={memories} onSelect={onSelectMemory} onOpen={() => setView('photo')} reduceMotion={reduceMotion} />
    <div className="memory-below" id="active-discovery-card">
      <p className="photo-byline">{currentMemory.author_name ? `Compartido por ${currentMemory.author_name}` : 'Del álbum de Lorenzo'}</p>
      <div className="photo-view-actions"><button onClick={() => setView('photo')}><Maximize2 size={14} aria-hidden="true" />Ver en calma</button><button onClick={() => setView('story')}><BookOpen size={14} aria-hidden="true" />La historia de esta foto</button></div>
      <div className="memory-navigation"><span className="carousel-line" aria-hidden="true" /><button className="glass-button next-memory" onClick={onDiscoverNext} disabled={isDiscovering || memories.length < 2} id="btn-discover-next"><Shuffle size={16} strokeWidth={1.5} aria-hidden="true" />{isDiscovering ? 'Un momento…' : 'Descubrir otro recuerdo'}</button><span className="carousel-line" aria-hidden="true" /></div>
      <p className="carousel-note">Un orden distinto en cada visita. Un recuerdo de siempre.</p>
      <button className="memory-contribute" onClick={onOpenTribute}>Yo también tengo un recuerdo <ArrowUpRight size={13} aria-hidden="true" /></button>
    </div>
    <span className="sr-only" role="status">Fotografía: {currentMemory.title}</span>
    {view && <ContemplationModal memory={currentMemory} memories={memories} initialStory={view === 'story'} onSelect={onSelectMemory} onClose={() => setView(null)} />}
  </>;
}

