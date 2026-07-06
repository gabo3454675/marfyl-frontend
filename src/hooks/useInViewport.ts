'use client';

import { useRef, useState, useEffect, type RefObject } from 'react';

/**
 * Hook que detecta cuándo un elemento entra en el viewport (o está cerca).
 * Se dispara UNA SOLA VEZ y luego se desconecta automáticamente.
 * Ideal para lazy-loading de contenido y queries costosas.
 *
 * @param options.rootMargin - Cuánto antes cargar (default '200px')
 * @returns [ref, inView] - ref para el elemento, booleano cuando está visible
 *
 * @example
 * const [sectionRef, sectionVisible] = useInViewport({ rootMargin: '300px' });
 * // ... en useQuery: enabled: sectionVisible && otherConditions
 */
export function useInViewport(
  options?: IntersectionObserverInit,
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', ...options },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, inView, options?.rootMargin]);

  return [ref, inView];
}
