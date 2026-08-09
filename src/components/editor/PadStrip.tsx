import type { MouseEvent } from 'react';
import type { EditorGroup, EditorPadMode } from '../../core/project/exporters';
import { EP133_PADS } from '../../core/project/pads';

interface PadStripProps {
  group: EditorGroup;
  selectedPad: number;
  padModes: Record<string, EditorPadMode>;
  padName: (pad: number) => string;
  padSlot: (pad: number) => number | undefined;
  onSelect: (pad: number) => void;
  onPreview: (pad: number) => void;
  onModeChange: (pad: number, mode: EditorPadMode) => void;
  onOpenKeys: () => void;
}

export function PadStrip(props: PadStripProps) {
  const setKeysFromMiddleClick = (event: MouseEvent<HTMLButtonElement>, pad: number) => {
    if (event.button !== 1) return;
    event.preventDefault();
    props.onSelect(pad);
    props.onModeChange(pad, 'KEYS');
    props.onOpenKeys();
  };
  return <div className="editor-pad-strip"><strong>PAD {props.group}</strong><div className="editor-pad-buttons">{EP133_PADS.map((pad, index) => <button className={`${props.selectedPad === index ? 'active' : ''} ${(props.padModes[`${props.group}:${index}`] || 'ONE') === 'KEYS' ? 'melodic' : ''}`} title={`${props.padName(index)} · SLOT ${props.padSlot(index) || 'VIDE'}`} onClick={() => { props.onSelect(index); props.onPreview(index); }} onAuxClick={(event) => setKeysFromMiddleClick(event, index)} key={pad.key}><b>{pad.key}</b><small>{props.padName(index)}</small></button>)}</div><div className="editor-pad-mode"><small>MODE DU PAD {EP133_PADS[props.selectedPad].key} · {props.padName(props.selectedPad)}</small>{(['ONE', 'KEYS'] as const).map((mode) => <button className={(props.padModes[`${props.group}:${props.selectedPad}`] || 'ONE') === mode ? 'active' : ''} onClick={() => props.onModeChange(props.selectedPad, mode)} key={mode}>{mode}</button>)}</div></div>;
}
