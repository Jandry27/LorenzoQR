'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Maximize2 } from 'lucide-react';
import type { Memory } from '../lib/types';

type Props = {
  currentMemory: Memory;
  memories: Memory[];
  onSelect: (memory: Memory) => void;
  onOpen: () => void;
  reduceMotion: boolean;
};

function calcularEstiloOrbita(indice: number, fase: number, total: number) {
  if (total <= 1) {
    return {
      '--orbit-x': '0',
      '--orbit-y': '0px',
      '--orbit-z': '0px',
      '--orbit-rot-y': '0deg',
      '--orbit-scale': '1',
      opacity: '1',
      zIndex: '20',
      isFrontal: true,
    };
  }

  const diferencia = ((indice - fase + total / 2) % total + total) % total - total / 2;
  const angulo = (diferencia * 2 * Math.PI) / total;
  const sinA = Math.sin(angulo);
  const cosA = Math.cos(angulo);
  const profundidad = (cosA + 1) / 2;

  // Elevación: el fondo sube suavemente (-12px) para que las miniaturas traseras se vean completas formando el anillo
  const elevacionY = (1 - cosA) * -12;
  // Curvatura cilíndrica tangencial hacia el centro
  const rotacionY = -sinA * 34;
  // Protagonismo de la foto central: decaimiento suave hacia los laterales
  const dist = Math.abs(diferencia);
  const factorCentro = Math.exp(-Math.pow(dist / 1.15, 2));

  // Escala: 1.0 en la foto central protagonista, ~0.80 en laterales, 0.63 en el fondo
  const escala = 0.63 + factorCentro * 0.37;
  // Opacidad: 1.0 al frente protagonista, ~0.60 a la izquierda y derecha, ~0.28 en el fondo
  const opacidad = 0.28 + factorCentro * 0.72;
  // Z-index: el frente siempre en la capa superior
  const zIndex = Math.round(profundidad * 40) + 1;
  const isFrontal = dist < 0.45;

  return {
    '--orbit-x': sinA.toFixed(4),
    '--orbit-y': `${elevacionY.toFixed(1)}px`,
    '--orbit-z': `${((cosA - 1) * 120).toFixed(1)}px`,
    '--orbit-rot-y': `${rotacionY.toFixed(2)}deg`,
    '--orbit-scale': escala.toFixed(3),
    opacity: opacidad.toFixed(3),
    zIndex: String(zIndex),
    isFrontal,
  };
}

