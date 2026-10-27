import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { CONTACTO_DESARROLLADOR } from '../lib/contacto-desarrollador';
import { MARCA } from '../lib/marca';

export function DeveloperFooter() {
  const contacto = CONTACTO_DESARROLLADOR;
  const instagram = new URL(contacto.instagram).pathname.split('/').filter(Boolean)[0];
  const facebook = new URL(contacto.facebook).pathname.split('/').filter(Boolean)[0];
  const celularVisible = contacto.celular.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
  return <section className="developer-footer" aria-label={`${MARCA.nombre} · Marca y contacto`}>
    <div className="footer-brand-identity">
      <a href="#contenido" className="footer-brand" aria-label={`${MARCA.nombre}. ${MARCA.lema}. Volver al inicio`}>
        <Image src={MARCA.simbolo} width={28} height={42} alt="" unoptimized />
        <span><span className="footer-brand-name">{MARCA.nombre}</span><span className="footer-brand-motto">{MARCA.lema}</span></span>
      </a>
      <p className="developer-signature">Una creación de <strong>{contacto.nombre}</strong></p>
    </div>
    <address className="developer-footer-links" aria-label={`Contactar a ${contacto.nombre}`}>
      <a href={contacto.instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram de ${contacto.nombre}: @${instagram}`} title={`Instagram: @${instagram}`}>Instagram</a>
      <a href={contacto.facebook} target="_blank" rel="noopener noreferrer" aria-label={`Facebook de ${contacto.nombre}: ${facebook}`} title={`Facebook: ${facebook}`}>Facebook</a>
      <a href={`tel:${contacto.celular}`} aria-label={`Llamar a ${contacto.nombre}: ${celularVisible}`} title={`Celular: ${celularVisible}`}>Llamar</a>
      <a href={`mailto:${contacto.correo}`} aria-label={`Escribir a ${contacto.nombre}: ${contacto.correo}`} title={contacto.correo}>Correo <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden="true" /></a>
    </address>
  </section>;
}
