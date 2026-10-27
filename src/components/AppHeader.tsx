'use client';

import Image from 'next/image';
import { Memorial } from '../lib/types';
import { MARCA } from '../lib/marca';

export function AppHeader({ memorial, onOpenReading }: { memorial: Memorial; onOpenReading: () => void }) {
  return <div className="cover-topbar">
    <a href="#contenido" className="memorial-wordmark" aria-label={`${MARCA.nombre} · Memorial de ${memorial.full_name}`}>
      <Image className="brand-symbol" src={MARCA.simbolo} width={32} height={48} alt="" unoptimized />
      <span className="brand-lockup"><span className="brand-name">{MARCA.nombre}</span><span className="brand-note">{MARCA.lema}</span></span>
    </a>
    <div className="topbar-actions"><button className="glass-button reading-button" onClick={onOpenReading} aria-label="Opciones de lectura" aria-haspopup="dialog"><span aria-hidden="true">Aa</span></button></div>
  </div>;
}
