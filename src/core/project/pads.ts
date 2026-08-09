export const EP133_PADS = [
  { key: '7', name: 'KICK' }, { key: '8', name: 'CLAP' }, { key: '9', name: 'SNARE' },
  { key: '4', name: 'OPEN HAT' }, { key: '5', name: 'CLOSED HAT' }, { key: '6', name: 'RIDE' },
  { key: '1', name: 'PERC 1' }, { key: '2', name: 'PERC 2' }, { key: '3', name: 'PERC 3' },
  { key: '·', name: 'SHAKER' }, { key: '0', name: 'BASS' }, { key: 'ENTER', name: 'FX' },
] as const;

export const EP133_SCORE_TRACKS = EP133_PADS.map((pad, index) => ({ pad: index, label: `${pad.name} · A-${pad.key}` }));
