'use client';

import { useEffect, useId, useRef, type KeyboardEventHandler } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, variant = 'default', onKeyDown }: { title: string; onClose: () => void; children: React.ReactNode; variant?: 'default' | 'contemplation'; onKeyDown?: KeyboardEventHandler<HTMLDialogElement> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={ref} className={`modal-dialog ${variant === 'contemplation' ? 'contemplation-dialog' : ''}`} onKeyDown={onKeyDown} aria-labelledby={titleId} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-sheet">
        <div className="modal-header">
          <h2 className="modal-title" id={titleId}>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
