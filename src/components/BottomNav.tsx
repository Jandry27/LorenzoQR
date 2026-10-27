'use client';

import { BookOpen, Heart, Home, Share2 } from 'lucide-react';

interface BottomNavProps {
  onOpenCollection: () => void;
  onOpenTribute: () => void;
  onOpenQR: () => void;
  activeTab?: 'discover' | 'album' | 'tribute' | 'qr';
}

export function BottomNav({ onOpenCollection, onOpenTribute, onOpenQR, activeTab = 'discover' }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navegación del memorial">
      <a className={`bottom-nav-item ${activeTab === 'discover' ? 'active' : ''}`} href="#contenido" aria-current={activeTab === 'discover' ? 'page' : undefined}><Home size={19} strokeWidth={1.5} /><span>Memorial</span></a>
      <button className={`bottom-nav-item ${activeTab === 'album' ? 'active' : ''}`} onClick={onOpenCollection}><BookOpen size={19} strokeWidth={1.5} /><span>Álbum</span></button>
      <button className={`bottom-nav-item ${activeTab === 'tribute' ? 'active' : ''}`} onClick={onOpenTribute}><Heart size={19} strokeWidth={1.5} /><span>Tu recuerdo</span></button>
      <button className={`bottom-nav-item ${activeTab === 'qr' ? 'active' : ''}`} onClick={onOpenQR}><Share2 size={19} strokeWidth={1.5} /><span>Compartir</span></button>
    </nav>
  );
}
