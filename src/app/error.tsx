'use client';

export default function MemorialError({ reset }: { reset: () => void }) {
  return <section className="empty-state not-found"><p className="eyebrow">VOLVAMOS A INTENTARLO</p><h1>No pudimos abrir los recuerdos</h1><p>Puede ser un problema de conexión. Puedes volver a intentarlo en un momento.</p><button className="tribute-link" onClick={reset}>Intentar de nuevo</button></section>;
}
