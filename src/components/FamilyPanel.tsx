'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LockKeyhole,
  LogOut,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UploadCloud,
  X,
  BookOpen,
  Edit3,
  QrCode
} from 'lucide-react';
import type { RecuerdoEnviado } from '../lib/recuerdos-store';
import type { EditorialMemorial, FichaFotografia } from '../lib/editorial-types';
import type { Memory } from '../lib/types';

export function FamilyLogin() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="family-login">
      <Link className="text-link" href="/">
        <ArrowLeft size={16} /> Volver al memorial
      </Link>
      <LockKeyhole size={30} strokeWidth={1.2} />
      <h1>Espacio de la familia</h1>
      <p>Un lugar para administrar las fotografías, revisar recuerdos y editar las palabras sobre Lorenzo.</p>
      <form
        onSubmit={async event => {
          event.preventDefault();
          setBusy(true);
          setError('');
          const clave = new FormData(event.currentTarget).get('clave');
          try {
            const response = await fetch('/api/familia/sesion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clave }),
            });
            if (response.ok) {
              window.location.reload();
            } else {
              const result = await response.json();
              setError(result.error || 'No pudimos abrir el espacio familiar.');
            }
          } catch {
            setError('No se pudo conectar. Inténtalo de nuevo.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="form-label" htmlFor="family-key">
          Clave de acceso familiar
        </label>
        <input
          id="family-key"
          className="form-input"
          type="password"
          name="clave"
          autoComplete="current-password"
          required
          maxLength={200}
        />
        <p className="form-note">Ingresa la clave familiar que configuraste para el memorial.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn-modal-action" disabled={busy}>
          {busy ? 'Abriendo…' : 'Entrar al espacio familiar'}
        </button>
      </form>
    </div>
  );
}

type AdminMemory = Memory & { oculta?: boolean };

export function FamilyPanel({
  initialRecuerdos,
  initialEditorial,
  initialMemories,
  initialFichas,
}: {
  initialRecuerdos: RecuerdoEnviado[];
  initialEditorial: EditorialMemorial;
  initialMemories: AdminMemory[];
  initialFichas: Record<string, FichaFotografia>;
}) {
  const [activeTab, setActiveTab] = useState<'recuerdos' | 'fotos' | 'editorial'>('recuerdos');
  const [recuerdos, setRecuerdos] = useState(initialRecuerdos);
  const [filterRecuerdos, setFilterRecuerdos] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [memories, setMemories] = useState(initialMemories);
  const [filterFotos, setFilterFotos] = useState<'todas' | 'visibles' | 'ocultas'>('todas');
  const [fichas, setFichas] = useState(initialFichas);
  const [editorial, setEditorial] = useState(initialEditorial);
  const [editingPhoto, setEditingPhoto] = useState<AdminMemory | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Contadores
  const pendientesCount = recuerdos.filter(r => r.status === 'pending').length;
  const fotosVisiblesCount = memories.filter(m => !m.oculta).length;
  const fotosOcultasCount = memories.filter(m => m.oculta).length;

  // Acciones de Recuerdos (Moderación)
  async function revisarRecuerdo(id: string, status: 'approved' | 'rejected') {
    if (busy) return;
    setBusy(id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/familia/recuerdos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('No pudimos guardar la revisión.');
      const updated: RecuerdoEnviado = await response.json();
      setRecuerdos(all => all.map(item => (item.id === id ? updated : item)));

      // Si tiene foto y se aprueba, agregarlo a memories si no está
      if (updated.has_photo && status === 'approved') {
        setMemories(prev => {
          if (prev.some(m => m.id === id)) {
            return prev.map(m => (m.id === id ? { ...m, is_public: true, oculta: false } : m));
          }
          return [
            ...prev,
            {
              id: updated.id,
              memorial_id: updated.memorial_id,
              title: `Un recuerdo de ${updated.author_name}`,
              story: updated.message,
              media_url: `/api/recuerdos/${updated.id}/foto`,
              media_type: 'image',
              life_stage: 'general',
              author_name: updated.author_name,
              is_public: true,
              created_at: updated.created_at,
              oculta: false,
            },
          ];
        });
      } else if (status === 'rejected') {
        setMemories(prev => prev.map(m => (m.id === id ? { ...m, is_public: false, oculta: true } : m)));
      }

      setNotice(
        status === 'approved'
          ? 'Recuerdo aprobado y publicado en el memorial.'
          : 'Recuerdo conservado en privado para la familia.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la revisión.');
    } finally {
      setBusy('');
    }
  }

  async function borrarRecuerdo(id: string) {
    if (busy) return;
    if (!window.confirm('¿Seguro que deseas eliminar definitivamente este recuerdo? Esta acción no se puede deshacer.')) {
      return;
    }
    setBusy(id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/familia/recuerdos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No pudimos eliminar el recuerdo.');
      setRecuerdos(all => all.filter(item => item.id !== id));
      setMemories(all => all.filter(item => item.id !== id));
      setNotice('Recuerdo eliminado definitivamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    } finally {
      setBusy('');
    }
  }

  // Acciones de Fotografías
  async function toggleOcultarFoto(photo: AdminMemory) {
    if (busy) return;
    setBusy(photo.id);
    setError('');
    setNotice('');
    const fichaActual = fichas[photo.id] || {
      revision: '',
      titulo: photo.title,
      historia: photo.story,
      personas: photo.people || '',
      lugar: photo.location || '',
      autor: photo.author_name || '',
      anio: photo.approximate_year ?? null,
      oculta: false,
    };
    const nuevoEstadoOculta = !photo.oculta;
    const nuevaFicha: FichaFotografia = {
      ...fichaActual,
      oculta: nuevoEstadoOculta,
    };

    try {
      const response = await fetch(`/api/familia/fotografias/${photo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaFicha),
      });
      if (!response.ok) throw new Error('No pudimos actualizar la visibilidad de la foto.');
      const result: FichaFotografia = await response.json();
      setFichas(all => ({ ...all, [photo.id]: result }));
      setMemories(all => all.map(m => (m.id === photo.id ? { ...m, oculta: nuevoEstadoOculta } : m)));
      setNotice(
        nuevoEstadoOculta
          ? 'Fotografía oculta: ya no aparecerá en el memorial público.'
          : 'Fotografía visible: ya aparece publicada en el memorial público.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar visibilidad.');
    } finally {
      setBusy('');
    }
  }

  async function guardarFichaEditada(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !editingPhoto) return;
    setBusy('saving-photo');
    setError('');
    setNotice('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const titulo = (formData.get('titulo') as string)?.trim() || editingPhoto.title;
    const historia = (formData.get('historia') as string)?.trim() || '';
    const personas = (formData.get('personas') as string)?.trim() || '';
    const lugar = (formData.get('lugar') as string)?.trim() || '';
    const autor = (formData.get('autor') as string)?.trim() || '';
    const anioRaw = (formData.get('anio') as string)?.trim();
    const anio = anioRaw ? Number(anioRaw) : null;
    const oculta = formData.get('oculta') === 'on';

    const fichaActual = fichas[editingPhoto.id];
    const nuevaFicha = {
      revision: fichaActual?.revision || '',
      titulo,
      historia,
      personas,
      lugar,
      autor,
      anio,
      oculta,
    };

    try {
      const response = await fetch(`/api/familia/fotografias/${editingPhoto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaFicha),
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'No se pudo guardar la fotografía.');
      }
      const result: FichaFotografia = await response.json();
      setFichas(all => ({ ...all, [editingPhoto.id]: result }));
      setMemories(all =>
        all.map(m =>
          m.id === editingPhoto.id
            ? {
                ...m,
                title: result.titulo,
                story: result.historia,
                people: result.personas || undefined,
                location: result.lugar || undefined,
                author_name: result.autor || undefined,
                approximate_year: result.anio ?? undefined,
                oculta: result.oculta,
              }
            : m
        )
      );
      setEditingPhoto(null);
      setNotice('Fotografía e historia actualizadas con éxito.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la fotografía.');
    } finally {
      setBusy('');
    }
  }

  async function subirNuevaFoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy('uploading-photo');
    setError('');
    setNotice('');

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/familia/fotografias', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'No pudimos subir la fotografía.');
      }
      const { recuerdo, ficha } = await response.json();
      setRecuerdos(prev => [recuerdo, ...prev]);
      const nuevaMemory: AdminMemory = {
        id: recuerdo.id,
        memorial_id: recuerdo.memorial_id,
        title: ficha.titulo,
        story: ficha.historia,
        media_url: `/api/recuerdos/${recuerdo.id}/foto`,
        media_type: 'image',
        life_stage: 'general',
        people: ficha.personas || undefined,
        location: ficha.lugar || undefined,
        author_name: ficha.autor || undefined,
        approximate_year: ficha.anio ?? undefined,
        is_public: true,
        created_at: recuerdo.created_at,
        oculta: false,
      };
      setMemories(prev => [nuevaMemory, ...prev]);
      setFichas(prev => ({ ...prev, [recuerdo.id]: { ...ficha, revision: '' } }));
      setShowUploadModal(false);
      setUploadPreview(null);
      form.reset();
      setNotice('¡Fotografía subida y publicada en el álbum familiar!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la fotografía.');
    } finally {
      setBusy('');
    }
  }

  async function guardarEditorial(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy('saving-editorial');
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/familia/editorial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editorial),
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'No se pudo guardar el texto editorial.');
      }
      const result = await response.json();
      setEditorial(result);
      setNotice('Dedicatoria y legado guardados correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los textos.');
    } finally {
      setBusy('');
    }
  }

  // Filtrado de fotos
  const fotosFiltradas = memories.filter(m => {
    if (filterFotos === 'visibles') return !m.oculta;
    if (filterFotos === 'ocultas') return m.oculta;
    return true;
  });

  return (
    <div className="admin-page admin-dashboard">
      {/* Barra superior de navegación */}
      <div className="family-toolbar">
        <div className="toolbar-left-links">
          <Link className="text-link" href="/">
            <ArrowLeft size={16} /> Volver al memorial
          </Link>
          <Link className="text-link qr-toolbar-link" href="/qr" target="_blank">
            <QrCode size={16} /> Ver código QR para lápida
          </Link>
        </div>
        <button
          className="text-link"
          onClick={async () => {
            await fetch('/api/familia/sesion', { method: 'DELETE' });
            window.location.reload();
          }}
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>

      <div className="admin-header">
        <p className="eyebrow">PANEL FAMILIAR DE ADMINISTRACIÓN</p>
        <h1>Lorenzo Chamba</h1>
        <p className="panel-description">
          Administra todas las fotografías del álbum, modera los recuerdos que deja la gente y edita las historias y dedicatoria.
        </p>
      </div>

      {/* Pestañas principales */}
      <nav className="admin-main-tabs" aria-label="Secciones del panel">
        <button
          className={`admin-tab-btn ${activeTab === 'recuerdos' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('recuerdos');
            setError('');
            setNotice('');
          }}
        >
          <MessageSquare size={17} />
          <span>Recuerdos de la gente</span>
          {pendientesCount > 0 && <span className="admin-badge badge-alert">{pendientesCount}</span>}
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'fotos' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('fotos');
            setError('');
            setNotice('');
          }}
        >
          <ImageIcon size={17} />
          <span>Álbum de fotografías</span>
          <span className="admin-badge">{memories.length}</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'editorial' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('editorial');
            setError('');
            setNotice('');
          }}
        >
          <BookOpen size={17} />
          <span>Dedicatoria y Legado</span>
        </button>
      </nav>

      {/* Alertas globales */}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="editor-success" role="status">
          {notice}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 1: RECUERDOS DE LA GENTE (MODERACIÓN)                             */}
      {/* ========================================================================= */}
      {activeTab === 'recuerdos' && (
        <section className="admin-section" aria-label="Moderación de recuerdos">
          <div className="admin-section-header">
            <div>
              <h2>Recuerdos compartidos por visitantes</h2>
              <p className="form-note">
                Revisa los mensajes y fotografías que las personas han dedicado a Lorenzo. Tú decides qué se publica y qué se guarda en privado.
              </p>
            </div>
          </div>

          <div className="album-filters">
            {(
              [
                ['pending', `Por revisar (${pendientesCount})`],
                ['approved', `Publicados en memorial (${recuerdos.filter(r => r.status === 'approved').length})`],
                ['rejected', `En privado (${recuerdos.filter(r => r.status === 'rejected').length})`],
              ] as const
            ).map(([value, label]) => (
              <button
                className="btn-chip"
                key={value}
                aria-pressed={filterRecuerdos === value}
                onClick={() => setFilterRecuerdos(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="review-list">
            {recuerdos
              .filter(item => item.status === filterRecuerdos)
              .map(item => (
                <article className="review-card" key={item.id}>
                  {item.has_photo && (
                    <div
                      className="review-card-media"
                      onClick={() => setPreviewImage(`/api/recuerdos/${item.id}/foto`)}
                      title="Haz clic para ver la foto en grande"
                    >
                      <Image
                        src={`/api/recuerdos/${item.id}/foto`}
                        alt={`Fotografía compartida por ${item.author_name}`}
                        width={280}
                        height={280}
                        unoptimized
                      />
                      <span className="media-zoom-hint">Ampliar foto</span>
                    </div>
                  )}
                  <div className="review-card-content">
                    <div className="review-card-header">
                      <h3>{item.author_name}</h3>
                      {item.author_relationship && (
                        <span className="relation-tag">{item.author_relationship}</span>
                      )}
                    </div>
                    <p className="review-date">
                      {new Date(item.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="review-message">{item.message}</p>
                    <div className="review-actions">
                      {item.status !== 'approved' && (
                        <button
                          className="btn-modal-action action-approve"
                          disabled={Boolean(busy)}
                          onClick={() => revisarRecuerdo(item.id, 'approved')}
                        >
                          <Check size={16} /> Aprobar y publicar
                        </button>
                      )}
                      {item.status !== 'rejected' && (
                        <button
                          className="btn-secondary"
                          disabled={Boolean(busy)}
                          onClick={() => revisarRecuerdo(item.id, 'rejected')}
                        >
                          <RotateCcw size={16} /> Conservar en privado
                        </button>
                      )}
                      <button
                        className="btn-secondary action-delete"
                        disabled={Boolean(busy)}
                        onClick={() => borrarRecuerdo(item.id)}
                        title="Eliminar este recuerdo permanentemente"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          {!recuerdos.some(item => item.status === filterRecuerdos) && (
            <div className="empty-state">
              <p>No hay recuerdos en esta sección.</p>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ÁLBUM DE FOTOGRAFÍAS (GESTIÓN COMPLETA)                        */}
      {/* ========================================================================= */}
      {activeTab === 'fotos' && (
        <section className="admin-section" aria-label="Gestión de fotografías del álbum">
          <div className="admin-section-header">
            <div>
              <h2>Todas las fotografías del memorial</h2>
              <p className="form-note">
                Aquí puedes subir nuevas fotos, editar la historia de cada momento y ocultar o mostrar fotos en el memorial.
              </p>
            </div>
            <button
              className="btn-modal-action btn-upload-cta"
              onClick={() => {
                setShowUploadModal(true);
                setUploadPreview(null);
                setError('');
                setNotice('');
              }}
            >
              <Plus size={18} /> Subir nueva foto al álbum
            </button>
          </div>

          <div className="album-filters">
            {(
              [
                ['todas', `Todas (${memories.length})`],
                ['visibles', `Visibles en memorial (${fotosVisiblesCount})`],
                ['ocultas', `Ocultas (${fotosOcultasCount})`],
              ] as const
            ).map(([value, label]) => (
              <button
                className="btn-chip"
                key={value}
                aria-pressed={filterFotos === value}
                onClick={() => setFilterFotos(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="admin-photos-grid">
            {fotosFiltradas.map(photo => {
              const isBasePhoto = photo.id.startsWith('lorenzo-foto-');
              return (
                <article className={`admin-photo-card ${photo.oculta ? 'photo-is-hidden' : ''}`} key={photo.id}>
                  <div
                    className="admin-photo-thumb"
                    onClick={() => setPreviewImage(photo.media_url)}
                    title="Haz clic para ver foto ampliada"
                  >
                    <Image
                      src={photo.media_url}
                      alt={photo.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      unoptimized={photo.media_url.startsWith('/api/')}
                    />
                    <div className="admin-photo-badges">
                      {photo.oculta ? (
                        <span className="badge-hidden">
                          <EyeOff size={13} /> Oculta
                        </span>
                      ) : (
                        <span className="badge-visible">
                          <Eye size={13} /> Visible
                        </span>
                      )}
                      {isBasePhoto ? (
                        <span className="badge-origin">Original</span>
                      ) : (
                        <span className="badge-origin">Aportada</span>
                      )}
                    </div>
                  </div>

                  <div className="admin-photo-info">
                    <h3>{photo.title}</h3>
                    {(photo.location || photo.approximate_year) && (
                      <p className="admin-photo-meta">
                        {photo.location && <span>📍 {photo.location}</span>}
                        {photo.approximate_year && <span>📅 {photo.approximate_year}</span>}
                      </p>
                    )}
                    {photo.story ? (
                      <p className="admin-photo-story-snippet">{photo.story}</p>
                    ) : (
                      <p className="admin-photo-no-story">Sin historia añadida todavía.</p>
                    )}
                    {photo.people && (
                      <p className="admin-photo-people">
                        <strong>Personas:</strong> {photo.people}
                      </p>
                    )}

                    <div className="admin-photo-actions">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          setEditingPhoto(photo);
                          setError('');
                          setNotice('');
                        }}
                      >
                        <Edit3 size={15} /> Editar historia
                      </button>

                      <button
                        className={`btn-secondary btn-sm ${photo.oculta ? 'btn-unhide' : 'btn-hide'}`}
                        disabled={busy === photo.id}
                        onClick={() => toggleOcultarFoto(photo)}
                        title={photo.oculta ? 'Hacer visible en memorial' : 'Ocultar del memorial'}
                      >
                        {photo.oculta ? (
                          <>
                            <Eye size={15} /> Mostrar
                          </>
                        ) : (
                          <>
                            <EyeOff size={15} /> Ocultar
                          </>
                        )}
                      </button>

                      {!isBasePhoto && (
                        <button
                          className="btn-secondary btn-sm action-delete"
                          disabled={busy === photo.id}
                          onClick={() => borrarRecuerdo(photo.id)}
                          title="Eliminar foto permanentemente"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {fotosFiltradas.length === 0 && (
            <div className="empty-state">
              <p>No hay fotografías que coincidan con el filtro seleccionado.</p>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: DEDICATORIA Y LEGADO                                           */}
      {/* ========================================================================= */}
      {activeTab === 'editorial' && (
        <section className="admin-section" aria-label="Dedicatoria y legado">
          <form className="editor-surface" onSubmit={guardarEditorial}>
            <div className="admin-section-header">
              <div>
                <h2>Dedicatoria principal de la portada</h2>
                <p className="form-note">
                  La frase que encabeza el memorial en la pantalla de bienvenida junto al retrato de Lorenzo.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dedication-text">
                Dedicatoria
              </label>
              <textarea
                id="dedication-text"
                className="form-textarea"
                maxLength={1000}
                rows={3}
                value={editorial.dedicatoria}
                onChange={event => setEditorial({ ...editorial, dedicatoria: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dedication-author">
                Firma <span>(opcional)</span>
              </label>
              <input
                id="dedication-author"
                className="form-input"
                maxLength={150}
                value={editorial.firma}
                onChange={event => setEditorial({ ...editorial, firma: event.target.value })}
                placeholder="Ej: Su familia, Sus hijos y nietos"
              />
            </div>

            <div className="legacy-divider" />

            <div className="admin-section-header">
              <div>
                <h2>«Lo que nos dejó» (Historias del legado)</h2>
                <p className="form-note">
                  Las enseñanzas, sus frases características y las anécdotas que la familia atesora.
                </p>
              </div>
            </div>

            {editorial.legado.map((item, index) => (
              <fieldset className="legacy-editor-item" key={item.id || `recuerdo-${index}`}>
                <legend>Historia {index + 1}</legend>
                <div className="form-group">
                  <label className="form-label" htmlFor={`legacy-title-${index}`}>
                    Título
                  </label>
                  <input
                    id={`legacy-title-${index}`}
                    className="form-input"
                    required
                    maxLength={100}
                    value={item.titulo}
                    onChange={event =>
                      setEditorial({
                        ...editorial,
                        legado: editorial.legado.map((val, i) =>
                          i === index ? { ...val, titulo: event.target.value } : val
                        ),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor={`legacy-body-${index}`}>
                    Palabras de la historia
                  </label>
                  <textarea
                    id={`legacy-body-${index}`}
                    className="form-textarea"
                    required
                    maxLength={1200}
                    rows={4}
                    value={item.texto}
                    onChange={event =>
                      setEditorial({
                        ...editorial,
                        legado: editorial.legado.map((val, i) =>
                          i === index ? { ...val, texto: event.target.value } : val
                        ),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor={`legacy-author-${index}`}>
                    Firma <span>(opcional)</span>
                  </label>
                  <input
                    id={`legacy-author-${index}`}
                    className="form-input"
                    maxLength={150}
                    value={item.autor}
                    onChange={event =>
                      setEditorial({
                        ...editorial,
                        legado: editorial.legado.map((val, i) =>
                          i === index ? { ...val, autor: event.target.value } : val
                        ),
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="text-link text-danger"
                  onClick={() =>
                    setEditorial({
                      ...editorial,
                      legado: editorial.legado.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 size={14} /> Quitar esta historia
                </button>
              </fieldset>
            ))}

            <div className="legacy-editor-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={Boolean(busy) || editorial.legado.length >= 12}
                onClick={() =>
                  setEditorial({
                    ...editorial,
                    legado: [...editorial.legado, { id: '', titulo: '', texto: '', autor: '' }],
                  })
                }
              >
                <Plus size={16} /> Añadir otra historia
              </button>
              <button className="btn-modal-action editor-save" disabled={Boolean(busy)}>
                <Save size={16} />
                {busy === 'saving-editorial' ? 'Guardando…' : 'Guardar dedicatoria y legado'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBIR NUEVA FOTOGRAFÍA AL ÁLBUM                                     */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="admin-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Subir nueva fotografía al álbum</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowUploadModal(false)}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={subirNuevaFoto} className="admin-modal-form">
              <div className="photo-upload-container">
                <label className="photo-dropzone">
                  <UploadCloud size={32} />
                  <strong>Toca para elegir o arrastrar una fotografía</strong>
                  <span>Formatos JPG, PNG o WebP (máx. 8 MB)</span>
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setUploadPreview(url);
                      }
                    }}
                  />
                </label>
                {uploadPreview && (
                  <div className="upload-preview-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadPreview} alt="Vista previa de foto" />
                    <button
                      type="button"
                      className="remove-preview-btn"
                      onClick={() => setUploadPreview(null)}
                      title="Quitar imagen"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-photo-title">
                  Título de la fotografía *
                </label>
                <input
                  id="new-photo-title"
                  name="titulo"
                  className="form-input"
                  required
                  maxLength={180}
                  placeholder="Ej: Un domingo en familia en Changaimina"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-photo-story">
                  Historia o anécdota detrás de la foto
                </label>
                <textarea
                  id="new-photo-story"
                  name="historia"
                  className="form-textarea"
                  maxLength={5000}
                  rows={4}
                  placeholder="Cuenta qué ocurrió ese día, qué recuerdan o qué decía Lorenzo…"
                />
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-photo-year">
                    Año aproximado
                  </label>
                  <input
                    id="new-photo-year"
                    name="anio"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    className="form-input"
                    placeholder="Ej: 1985"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-photo-place">
                    Lugar
                  </label>
                  <input
                    id="new-photo-place"
                    name="lugar"
                    className="form-input"
                    maxLength={150}
                    placeholder="Ej: Changaimina, Loja"
                  />
                </div>
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-photo-people">
                    Personas que aparecen
                  </label>
                  <input
                    id="new-photo-people"
                    name="personas"
                    className="form-input"
                    maxLength={500}
                    placeholder="Ej: Lorenzo, su esposa Jesús y sus nietos"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-photo-author">
                    Compartido por
                  </label>
                  <input
                    id="new-photo-author"
                    name="autor"
                    className="form-input"
                    maxLength={150}
                    placeholder="Ej: Familia Chamba"
                  />
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-modal-action"
                  disabled={busy === 'uploading-photo'}
                >
                  {busy === 'uploading-photo' ? 'Subiendo y procesando…' : 'Publicar fotografía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR HISTORIA Y DATOS DE FOTOGRAFÍA                               */}
      {/* ========================================================================= */}
      {editingPhoto && (
        <div className="admin-modal-overlay" onClick={() => setEditingPhoto(null)}>
          <div className="admin-modal-content edit-photo-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Editar fotografía del memorial</h2>
              <button
                className="modal-close-btn"
                onClick={() => setEditingPhoto(null)}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarFichaEditada} className="admin-modal-form">
              <div className="edit-photo-layout">
                <div className="edit-photo-image-preview">
                  <Image
                    src={editingPhoto.media_url}
                    alt={editingPhoto.title}
                    fill
                    sizes="350px"
                    unoptimized={editingPhoto.media_url.startsWith('/api/')}
                  />
                </div>

                <div className="edit-photo-fields">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-photo-title">
                      Título de la fotografía *
                    </label>
                    <input
                      id="edit-photo-title"
                      name="titulo"
                      className="form-input"
                      required
                      maxLength={180}
                      defaultValue={editingPhoto.title}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-photo-story">
                      La historia de este momento
                    </label>
                    <textarea
                      id="edit-photo-story"
                      name="historia"
                      className="form-textarea"
                      maxLength={5000}
                      rows={5}
                      defaultValue={editingPhoto.story}
                      placeholder="Qué recuerdan de esta fotografía, una frase o anécdota…"
                    />
                  </div>

                  <div className="form-row-two">
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-photo-year">
                        Año aproximado
                      </label>
                      <input
                        id="edit-photo-year"
                        name="anio"
                        type="number"
                        min={1900}
                        max={new Date().getFullYear()}
                        className="form-input"
                        defaultValue={editingPhoto.approximate_year ?? ''}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-photo-place">
                        Lugar
                      </label>
                      <input
                        id="edit-photo-place"
                        name="lugar"
                        className="form-input"
                        maxLength={150}
                        defaultValue={editingPhoto.location || ''}
                      />
                    </div>
                  </div>

                  <div className="form-row-two">
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-photo-people">
                        Personas que aparecen
                      </label>
                      <input
                        id="edit-photo-people"
                        name="personas"
                        className="form-input"
                        maxLength={500}
                        defaultValue={editingPhoto.people || ''}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-photo-author">
                        Compartido por
                      </label>
                      <input
                        id="edit-photo-author"
                        name="autor"
                        className="form-input"
                        maxLength={150}
                        defaultValue={editingPhoto.author_name || ''}
                      />
                    </div>
                  </div>

                  <div className="form-group-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="oculta"
                        defaultChecked={editingPhoto.oculta}
                      />
                      <span>Ocultar esta fotografía del memorial público</span>
                    </label>
                    <p className="form-note">
                      Si la ocultas, no aparecerá en el álbum ni en la rueda de fotos pública, pero se conservará aquí para la familia.
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingPhoto(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-modal-action"
                  disabled={busy === 'saving-photo'}
                >
                  {busy === 'saving-photo' ? 'Guardando cambios…' : 'Guardar historia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISOR DE FOTO EN TAMAÑO COMPLETO                                    */}
      {/* ========================================================================= */}
      {previewImage && (
        <div className="admin-lightbox-overlay" onClick={() => setPreviewImage(null)}>
          <div className="admin-lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              className="admin-lightbox-close"
              onClick={() => setPreviewImage(null)}
              aria-label="Cerrar vista previa"
            >
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Fotografía ampliada" />
          </div>
        </div>
      )}
    </div>
  );
}
