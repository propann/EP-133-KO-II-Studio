import { EDITOR_GROUPS, type EditorGroup } from '../../core/project/exporters';
import { usedBars } from '../../core/project/editor';
import type { ProjectPatterns } from '../../core/project/model';

interface SongModeBarProps {
  activeGroup: EditorGroup;
  patterns: ProjectPatterns;
  onGroupChange: (group: EditorGroup) => void;
}

const twoDigits = (value: number) => String(value).padStart(2, '0');

export function SongModeBar({ activeGroup, patterns, onGroupChange }: SongModeBarProps) {
  const groupBars = Object.fromEntries(EDITOR_GROUPS.map((group) => [group, Math.max(1, usedBars(patterns[group]))])) as Record<EditorGroup, number>;
  const sceneBars = Math.max(...EDITOR_GROUPS.map((group) => groupBars[group]));

  return <section className="song-mode-bar" aria-label="Structure Song mode EP-133">
    <div className="song-mode-title"><b>SONG MODE</b><span>1 POSITION UTILISÉE / 99</span></div>
    <div className="song-position-card active">
      <header><strong>SONG POS {twoDigits(1)}</strong><span>[L.{twoDigits(1)}]</span></header>
      <div className="song-scene-head"><b>SCENE {twoDigits(1)}</b><span>[S.{twoDigits(1)}]</span><em>{sceneBars} MESURE{sceneBars > 1 ? 'S' : ''}</em></div>
      <div className="song-patterns">{EDITOR_GROUPS.map((group) => <button className={activeGroup === group ? 'active' : ''} onClick={() => onGroupChange(group)} key={group}><b>{group}</b><span>PATTERN {group}{twoDigits(1)}</span><small>{groupBars[group]} M.</small></button>)}</div>
    </div>
    <div className="song-position-next" aria-label="Prochaine Song Position non créée"><b>＋</b><span>PROCHAINE<br />SONG POSITION</span></div>
  </section>;
}
