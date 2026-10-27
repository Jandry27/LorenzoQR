'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Music, Video } from 'lucide-react';
import { Memory } from '../lib/types';
import { Modal } from './Modal';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
}

export function CollectionModal({ isOpen, onClose, memories, onSelectMemory }: CollectionModalProps) {
  const [activeFilter, setActiveFilter] = useState('todos');
  if (!isOpen) return null;
  const labels: Record<string, string> = { todos: 'Todos', infancia: 'Infancia', juventud: 'Juventud', familia: 'En familia', legado: 'Legado', general: 'Otros recuerdos' };
  const filters = Object.entries(labels).filter(([key]) => key === 'todos' || memories.some(memory => memory.life_stage === key));
  const filtered = activeFilter === 'todos' ? memories : memories.filter(memory => memory.life_stage === activeFilter);
  return (
    <Modal title="El álbum de su vida" onClose={onClose}>
      <p className="modal-description">Fotografías del álbum de Lorenzo. Elige una para verla con calma.</p>
      {filters.length > 2 && <div className="album-filters" aria-label="Etapas de vida">
        {filters.map(([key, label]) => <button key={key} className="btn-chip" aria-pressed={activeFilter === key} onClick={() => setActiveFilter(key)}>{label}</button>)}
      </div>}
      <div className="memories-grid">
        {filtered.map(memory => (
          <button key={memory.id} className="grid-item" onClick={() => { onSelectMemory(memory); onClose(); }}>
            <span className="grid-image">{memory.media_type === 'image' ? <Image src={memory.media_url} alt="" fill sizes="(max-width: 560px) 45vw, 260px" className="grid-thumb" /> : memory.media_type === 'video' ? <Video aria-hidden="true" /> : <Music aria-hidden="true" />}</span>
            <span className="grid-meta"><span className="grid-meta-title">{memory.title}</span>{memory.approximate_year && <span className="grid-meta-year">Hacia {memory.approximate_year}</span>}</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="empty-state">Todavía no hay recuerdos en esta etapa.</p>}
    </Modal>
  );
}
