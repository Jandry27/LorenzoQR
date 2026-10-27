import Link from 'next/link';

export default function NotFound() {
  return <section className="empty-state not-found"><p className="eyebrow">MEMORIAL NO DISPONIBLE</p><h1>No encontramos este memorial</h1><p>Comprueba el enlace o consulta con la familia que lo compartió.</p><Link className="tribute-link" href="/">Volver al memorial de Lorenzo</Link></section>;
}
