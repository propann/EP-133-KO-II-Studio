/**
 * `category` donne à chaque pad sa propre couleur (12 teintes distinctes,
 * voir --cat-* dans style.css) plutôt que des familles partagées — palette
 * étendue à partir des accents visibles sur la façade K.O.II fournie le
 * 11/08 (orange, rose, bleu, rouge de l'écran et des touches). Sert
 * uniquement de repère visuel pour Rhythm Hero, jamais consommé par le
 * Studio ni sérialisé dans un projet.
 */
export const EP133_PADS = [
  { key: '7', name: 'KICK', category: 'kick' }, { key: '8', name: 'CLAP', category: 'clap' }, { key: '9', name: 'SNARE', category: 'snare' },
  { key: '4', name: 'OPEN HAT', category: 'open-hat' }, { key: '5', name: 'CLOSED HAT', category: 'closed-hat' }, { key: '6', name: 'RIDE', category: 'ride' },
  { key: '1', name: 'PERC 1', category: 'perc-1' }, { key: '2', name: 'PERC 2', category: 'perc-2' }, { key: '3', name: 'PERC 3', category: 'perc-3' },
  { key: '·', name: 'SHAKER', category: 'shaker' }, { key: '0', name: 'BASS', category: 'bass' }, { key: 'ENTER', name: 'FX', category: 'fx' },
] as const;

export const EP133_SCORE_TRACKS = EP133_PADS.map((pad, index) => ({ pad: index, label: `${pad.name} · A-${pad.key}`, category: pad.category }));
