'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Memory } from '../lib/types';
import type { EditorialMemorial, FichaFotografia } from '../lib/editorial-types';

function fichaDe(memory: Memory, revision = ''): FichaFotografia {
  return { revision, titulo: memory.title, historia: memory.story, personas: memory.people || '', lugar: memory.location || '', autor: memory.author_name || '', anio: memory.approximate_year ?? null };
}

export function FamilyEditor({ initialEditorial, initialMemories, revisions }: { initialEditorial: EditorialMemorial; initialMemories: Memory[]; revisions: Record<string, string> }) {
  const [tab, setTab] = useState<'dedicatoria' | 'fotografias' | 'legado'>('dedicatoria');
  const [editorial, setEditorial] = useState(initialEditorial);
  const [guardado, setGuardado] = useState(initialEditorial);
  const [memories, setMemories] = useState(initialMemories);
  const [versiones, setVersiones] = useState(revisions);
  const [photoId, setPhotoId] = useState(initialMemories[0]?.id || '');
  const [ficha, setFicha] = useState(() => initialMemories[0] ? fichaDe(initialMemories[0], revisions[initialMemories[0].id]) : null);
  const [fichaGuardada, setFichaGuardada] = useState(ficha);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const editorialDirty = JSON.stringify(editorial) !== JSON.stringify(guardado);
  const photoDirty = JSON.stringify(ficha) !== JSON.stringify(fichaGuardada);
  const dirty = editorialDirty || photoDirty;
  const photo = memories.find(item => item.id === photoId);

  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);

  function changeEditorial(next: EditorialMemorial) { setEditorial(next); setNotice(''); setError(''); }
  function changePhoto(next: FichaFotografia) { setFicha(next); setNotice(''); setError(''); }
  async function guardarEditorial(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/familia/editorial', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editorial) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar.');
      setEditorial(result); setGuardado(result); setNotice('Guardado. Los cambios ya aparecen al abrir el memorial.');
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo conectar. Tu texto sigue aquí.'); }
    finally { setBusy(false); }
  }
  async function guardarFotografia(event: React.FormEvent) {
    event.preventDefault(); if (busy || !ficha || !photo) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/familia/fotografias/${photoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ficha) });
      const result: FichaFotografia & { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la historia.');
      setFicha(result); setFichaGuardada(result); setVersiones(all => ({ ...all, [photoId]: result.revision }));
      setMemories(all => all.map(item => item.id !== photoId ? item : { ...item, title: result.titulo, story: result.historia, people: result.personas, location: result.lugar, author_name: result.autor, approximate_year: result.anio ?? undefined }));
      setNotice('Historia guardada. Ya se puede leer en la fotografía del memorial.');
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo conectar. Tu texto sigue aquí.'); }
    finally { setBusy(false); }
  }
  function discard() { setEditorial(guardado); setFicha(fichaGuardada); setError(''); setNotice('Se conservaron los últimos textos guardados.'); }

  return <div className="admin-page family-editor"><div className="family-toolbar"><Link className="text-link" href="/admin"><ArrowLeft size={16} />Espacio familiar</Link><Link className="text-link" href="/m/lorenzo-chamba">Ver el memorial</Link></div><p className="eyebrow">LAS PALABRAS DE LA FAMILIA</p><h1>La historia que conservamos</h1><p className="panel-description">Completa solo lo que conoces. Las fechas, personas y anécdotas pueden quedarse vacías hasta que la familia las confirme.</p>
    <div className="editor-tabs" aria-label="Contenido del memorial">{([['dedicatoria', 'Dedicatoria'], ['fotografias', 'Historias de las fotos'], ['legado', 'Lo que nos dejó']] as const).map(([value, label]) => <button className="btn-chip" key={value} aria-pressed={tab === value} disabled={busy || (dirty && value !== tab)} onClick={() => { setTab(value); setNotice(''); setError(''); }}>{label}</button>)}</div>
    {dirty && <div className="editor-unsaved"><span>Hay cambios sin guardar. Guárdalos o descártalos antes de cambiar de sección.</span><button onClick={discard} disabled={busy}>Descartar cambios</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="editor-success" role="status">{notice}</p>}
    {tab === 'dedicatoria' && <form className="editor-surface" onSubmit={guardarEditorial}><h2>Una dedicatoria que lo represente</h2><p className="form-note">Puede ser una frase que Lorenzo decía o unas palabras elegidas por ustedes. La frase actual se conserva hasta que decidan cambiarla.</p><div className="form-group"><label className="form-label" htmlFor="dedication-text">Dedicatoria</label><textarea id="dedication-text" className="form-textarea" maxLength={1000} rows={4} value={editorial.dedicatoria} onChange={event => changeEditorial({ ...editorial, dedicatoria: event.target.value })} /></div><div className="form-group"><label className="form-label" htmlFor="dedication-author">Firma <span>(opcional)</span></label><input id="dedication-author" className="form-input" maxLength={150} value={editorial.firma} onChange={event => changeEditorial({ ...editorial, firma: event.target.value })} placeholder="Quién dedica estas palabras" /></div><p className="form-note">Si dejas la dedicatoria vacía, esa frase no se mostrará en la portada.</p><button className="btn-modal-action editor-save" disabled={busy || !editorialDirty}><Save size={16} />{busy ? 'Guardando…' : 'Guardar dedicatoria'}</button></form>}
    {tab === 'fotografias' && <div className="editor-surface"><h2>La historia detrás de cada foto</h2><div className="form-group"><label className="form-label" htmlFor="editor-photo">Fotografía</label><select id="editor-photo" className="form-input" value={photoId} disabled={busy || photoDirty} onChange={event => {
      const selected = memories.find(item => item.id === event.target.value);
      if (!selected) return;
      const next = fichaDe(selected, versiones[selected.id]); setPhotoId(selected.id); setFicha(next); setFichaGuardada(next); setNotice(''); setError('');
    }}>{memories.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
      {photo && ficha ? <div className="photo-editor-layout"><div className="editor-photo-preview"><Image src={photo.media_url} alt={photo.title} fill sizes="(max-width: 700px) 90vw, 350px" unoptimized={photo.media_url.startsWith('/api/')} /></div><form onSubmit={guardarFotografia}><div className="form-group"><label className="form-label" htmlFor="photo-title">Título</label><input id="photo-title" required maxLength={180} className="form-input" value={ficha.titulo} onChange={event => changePhoto({ ...ficha, titulo: event.target.value })} /></div><div className="form-group"><label className="form-label" htmlFor="photo-story">La historia de este momento</label><textarea id="photo-story" className="form-textarea" maxLength={5000} rows={6} value={ficha.historia} onChange={event => changePhoto({ ...ficha, historia: event.target.value })} placeholder="Qué recuerdan de esta fotografía…" /></div><div className="form-group"><label className="form-label" htmlFor="photo-people">Quiénes aparecen <span>(opcional)</span></label><input id="photo-people" className="form-input" maxLength={500} value={ficha.personas} onChange={event => changePhoto({ ...ficha, personas: event.target.value })} /></div><div className="editor-two-fields"><div className="form-group"><label className="form-label" htmlFor="photo-year">Año aproximado <span>(opcional)</span></label><input id="photo-year" className="form-input" type="number" min={1800} max={new Date().getFullYear()} value={ficha.anio ?? ''} onChange={event => changePhoto({ ...ficha, anio: event.target.value === '' ? null : Number(event.target.value) })} /></div><div className="form-group"><label className="form-label" htmlFor="photo-place">Lugar <span>(opcional)</span></label><input id="photo-place" className="form-input" maxLength={150} value={ficha.lugar} onChange={event => changePhoto({ ...ficha, lugar: event.target.value })} /></div></div><div className="form-group"><label className="form-label" htmlFor="photo-author">Quién compartió la historia <span>(opcional)</span></label><input id="photo-author" className="form-input" maxLength={150} value={ficha.autor} onChange={event => changePhoto({ ...ficha, autor: event.target.value })} /></div><button className="btn-modal-action editor-save" disabled={busy || !photoDirty}><Save size={16} />{busy ? 'Guardando…' : 'Guardar historia'}</button></form></div> : <p className="empty-state">Todavía no hay fotografías publicadas para editar.</p>}</div>}
    {tab === 'legado' && <form className="editor-surface" onSubmit={guardarEditorial}><h2>Lo que nos dejó</h2><p className="form-note">Sus enseñanzas, una expresión que repetía, un gesto que recuerdan. Publica sus palabras tal como las conserva la familia.</p>{!editorial.legado.length && <p className="legacy-editor-empty">Todavía no hay textos escritos. Puedes añadir el primero cuando quieran compartirlo.</p>}{editorial.legado.map((item, index) => <fieldset className="legacy-editor-item" key={item.id || `nuevo-${index}`}><legend>Recuerdo {index + 1}</legend><div className="form-group"><label className="form-label" htmlFor={`legacy-title-${index}`}>Título</label><input id={`legacy-title-${index}`} className="form-input" required maxLength={100} value={item.titulo} onChange={event => changeEditorial({ ...editorial, legado: editorial.legado.map((value, i) => i === index ? { ...value, titulo: event.target.value } : value) })} /></div><div className="form-group"><label className="form-label" htmlFor={`legacy-body-${index}`}>Palabras de la familia</label><textarea id={`legacy-body-${index}`} className="form-textarea" required maxLength={1200} rows={4} value={item.texto} onChange={event => changeEditorial({ ...editorial, legado: editorial.legado.map((value, i) => i === index ? { ...value, texto: event.target.value } : value) })} /></div><div className="form-group"><label className="form-label" htmlFor={`legacy-author-${index}`}>Firma <span>(opcional)</span></label><input id={`legacy-author-${index}`} className="form-input" maxLength={150} value={item.autor} onChange={event => changeEditorial({ ...editorial, legado: editorial.legado.map((value, i) => i === index ? { ...value, autor: event.target.value } : value) })} /></div><button type="button" className="text-link" onClick={() => changeEditorial({ ...editorial, legado: editorial.legado.filter((_, i) => i !== index) })}><Trash2 size={14} />Quitar de esta sección</button></fieldset>)}<div className="legacy-editor-actions"><button type="button" className="btn-secondary" disabled={busy || editorial.legado.length >= 12} onClick={() => changeEditorial({ ...editorial, legado: [...editorial.legado, { id: '', titulo: '', texto: '', autor: '' }] })}><Plus size={16} />Añadir un recuerdo</button><button className="btn-modal-action editor-save" disabled={busy || !editorialDirty}><Save size={16} />{busy ? 'Guardando…' : 'Guardar «Lo que nos dejó»'}</button></div></form>}
  </div>;
}
