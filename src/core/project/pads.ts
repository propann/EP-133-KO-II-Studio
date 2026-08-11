/**
 * `category` reprend exactement les familles de sons déjà codées par couleur
 * dans Sons & Transfert (`.bank-*` dans style.css) — sert uniquement de repère
 * visuel pour Rhythm Hero, jamais consommé par le Studio ni sérialisé dans un
 * projet.
 */
export const EP133_PADS = [
  { key: '7', name: 'KICK', category: 'kick' }, { key: '8', name: 'CLAP', category: 'snare' }, { key: '9', name: 'SNARE', category: 'snare' },
  { key: '4', name: 'OPEN HAT', category: 'hat' }, { key: '5', name: 'CLOSED HAT', category: 'hat' }, { key: '6', name: 'RIDE', category: 'hat' },
  { key: '1', name: 'PERC 1', category: 'perc' }, { key: '2', name: 'PERC 2', category: 'perc' }, { key: '3', name: 'PERC 3', category: 'perc' },
  { key: '·', name: 'SHAKER', category: 'perc' }, { key: '0', name: 'BASS', category: 'bass' }, { key: 'ENTER', name: 'FX', category: 'fx' },
] as const;

export const EP133_SCORE_TRACKS = EP133_PADS.map((pad, index) => ({ pad: index, label: `${pad.name} · A-${pad.key}`, category: pad.category }));