export function PhotoRing({ currentMemory, memories, onSelect, onOpen, reduceMotion }: Props) {
  const indice = Math.max(0, memories.findIndex(memory => memory.id === currentMemory.id));
  const escenario = useRef<HTMLDivElement>(null);
  const fase = useRef(indice);
  const iniciado = useRef(false);
  const haEntrado = useRef(false);
  const frame = useRef<number | null>(null);
  const gesto = useRef<{
    id: number;
    startX: number;
    startY: number;
    faseInicial: number;
    horizontal: boolean;
    arrastrando: boolean;
  } | null>(null);
  const omitirClick = useRef(false);

  const dibujar = useCallback((valor: number) => {
    fase.current = valor;
    escenario.current?.querySelectorAll<HTMLElement>('[data-orbit-index]').forEach(elemento => {
      const idx = Number(elemento.dataset.orbitIndex);
      const estilo = calcularEstiloOrbita(idx, valor, memories.length);
      elemento.style.setProperty('--orbit-x', estilo['--orbit-x']);
      elemento.style.setProperty('--orbit-y', estilo['--orbit-y']);
      elemento.style.setProperty('--orbit-z', estilo['--orbit-z']);
      elemento.style.setProperty('--orbit-rot-y', estilo['--orbit-rot-y']);
      elemento.style.setProperty('--orbit-scale', estilo['--orbit-scale']);
      elemento.style.opacity = estilo.opacity;
      elemento.style.zIndex = estilo.zIndex;
      if (estilo.isFrontal) {
        elemento.setAttribute('data-frontal', 'true');
        elemento.setAttribute('aria-current', 'true');
      } else {
        elemento.removeAttribute('data-frontal');
        elemento.removeAttribute('aria-current');
      }
    });
  }, [memories.length]);

  const girarHacia = useCallback((destino: number, duracionPersonalizada?: number) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const total = memories.length;
    if (total <= 1) {
      dibujar(destino);
      return;
    }
    const diferencia = ((destino - fase.current + total / 2) % total + total) % total - total / 2;
    const inicio = fase.current;
    if (reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(diferencia) < 0.001) {
      dibujar(destino);
      return;
    }
    const duracion = duracionPersonalizada ?? Math.min(850, Math.max(450, Math.abs(diferencia) * 350));
    const comienzo = performance.now();
    function avanzar(ahora: number) {
      const progreso = Math.min(1, (ahora - comienzo) / duracion);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      dibujar(inicio + diferencia * suavizado);
      if (progreso < 1) {
        frame.current = requestAnimationFrame(avanzar);
      } else {
        frame.current = null;
      }
    }
    frame.current = requestAnimationFrame(avanzar);
  }, [dibujar, memories.length, reduceMotion]);

  useLayoutEffect(() => {
    if (!iniciado.current) {
      iniciado.current = true;
      const debeReducir = reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (debeReducir || memories.length <= 1) {
        haEntrado.current = true;
        dibujar(indice);
      } else {
        // Posición sutilmente ladeada para que la órbita se despliegue con gracia al entrar
        fase.current = indice - 0.65;
        dibujar(fase.current);
      }
    } else {
      dibujar(fase.current);
      girarHacia(indice);
    }
  }, [indice, dibujar, girarHacia, memories.length, reduceMotion]);

  useEffect(() => {
    const el = escenario.current;
    if (!el || haEntrado.current || reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!('IntersectionObserver' in window)) {
      haEntrado.current = true;
      girarHacia(indice, 750);
      return;
    }

    const obs = new IntersectionObserver(entradas => {
      if (entradas.some(e => e.isIntersecting)) {
        obs.disconnect();
        haEntrado.current = true;
        setTimeout(() => {
          girarHacia(indice, 750);
        }, 160);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    obs.observe(el);
    return () => obs.disconnect();
  }, [girarHacia, indice, reduceMotion]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ajustar = () => { if (media.matches) girarHacia(indice); };
    media.addEventListener('change', ajustar);
    return () => {
      media.removeEventListener('change', ajustar);
    };
  }, [girarHacia, indice]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  function seleccionar(paso: number) {
    if (memories.length < 2) return;
    onSelect(memories[(indice + paso + memories.length) % memories.length]);
  }

  function handleCardClick(memory: Memory, cardIndex: number) {
    if (omitirClick.current) {
      omitirClick.current = false;
      return;
    }
    if (cardIndex === indice) {
      onOpen();
    } else {
      onSelect(memory);
    }
  }

  function moverGesto(event: PointerEvent<HTMLDivElement>) {
    const inicio = gesto.current;
    if (!inicio || event.pointerId !== inicio.id || memories.length < 2) return;
    const dx = event.clientX - inicio.startX;
    const dy = event.clientY - inicio.startY;

    if (!inicio.horizontal) {
      // Si el desplazamiento vertical predomina, cancelamos inmediatamente el gesto para permitir el scroll natural de la página en móvil
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
        gesto.current = null;
        return;
      }
      // Solo capturamos si el movimiento es decididamente horizontal
      if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        inicio.horizontal = true;
        inicio.arrastrando = true;
        omitirClick.current = true;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {}
        if (frame.current !== null) cancelAnimationFrame(frame.current);
      } else {
        return;
      }
    }

    if (inicio.arrastrando && !reduceMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const deltaFase = dx / 140;
      dibujar(inicio.faseInicial - deltaFase);
    }
  }

  function terminarGesto(event: PointerEvent<HTMLDivElement>, cancelar = false) {
    const inicio = gesto.current;
    if (!inicio || event.pointerId !== inicio.id) return;
    gesto.current = null;

    if (!inicio.arrastrando) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {}
    }

    const dx = event.clientX - inicio.startX;
    if (cancelar || Math.abs(dx) < 28) {
      girarHacia(indice);
    } else {
      seleccionar(dx < 0 ? 1 : -1);
    }
  }

  return (
    <div className="photo-orbit" role="region" aria-roledescription="carrusel" aria-label="El anillo de sus recuerdos">
      <div
        className="orbit-stage"
        ref={escenario}
        onDragStart={event => event.preventDefault()}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          omitirClick.current = false;
          gesto.current = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            faseInicial: fase.current,
            horizontal: false,
            arrastrando: false,
          };
        }}
        onPointerMove={moverGesto}
        onPointerUp={event => terminarGesto(event)}
        onPointerCancel={event => terminarGesto(event, true)}
        onClickCapture={event => {
          if (omitirClick.current) {
            event.preventDefault();
            event.stopPropagation();
            omitirClick.current = false;
          }
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            seleccionar(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
      >
        {memories.length > 1 && <span className="orbit-track" aria-hidden="true" />}
        {memories.map((memory, index) => {
          const estilo = calcularEstiloOrbita(index, indice, memories.length);
          const esFrontal = index === indice;
          return (
            <button
              key={memory.id}
              className="orbit-card"
              data-orbit-index={index}
              data-frontal={esFrontal ? 'true' : undefined}
              style={{
                '--orbit-x': estilo['--orbit-x'],
                '--orbit-y': estilo['--orbit-y'],
                '--orbit-z': estilo['--orbit-z'],
                '--orbit-rot-y': estilo['--orbit-rot-y'],
                '--orbit-scale': estilo['--orbit-scale'],
                opacity: estilo.opacity,
                zIndex: estilo.zIndex,
              } as CSSProperties}
              aria-label={esFrontal ? `Ampliar fotografía: ${memory.title}` : `Ver recuerdo: ${memory.title}`}
              aria-current={esFrontal ? 'true' : undefined}
              onClick={() => handleCardClick(memory, index)}
            >
              <span className="orbit-card-image" style={{ position: 'relative' }}>
                <Image
                  src={memory.media_url}
                  alt={memory.title}
                  fill
                  sizes="(max-width: 700px) 240px, 300px"
                  unoptimized={memory.media_url.startsWith('/api/')}
                  draggable={false}
                  priority={esFrontal}
                />
                <span className="orbit-expand" aria-hidden="true">
                  <Maximize2 size={15} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="orbit-caption">{currentMemory.title}</p>
      {memories.length > 1 && (
        <div className="orbit-controls">
          <button onClick={() => seleccionar(-1)} aria-label="Recuerdo anterior">
            <ArrowLeft size={18} strokeWidth={1.4} />
          </button>
          <span className="orbit-position" aria-live="polite">
            {indice + 1}
            <span aria-hidden="true"> / </span>
            <span className="sr-only"> de </span>
            {memories.length}
          </span>
          <button onClick={() => seleccionar(1)} aria-label="Recuerdo siguiente">
            <ArrowRight size={18} strokeWidth={1.4} />
          </button>
        </div>
      )}
    </div>
  );
}
