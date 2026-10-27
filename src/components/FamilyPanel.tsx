'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole, LogOut, RotateCcw } from 'lucide-react';
import type { RecuerdoEnviado } from '../lib/recuerdos-store';

export function FamilyLogin() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <div className="family-login"><Link className="text-link" href="/m/lorenzo-chamba"><ArrowLeft size={16} />Volver al memorial</Link><LockKeyhole size={30} strokeWidth={1.2} /><h1>Espacio de la familia</h1><p>Un lugar para revisar las fotografías y palabras que nos comparten sobre Lorenzo.</p><form onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError('');
    const clave = new FormData(event.currentTarget).get('clave');
    try {
      const response = await fetch('/api/familia/sesion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clave }) });
      if (response.ok) window.location.reload();
      else { const result = await response.json(); setError(result.error || 'No pudimos abrir el espacio familiar.'); }
    } catch { setError('No se pudo conectar. Inténtalo de nuevo.'); }
    finally { setBusy(false); }
  }}><label className="form-label" htmlFor="family-key">Clave de acceso familiar</label><input id="family-key" className="form-input" type="password" name="clave" autoComplete="current-password" required maxLength={200} /><p className="form-note">Pide la clave a la persona que prepara el memorial.</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn-modal-action" disabled={busy}>{busy ? 'Abriendo…' : 'Entrar al espacio familiar'}</button></form></div>;
}

export function FamilyPanel({ initial }: { initial: RecuerdoEnviado[] }) {
  const [recuerdos, setRecuerdos] = useState(initial);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function revisar(id: string, status: 'approved' | 'rejected') {
    if (busy) return;
    setBusy(id); setError('');
    try {
      const response = await fetch(`/api/familia/recuerdos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error('No pudimos guardar la revisión. Comprueba que tu sesión siga abierta.');
      const updated: RecuerdoEnviado = await response.json();
      setRecuerdos(all => all.map(item => item.id === id ? updated : item));
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    finally { setBusy(''); }
  }
  return <div className="admin-page"><div className="family-toolbar"><Link className="text-link" href="/m/lorenzo-chamba"><ArrowLeft size={16} />Volver al memorial</Link><button className="text-link" onClick={async () => { const response = await fetch('/api/familia/sesion', { method: 'DELETE' }); if (response.ok) window.location.reload(); else setError('No pudimos cerrar la sesión. Inténtalo de nuevo.'); }}><LogOut size={16} />Cerrar sesión</button></div><p className="eyebrow">MEMORIAL DE LORENZO CHAMBA</p><h1>Recuerdos que nos comparten</h1><p className="panel-description">Aprueba los que pueden formar parte del memorial. Los que conserves sin publicar seguirán disponibles aquí.</p><Link className="glass-button family-editor-link" href="/admin/album">Editar historias, dedicatoria y legado</Link><div className="album-filters">{([['pending', 'Por revisar'], ['approved', 'Publicados'], ['rejected', 'Sin publicar']] as const).map(([value, label]) => <button className="btn-chip" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} · {recuerdos.filter(item => item.status === value).length}</button>)}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="review-list">{recuerdos.filter(item => item.status === filter).map(item => <article className="review-card" key={item.id}>{item.has_photo && <Image src={`/api/recuerdos/${item.id}/foto`} alt={`Fotografía compartida por ${item.author_name}`} width={600} height={450} unoptimized />}<div><h2>{item.author_name}</h2>{item.author_relationship && <p className="form-note">{item.author_relationship}</p>}<p className="review-message">{item.message}</p><div className="review-actions">{item.status !== 'approved' && <button className="btn-modal-action" disabled={Boolean(busy)} onClick={() => revisar(item.id, 'approved')}><Check size={16} />Aprobar y publicar</button>}{item.status !== 'rejected' && <button className="btn-secondary" disabled={Boolean(busy)} onClick={() => revisar(item.id, 'rejected')}><RotateCcw size={16} />Conservar sin publicar</button>}</div></div></article>)}</div>{!recuerdos.some(item => item.status === filter) && <p className="empty-state">No hay recuerdos en esta sección.</p>}<p className="local-storage-note">Estos recuerdos se conservan en la Mac que mantiene abierto el memorial. Guarda una copia de esa carpeta antes de trasladar el proyecto.</p></div>;
}
