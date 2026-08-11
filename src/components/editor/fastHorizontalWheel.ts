import type { WheelEvent } from 'react';

/** Dans les éditeurs horizontaux, la molette pilote directement la barre inférieure. */
export function horizontalWheelScroll(event: WheelEvent<HTMLElement>) {
  const viewport = event.currentTarget;
  if (viewport.scrollWidth <= viewport.clientWidth) return;
  event.preventDefault();
  event.stopPropagation();
  const rawDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  const multiplier = event.deltaMode === 1 ? 28 : event.deltaMode === 2 ? viewport.clientWidth : 1;
  viewport.scrollLeft += rawDelta * multiplier;
}
