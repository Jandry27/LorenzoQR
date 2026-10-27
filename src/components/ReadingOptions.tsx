'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from './Modal';
import type { PreferenciasLectura, TamanoLectura } from '../lib/editorial-types';

const DEFAULT: PreferenciasLectura = { tamano: 'normal', contraste: false, movimientoReducido: false };
const KEY = 'memorial_preferencias_lectura_v1';
export function useReadingPreferences() {
  const [preferences, setPreferences] = useState(DEFAULT);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (saved && typeof saved === 'object') setPreferences({ tamano: ['normal', 'grande', 'muy-grande'].includes(saved.tamano) ? saved.tamano : 'normal', contraste: saved.contraste === true, movimientoReducido: saved.movimientoReducido === true });
      } catch { /* La lectura se puede ajustar aunque el navegador no permita guardarla. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function update(next: PreferenciasLectura) {
    setPreferences(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }
  return { preferences, update };
}

export function ReadingOptions({ preferences, onChange, onClose }: { preferences: PreferenciasLectura; onChange: (preferences: PreferenciasLectura) => void; onClose: () => void }) {
  return <Modal title="Leer con comodidad" onClose={onClose}><p className="modal-description">Ajusta el memorial a tu forma de leer. Recordaremos tu elección en este dispositivo.</p>
    <fieldset className="reading-fieldset"><legend>Tamaño del texto</legend><div className="reading-sizes">{([['normal', 'Normal'], ['grande', 'Grande'], ['muy-grande', 'Muy grande']] as [TamanoLectura, string][]).map(([value, label]) => <button type="button" key={value} aria-pressed={preferences.tamano === value} className="btn-chip" onClick={() => onChange({ ...preferences, tamano: value })}>{label}</button>)}</div></fieldset>
    <button type="button" className="reading-toggle" aria-pressed={preferences.contraste} onClick={() => onChange({ ...preferences, contraste: !preferences.contraste })}><span><strong>Más contraste</strong><small>Texto más oscuro y superficies más definidas.</small></span><span className={`reading-check ${preferences.contraste ? 'checked' : ''}`} aria-hidden="true">{preferences.contraste && <Check size={16} />}</span></button>
    <button type="button" className="reading-toggle" aria-pressed={preferences.movimientoReducido} onClick={() => onChange({ ...preferences, movimientoReducido: !preferences.movimientoReducido })}><span><strong>Reducir movimiento</strong><small>Transiciones sencillas para mirar con calma.</small></span><span className={`reading-check ${preferences.movimientoReducido ? 'checked' : ''}`} aria-hidden="true">{preferences.movimientoReducido && <Check size={16} />}</span></button>
    <button type="button" className="text-link reading-reset" onClick={() => onChange({ ...DEFAULT })}>Restablecer opciones</button>
  </Modal>;
}
