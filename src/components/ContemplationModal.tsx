'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Memory } from '../lib/types';
import { Modal } from './Modal';
import { CrossfadeImage } from './CrossfadeImage';
import { PhotoHistory } from './PhotoHistory';

export function ContemplationModal({ memory, memories, initialStory = false, onSelect, onClose }: { memory: Memory; memories: Memory[]; initialStory?: boolean; onSelect: (memory: Memory) => void; onClose: () => void }) {
  const [storyOpen, setStoryOpen] = useState(initialStory);
  const index = memories.findIndex(item => item.id === memory.id);
  function mover(paso: number) {
    if (memories.length > 1) onSelect(memories[(index + paso + memories.length) % memories.length]);
  }
  return <Modal title="Un momento para recordar" variant="contemplation" onClose={onClose} onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); mover(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); mover(-1); }
  }}>
    <div className={`contemplation-body ${storyOpen ? 'with-story' : ''}`}>
      <div className="contemplation-photo"><CrossfadeImage src={memory.media_url} alt={memory.title} sizes="(max-width: 700px) 100vw, 85vw" /></div>
      {storyOpen && <aside className="contemplation-story" aria-label="Historia de la fotografía"><PhotoHistory memory={memory} /></aside>}
    </div>
    <div className="contemplation-toolbar"><button onClick={() => mover(-1)} disabled={memories.length < 2} aria-label="Fotografía anterior"><ArrowLeft size={20} /></button><span className="contemplation-position" role="status">{index + 1} / {memories.length}</span><button onClick={() => mover(1)} disabled={memories.length < 2} aria-label="Fotografía siguiente"><ArrowRight size={20} /></button><button className="contemplation-story-toggle" aria-pressed={storyOpen} onClick={() => setStoryOpen(value => !value)}><BookOpen size={17} aria-hidden="true" /><span>{storyOpen ? 'Ocultar historia' : 'Ver su historia'}</span></button></div>
    <p className="contemplation-caption">{memory.title}</p>
  </Modal>;
}
