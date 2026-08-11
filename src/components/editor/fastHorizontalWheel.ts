import type { WheelEvent } from 'react';

/** Dans les éditeurs horizontaux, la molette pilote directement la barre inférieure. */
export function horizontalWheelScroll(event: WheelEvent<HTMLElement>) {
  const viewport = event.currentTarget;
  if (viewport.scrollWidth <= viewport.clientWidth) return;
  event.preventDefault();
  event.stopPropagation();
  viewport.scrollLeft += event.deltaY || event.deltaX;
}
