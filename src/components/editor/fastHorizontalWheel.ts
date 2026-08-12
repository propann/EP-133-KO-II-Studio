import type { WheelEvent } from 'react';

/** Dans les éditeurs horizontaux, la molette pilote directement la barre inférieure. */
export function horizontalWheelScroll(event: WheelEvent<HTMLElement>) {
  // Maj+molette est réservé à l'édition fine d'un pas (vélocité, écoutée en
  // direct sur le conteneur — voir RhythmGrid) : on ne transforme pas le
  // geste en défilement horizontal.
  if (event.shiftKey) return;
  const viewport = event.currentTarget;
  if (viewport.scrollWidth <= viewport.clientWidth) return;
  event.preventDefault();
  event.stopPropagation();
  const rawDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  const multiplier = event.deltaMode === 1 ? 28 : event.deltaMode === 2 ? viewport.clientWidth : 1;
  viewport.scrollLeft += rawDelta * multiplier;
}
