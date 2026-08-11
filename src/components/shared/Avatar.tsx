/**
 * Avatars du joueur — mascottes géométriques originales, composées à partir
 * du vocabulaire déjà établi dans ce projet (formes de touche arrondies,
 * palette --cat-*, LCD ambré). Volontairement PAS dérivées de la photo de
 * façade K.O.II fournie par l'utilisateur : une photo produit retouchée
 * reste une œuvre dérivée de l'originale, donc un vrai risque de droit
 * d'auteur — voir la discussion du 11/08. Ici, chaque avatar est une
 * composition de formes simples (tête, yeux, « topper ») avec un id de
 * variante, pas un dessin qui copie un objet réel précis.
 */
export type AvatarShape = 'square' | 'hex' | 'circle';
export type AvatarEyes = 'dot' | 'ring' | 'bar';
export type AvatarTopper = 'antenna' | 'spikes' | 'flat' | 'none';

export interface AvatarSpec {
  id: string;
  label: string;
  shape: AvatarShape;
  eyes: AvatarEyes;
  topper: AvatarTopper;
  color: string;
}

/** Huit compositions prédéfinies, une par couleur de la palette --cat-*. */
export const AVATAR_PRESETS: AvatarSpec[] = [
  { id: 'kick', label: 'KICK', shape: 'square', eyes: 'dot', topper: 'antenna', color: 'var(--cat-kick)' },
  { id: 'clap', label: 'CLAP', shape: 'hex', eyes: 'ring', topper: 'spikes', color: 'var(--cat-clap)' },
  { id: 'snare', label: 'SNARE', shape: 'circle', eyes: 'bar', topper: 'flat', color: 'var(--cat-snare)' },
  { id: 'open-hat', label: 'OPEN HAT', shape: 'square', eyes: 'ring', topper: 'flat', color: 'var(--cat-open-hat)' },
  { id: 'closed-hat', label: 'CLOSED HAT', shape: 'hex', eyes: 'dot', topper: 'none', color: 'var(--cat-closed-hat)' },
  { id: 'ride', label: 'RIDE', shape: 'circle', eyes: 'dot', topper: 'antenna', color: 'var(--cat-ride)' },
  { id: 'perc-2', label: 'PERC 2', shape: 'square', eyes: 'bar', topper: 'spikes', color: 'var(--cat-perc-2)' },
  { id: 'fx', label: 'FX', shape: 'hex', eyes: 'ring', topper: 'antenna', color: 'var(--cat-fx)' },
];

function headPath(shape: AvatarShape) {
  if (shape === 'circle') return <circle cx="32" cy="34" r="24" />;
  if (shape === 'hex') return <polygon points="32,8 54,20 54,48 32,60 10,48 10,20" />;
  return <rect x="9" y="11" width="46" height="46" rx="12" />;
}

function eyesMarkup(eyes: AvatarEyes) {
  if (eyes === 'ring') return <><circle cx="23" cy="32" r="5" fill="none" stroke="#1a1a1a" strokeWidth="3" /><circle cx="41" cy="32" r="5" fill="none" stroke="#1a1a1a" strokeWidth="3" /></>;
  if (eyes === 'bar') return <><rect x="17" y="29" width="12" height="6" rx="3" fill="#1a1a1a" /><rect x="35" y="29" width="12" height="6" rx="3" fill="#1a1a1a" /></>;
  return <><circle cx="23" cy="32" r="4.5" fill="#1a1a1a" /><circle cx="41" cy="32" r="4.5" fill="#1a1a1a" /></>;
}

function topperMarkup(topper: AvatarTopper) {
  if (topper === 'antenna') return <><line x1="32" y1="10" x2="32" y2="0" stroke="#1a1a1a" strokeWidth="3" /><circle cx="32" cy="0" r="3.5" fill="#1a1a1a" /></>;
  if (topper === 'spikes') return <><line x1="20" y1="10" x2="16" y2="1" stroke="#1a1a1a" strokeWidth="3" /><line x1="44" y1="10" x2="48" y2="1" stroke="#1a1a1a" strokeWidth="3" /></>;
  if (topper === 'flat') return <rect x="16" y="4" width="32" height="6" rx="3" fill="#1a1a1a" />;
  return null;
}

interface AvatarProps {
  spec: AvatarSpec;
  size?: number;
}

export function Avatar({ spec, size = 64 }: AvatarProps) {
  return <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Avatar ${spec.label}`}>
    {topperMarkup(spec.topper)}
    <g fill={spec.color} stroke="#1a1a1a" strokeWidth="2.5">{headPath(spec.shape)}</g>
    {eyesMarkup(spec.eyes)}
    <path d="M22 44 Q32 50 42 44" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}
