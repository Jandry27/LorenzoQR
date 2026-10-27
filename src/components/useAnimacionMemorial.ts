'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';

export function useAnimacionMemorial(raiz: RefObject<HTMLDivElement | null>, movimientoReducido: boolean) {
  const vistos = useRef(new WeakSet<Element>());

  useLayoutEffect(() => {
    const navegacion = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if ((!location.hash || location.hash === '#contenido') && navegacion?.type !== 'back_forward') {
      history.scrollRestoration = 'manual';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    return () => { history.scrollRestoration = 'auto'; };
  }, []);

  useLayoutEffect(() => {
    const contenedor = raiz.current;
    const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduccionGuardada = false;
    try { reduccionGuardada = JSON.parse(localStorage.getItem('memorial_preferencias_lectura_v1') || 'null')?.movimientoReducido === true; } catch {}
    console.info('almara-before-debug', { root: !!contenedor, reduced: movimientoReducido, saved: reduccionGuardada, system: preferencia.matches });
    if (!contenedor || movimientoReducido || reduccionGuardada || preferencia.matches || !('animate' in Element.prototype)) return;

    console.info('almara-motion-debug', { root: !!contenedor, reduced: movimientoReducido, saved: reduccionGuardada, system: preferencia.matches });
    const animaciones = new Set<Animation>();
    const pendientes = new Set<Element>();
    const observadores = new Set<IntersectionObserver>();

    function revelar(elemento: HTMLElement, demora = 0, duracion = 1500) {
      if (vistos.current.has(elemento) || pendientes.has(elemento)) return;
      pendientes.add(elemento);
      const animacion = elemento.animate([
        { opacity: 0, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: duracion, delay: demora, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'backwards' });
      animaciones.add(animacion);
      animacion.onfinish = () => {
        vistos.current.add(elemento);
        pendientes.delete(elemento);
        animaciones.delete(animacion);
      };
      animacion.oncancel = () => {
        animaciones.delete(animacion);
        pendientes.delete(elemento);
      };
    }

    // 1. Entrada coreografiada de la portada conmemorativa (Bloque 1)
    const entradaPortada: [string, number][] = [
      ['.cover-topbar', 0],
      ['.memorial-portrait-frame', 250],
      ['.identity-text', 650],
      ['.cover-message', 1050],
      ['.cover-contribute', 1350],
    ];
    const observadorPortada = 'IntersectionObserver' in window ? new IntersectionObserver(entradas => {
      entradas.filter(e => e.isIntersecting).forEach(e => {
        const selector = entradaPortada.find(([sel]) => e.target.matches(sel));
        const demora = selector ? selector[1] : 0;
        revelar(e.target as HTMLElement, demora, 1800);
        observadorPortada?.unobserve(e.target);
      });
    }, { threshold: .1, rootMargin: '0px 0px -32px 0px' }) : null;
    if (observadorPortada) observadores.add(observadorPortada);

    entradaPortada.forEach(([selector, demora]) => {
      const elemento = contenedor.querySelector<HTMLElement>(selector);
      if (!elemento) return;
      const rectangulo = elemento.getBoundingClientRect();
      if (rectangulo.top < window.innerHeight && rectangulo.bottom > 0) {
        revelar(elemento, demora, 1800);
      } else {
        observadorPortada?.observe(elemento);
      }
    });

    // 2. Entrada coreografiada del bloque de recuerdos y álbum (Bloque 2)
    const seccionRecuerdos = contenedor.querySelector<HTMLElement>('.memories-section');
    if (seccionRecuerdos) {
      const elementosRecuerdos = [
        seccionRecuerdos.querySelector<HTMLElement>('.section-heading'),
        seccionRecuerdos.querySelector<HTMLElement>('.photo-orbit'),
        seccionRecuerdos.querySelector<HTMLElement>('.memory-below'),
      ].filter((el): el is HTMLElement => Boolean(el));

      function animarRecuerdos(demoraBase = 0) {
        elementosRecuerdos.forEach((el, i) => {
          revelar(el, demoraBase + i * 220, 1500);
        });
      }

      const rectRecuerdos = seccionRecuerdos.getBoundingClientRect();
      if (rectRecuerdos.top < window.innerHeight && rectRecuerdos.bottom > 0) {
        // Si ya está visible al inicio en pantallas muy altas, se revela de forma armoniosa tras la portada
        animarRecuerdos(1450);
      } else if ('IntersectionObserver' in window) {
        const observadorRecuerdos = new IntersectionObserver(entradas => {
          if (entradas.some(e => e.isIntersecting)) {
            observadorRecuerdos.disconnect();
            animarRecuerdos(0);
          }
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
        observadores.add(observadorRecuerdos);
        observadorRecuerdos.observe(seccionRecuerdos);
      }
    }

    // 3. Resto de secciones al hacer scroll
    const observadorGeneral = 'IntersectionObserver' in window ? new IntersectionObserver(entradas => {
      entradas.filter(e => e.isIntersecting).forEach((e, indice) => {
        revelar(e.target as HTMLElement, Math.min(indice * 120, 360), 1500);
        observadorGeneral?.unobserve(e.target);
      });
    }, { threshold: .16, rootMargin: '0px 0px -32px 0px' }) : null;
    if (observadorGeneral) observadores.add(observadorGeneral);

    contenedor.querySelectorAll<HTMLElement>('.written-memories, .legacy-brand-symbol, .legacy-section > .eyebrow, .legacy-section > h2, .legacy-passage, .share-invitation, .memorial-footer').forEach(elemento => observadorGeneral?.observe(elemento));

    function detener() {
      observadores.forEach(obs => obs.disconnect());
      observadores.clear();
      animaciones.forEach(animacion => animacion.cancel());
      animaciones.clear();
    }
    function ajustarMovimiento() { if (preferencia.matches) detener(); }
    function mostrarAlEnfocar(evento: FocusEvent) {
      animaciones.forEach(animacion => {
        const elemento = (animacion.effect as KeyframeEffect | null)?.target;
        if (elemento instanceof Element && evento.target instanceof Node && elemento.contains(evento.target)) animacion.finish();
      });
    }
    preferencia.addEventListener('change', ajustarMovimiento);
    contenedor.addEventListener('focusin', mostrarAlEnfocar);
    return () => {
      detener();
      preferencia.removeEventListener('change', ajustarMovimiento);
      contenedor.removeEventListener('focusin', mostrarAlEnfocar);
    };
  }, [raiz, movimientoReducido]);
}
