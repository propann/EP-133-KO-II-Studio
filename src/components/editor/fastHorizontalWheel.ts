import type { WheelEvent } from 'react';

/** Dans les éditeurs horizontaux, la molette pilote directement la barre inférieure. */
export function horizontalWheelScroll(event: WheelEvent<HTMLElement>) {
  // Maj+molette (vélocité) et Alt+molette (durée/gate) sont réservés à l'édition fine d'un
  // pas, écoutée en direct sur le conteneur — voir RhythmGrid. Sans ce bypass, le
  // stopPropagation() plus bas empêcherait l'écouteur natif dédié au gate de jamais recevoir
  // l'événement (bug réel trouvé le 12 août : Alt+molette ne faisait strictement rien, alors
  // que Maj+molette fonctionnait déjà — seul le bypass shiftKey existait ici).
  if (event.shiftKey || event.altKey) return;
  const viewport = event.currentTarget;
  if (viewport.scrollWidth <= viewport.clientWidth) return;
  event.preventDefault();
  event.stopPropagation();
  const rawDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  const multiplier = event.deltaMode === 1 ? 28 : event.deltaMode === 2 ? viewport.clientWidth : 1;
  viewport.scrollLeft += rawDelta * multiplier;
}
