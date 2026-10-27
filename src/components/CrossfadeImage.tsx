'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export function CrossfadeImage({ src, alt, sizes, className = '', loading = 'eager' }: { src: string; alt: string; sizes: string; className?: string; loading?: 'eager' | 'lazy' }) {
  const [capa, setCapa] = useState<{ actual: string; anterior: string | null; lista: boolean; error: boolean }>({ actual: src, anterior: null, lista: false, error: false });
  const imagenActual = useRef<HTMLImageElement>(null);
  if (capa.actual !== src) {
    setCapa({ actual: src, anterior: capa.lista ? capa.actual : capa.anterior, lista: false, error: false });
  }

  useEffect(() => {
    if (!capa.anterior || !capa.lista) return;
    const actual = capa.actual;
    const duracion = imagenActual.current ? getComputedStyle(imagenActual.current).transitionDuration : '0s';
    const valor = Number.parseFloat(duracion) || 0;
    const milisegundos = duracion.endsWith('ms') ? valor : valor * 1000;
    // Safari y la lectura sin movimiento pueden omitir transitionend; la limpieza siempre debe ocurrir.
    const timer = setTimeout(() => {
      setCapa(value => value.actual === actual && value.lista ? { ...value, anterior: null } : value);
    }, milisegundos ? milisegundos + 80 : 0);
    return () => clearTimeout(timer);
  }, [capa.actual, capa.anterior, capa.lista]);

  return <>
    {capa.anterior && !capa.error && <Image src={capa.anterior} alt="" aria-hidden="true" fill sizes={sizes} unoptimized={capa.anterior.startsWith('/api/')} className={`transition-image previous-image ${className}`} />}
    <Image ref={imagenActual} key={src} src={src} alt={alt} fill sizes={sizes} unoptimized={src.startsWith('/api/')} loading={loading} className={`transition-image ${capa.lista ? 'image-ready' : ''} ${className}`} onLoad={() => setCapa(actual => actual.actual === src ? { ...actual, lista: true, error: false } : actual)} onTransitionEnd={event => {
      if (event.propertyName === 'opacity') setCapa(actual => actual.actual === src && actual.lista ? { ...actual, anterior: null } : actual);
    }} onError={() => setCapa(actual => actual.actual === src ? { ...actual, anterior: null, lista: false, error: true } : actual)} />
    {capa.error && <span className="photo-load-error" role="status">No pudimos cargar esta fotografía. Puedes elegir otro recuerdo.</span>}
  </>;
}
