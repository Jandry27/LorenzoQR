'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Check, Copy, Download } from 'lucide-react';
import { Memorial } from '../lib/types';
import { Modal } from './Modal';

interface QRCodeModalProps { isOpen: boolean; onClose: () => void; memorial: Memorial; }

export function QRCodeModal({ isOpen, onClose, memorial }: QRCodeModalProps) {
  if (!isOpen) return null;
  return <QRContent onClose={onClose} memorial={memorial} />;
}

function QRContent({ onClose, memorial }: Omit<QRCodeModalProps, 'isOpen'>) {
  const [qr, setQr] = useState<{ image: string; url: string; localOnly: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function generar() {
      try {
        const response = await fetch('/api/memorial/enlace');
        if (!response.ok) throw new Error('Enlace no disponible');
        const { baseUrl, localOnly } = await response.json();
        const url = new URL(`/m/${memorial.slug}`, baseUrl).href;
        const image = await QRCode.toDataURL(url, { width: 1200, margin: 4, color: { dark: '#293e33', light: '#ffffff' }, errorCorrectionLevel: 'H' });
        if (active) setQr({ image, url, localOnly });
      } catch { if (active) setError('No se pudo crear el código. Cierra esta ventana e inténtalo de nuevo.'); }
    }
    void generar();
    return () => { active = false; };
  }, [memorial.slug]);

  async function copyLink() {
    if (!qr) return;
    try { await navigator.clipboard.writeText(qr.url); setCopied(true); }
    catch { setError('No se pudo copiar. Puedes seleccionar el enlace que aparece debajo del código.'); }
  }

  return <Modal title="Un recuerdo para compartir" onClose={onClose}>
    <p className="modal-description">Comparte el memorial de <strong>{memorial.full_name}</strong> con quienes también guardan su recuerdo.</p>
    <div className="qr-preview-box">
      {qr ? <Image src={qr.image} alt={`Código QR del memorial de ${memorial.full_name}`} width={200} height={200} unoptimized /> : <p role="status">Preparando el código…</p>}
      {qr && <a className="qr-url-text" href={qr.url}>{qr.url}</a>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn-modal-action" onClick={copyLink} disabled={!qr}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Enlace copiado' : 'Copiar enlace'}</button>
    {qr && <a className="qr-download" href={qr.image} download={`QR-${memorial.slug}.png`} id="btn-download-qr"><Download size={16} aria-hidden="true" /> Descargar código QR</a>}
    {qr?.localOnly && <p className="form-note">Este QR es para probarlo con el celular en el mismo Wi-Fi de la Mac. El enlace público se preparará antes de colocarlo en la lápida.</p>}
    <p className="form-note">Para colocarlo en una lápida, utiliza el enlace del memorial publicado y comprueba el escaneo antes de grabar la placa.</p>
  </Modal>;
}
