import { MAX_PATTERN_NUMBER } from '../../core/project/song';
import type { EditorGroup } from '../../core/project/exporters';

interface PatternSelectorProps {
  group: EditorGroup;
  number: number;
  onChange: (next: number) => void;
}

const twoDigits = (value: number) => String(value).padStart(2, '0');

/** Sélecteur `PATTERN: [ A01 ▲▼ ]` — bascule quel pattern 1–99 du groupe actif est édité. Boutons seulement, pas de saisie libre (cohérent avec le style « bouton hardware » du reste du Studio). */
export function PatternSelector({ group, number, onChange }: PatternSelectorProps) {
  return <div className="pattern-selector" aria-label="Sélecteur de pattern">
    <b>PATTERN</b>
    <span>{group}{twoDigits(number)}</span>
    <div className="pattern-selector-buttons">
      <button aria-label="Pattern suivant" disabled={number >= MAX_PATTERN_NUMBER} onClick={() => onChange(number + 1)}>▲</button>
      <button aria-label="Pattern précédent" disabled={number <= 1} onClick={() => onChange(number - 1)}>▼</button>
    </div>
  </div>;
}
