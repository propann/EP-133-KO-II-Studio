import type { PadSoundSettings } from '../../core/audio/AudioEngine';
import { EP133_PADS } from '../../core/project/pads';

interface PadSoundEditorProps {
  pad: number;
  settings: PadSoundSettings;
  onChange: (patch: Partial<PadSoundSettings>) => void;
  onPreview: () => void;
  onClose: () => void;
}

export function PadSoundEditor({ pad, settings, onChange, onPreview, onClose }: PadSoundEditorProps) {
  return <section className="sound-editor">
    <div><small>RÉGLAGE DU PAD</small><strong>{EP133_PADS[pad].key} · {EP133_PADS[pad].name}</strong></div>
    <label>SON DU JEU <input type="range" min="0" max="140" value={settings.modelVolume} onChange={(event) => onChange({ modelVolume: Number(event.target.value) })} /><output>{settings.modelVolume}%</output></label>
    <label>SON DU JOUEUR <input type="range" min="0" max="140" value={settings.playerVolume} onChange={(event) => onChange({ playerVolume: Number(event.target.value) })} /><output>{settings.playerVolume}%</output></label>
    <label>HAUTEUR <input type="range" min="-12" max="12" value={settings.tune} onChange={(event) => onChange({ tune: Number(event.target.value) })} /><output>{settings.tune > 0 ? '+' : ''}{settings.tune}</output></label>
    <button onClick={onPreview}>ÉCOUTER</button><button onClick={onClose}>FERMER</button>
  </section>;
}
