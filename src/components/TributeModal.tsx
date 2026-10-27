'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Check, Send, X } from 'lucide-react';
import { Modal } from './Modal';

export function TributeModal({ isOpen, onClose, memorialId }: { isOpen: boolean; onClose: () => void; memorialId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [filename, setFilename] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  if (!isOpen) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    const form = new FormData(event.currentTarget);
    form.set('memorial_id', memorialId);
    const foto = form.get('photo');
    if (!String(form.get('message') || '').trim() && !(foto instanceof File && foto.size)) { setError('Escribe unas palabras o añade una fotografía.'); return; }
    submitted.current = true;
    setIsSubmitting(true); setError('');
    try {
      const response = await fetch('/api/recuerdos', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'No pudimos guardar tu recuerdo. Inténtalo de nuevo.'); return; }
      setIsSuccess(true);
    } catch { setError('Se perdió la conexión. Tu texto sigue aquí para que puedas intentarlo de nuevo.'); }
    finally { submitted.current = false; setIsSubmitting(false); }
  }

  return <Modal title="Tu recuerdo de Lorenzo" onClose={onClose}>
    {isSuccess ? <div className="tribute-success" role="status"><Check size={32} aria-hidden="true" /><h3>Tu recuerdo ya está guardado</h3><p>Gracias por compartirlo. La familia lo revisará antes de que aparezca en el memorial.</p><button className="btn-modal-action" onClick={onClose}>Volver a sus recuerdos</button></div> : <form onSubmit={handleSubmit}>
      <p className="modal-description">Una foto juntos, una anécdota o unas palabras. No tiene que ser perfecto: basta con que sea tuyo.</p>
      <div className="form-group"><label className="form-label" htmlFor="tribute-name">Tu nombre</label><input id="tribute-name" name="author_name" autoComplete="name" required maxLength={150} className="form-input" placeholder="Cómo te llamas" /></div>
      <div className="form-group"><label className="form-label" htmlFor="tribute-relation">Tu relación con Lorenzo <span>(opcional)</span></label><input id="tribute-relation" name="author_relationship" maxLength={100} className="form-input" placeholder="Por ejemplo: nieta, amigo, vecino" /></div>
      <div className="photo-upload"><label htmlFor="tribute-photo"><Camera size={24} strokeWidth={1.3} aria-hidden="true" /><strong>{filename ? 'Cambiar fotografía' : 'Añadir una fotografía'}</strong><span>JPG, PNG o WebP · Hasta 8 MB</span></label><input ref={fileInput} id="tribute-photo" type="file" name="photo" accept="image/jpeg,image/png,image/webp" onChange={event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Elige una foto JPG, PNG o WebP de hasta 8 MB.'); event.target.value = ''; setPreview(''); setFilename(''); return; }
        setError(''); setPreview(URL.createObjectURL(file)); setFilename(file.name);
      }} />{preview && <div className="upload-preview"><Image src={preview} alt="Fotografía que vas a compartir" width={400} height={260} unoptimized /><span>{filename}</span><button type="button" aria-label="Quitar fotografía" onClick={() => { if (fileInput.current) fileInput.current.value = ''; setPreview(''); setFilename(''); }}><X size={17} /></button></div>}</div>
      <div className="form-group"><label className="form-label" htmlFor="tribute-message">Lo que recuerdas</label><textarea id="tribute-message" name="message" maxLength={5000} rows={4} className="form-textarea" placeholder="Recuerdo aquella vez que…" /></div>
      <p className="form-note">Comparte solo fotografías y palabras que tengas permiso de publicar. La familia revisará tu aportación antes de mostrarla.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn-modal-action" type="submit" disabled={isSubmitting}><Send size={16} aria-hidden="true" />{isSubmitting ? 'Guardando tu recuerdo…' : 'Enviar mi recuerdo'}</button>
    </form>}
  </Modal>;
}
