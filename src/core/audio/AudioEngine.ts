import * as Tone from 'tone';
import type { Exercise } from '../engine/types';

export interface PadSoundSettings {
  modelVolume: number;
  playerVolume: number;
  tune: number;
}

/**
 * Un jeu complet d'instruments de percussion (un par catégorie de pad). Deux
 * instances coexistent dans `AudioEngine` — une pour le modèle programmé
 * (`Tone.Transport.schedule`, avec anticipation/lookahead) et une pour les
 * frappes live du joueur (`Tone.immediate()`, sans anticipation).
 *
 * Bug réel trouvé le 12 août, pas seulement supposé : avec un seul jeu
 * partagé entre les deux sources, une frappe live pouvait arriver à un
 * instant audio légèrement ANTÉRIEUR à une note du modèle déjà programmée
 * en avance sur ce même instrument (`this.kick`, etc.) — la timeline
 * interne de Tone (`StateTimeline`) exige un ordre strictement croissant,
 * peu importe la source, d'où « The time must be greater than or equal to
 * the last scheduled time » côté navigateur. Reproduit avec un vrai
 * scénario Playwright (stack trace complète : `MembraneSynth.triggerAttack`
 * → `OmniOscillator.start` → `StateTimeline.add`), pas supposé sur lecture
 * de code — le joueur qui tape la grosse caisse pile au bon moment, c'est
 * justement le but du jeu, donc la collision n'est pas un cas rare.
 * Deux instruments distincts par catégorie de pad éliminent la collision
 * par construction : chaque source a sa propre timeline interne.
 */
class PadVoiceSet {
  private drumBus: Tone.Channel | null = null;
  private distortion: Tone.Distortion | null = null;
  private compressor: Tone.Compressor | null = null;
  private kick: Tone.MembraneSynth | null = null;
  private clap: Tone.NoiseSynth | null = null;
  private snare: Tone.NoiseSynth | null = null;
  private openHat: Tone.NoiseSynth | null = null;
  private closedHat: Tone.NoiseSynth | null = null;
  private ride: Tone.NoiseSynth | null = null;
  private percs: Tone.Synth[] = [];
  private shaker: Tone.NoiseSynth | null = null;
  private bass: Tone.MonoSynth | null = null;
  private fx: Tone.FMSynth | null = null;

  prepare() {
    if (!this.drumBus) {
      this.drumBus = new Tone.Channel({ volume: 5 });
      this.distortion = new Tone.Distortion({ distortion: 0.18, oversample: '2x' });
      this.compressor = new Tone.Compressor({ threshold: -18, ratio: 5, attack: 0.003, release: 0.18 });
      this.drumBus.chain(this.distortion, this.compressor, Tone.Destination);
    }
    this.kick ??= new Tone.MembraneSynth({ pitchDecay: 0.055, octaves: 7, envelope: { attack: 0.001, decay: 0.26, sustain: 0, release: 0.12 }, volume: -2 }).connect(this.drumBus);
    this.clap ??= new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.12 }, volume: -8 }).connect(this.drumBus);
    this.snare ??= new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.06 }, volume: -5 }).connect(this.drumBus);
    this.openHat ??= new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.32, sustain: 0.02, release: 0.16 }, volume: -5 }).connect(this.drumBus);
    this.closedHat ??= new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.018 }, volume: -4 }).connect(this.drumBus);
    this.ride ??= new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.48, sustain: 0.025, release: 0.28 }, volume: -6 }).connect(this.drumBus);
    if (!this.percs.length) this.percs = [0, 1, 2].map((index) => new Tone.Synth({ oscillator: { type: index === 0 ? 'triangle' : index === 1 ? 'sine' : 'fmsquare' }, envelope: { attack: 0.001, decay: 0.1 + index * 0.035, sustain: 0, release: 0.05 }, volume: -7 }).connect(this.drumBus!));
    this.shaker ??= new Tone.NoiseSynth({ noise: { type: 'brown' }, envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.025 }, volume: -9 }).connect(this.drumBus);
    this.bass ??= new Tone.MonoSynth({ oscillator: { type: 'square' }, filter: { type: 'lowpass', Q: 2, rolloff: -24 }, envelope: { attack: 0.004, decay: 0.16, sustain: 0.12, release: 0.12 }, filterEnvelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1, baseFrequency: 70, octaves: 2.5 }, volume: -7 }).connect(this.drumBus);
    this.fx ??= new Tone.FMSynth({ harmonicity: 2.5, modulationIndex: 12, envelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.15 }, modulationEnvelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 }, volume: -9 }).connect(this.drumBus);
  }

  trigger(pad: number, time: number, strength: number, transpose: number) {
    if (pad === 0) this.kick?.triggerAttackRelease(Tone.Frequency('C1').transpose(transpose).toNote(), '8n', time, strength);
    else if (pad === 1) this.clap?.triggerAttackRelease('16n', time, strength);
    else if (pad === 2) this.snare?.triggerAttackRelease('16n', time, strength);
    else if (pad >= 3 && pad <= 5) {
      const cymbal = [this.openHat, this.closedHat, this.ride][pad - 3];
      if (cymbal) cymbal.noise.playbackRate = Math.pow(2, transpose / 12);
      cymbal?.triggerAttackRelease(pad === 3 ? '8n' : pad === 5 ? '4n' : '32n', time, strength * 0.8);
    } else if (pad >= 6 && pad <= 8) {
      const notes = ['C4', 'E4', 'G4'];
      this.percs[pad - 6]?.triggerAttackRelease(Tone.Frequency(notes[pad - 6]).transpose(transpose).toNote(), '16n', time, strength);
    } else if (pad === 9) this.shaker?.triggerAttackRelease('32n', time, strength * 0.8);
    else if (pad === 10) this.bass?.triggerAttackRelease(Tone.Frequency('C2').transpose(transpose).toNote(), '8n', time, strength);
    else if (pad === 11) this.fx?.triggerAttackRelease(Tone.Frequency('C5').transpose(transpose).toNote(), '8n', time, strength * 0.8);
  }

  dispose() {
    this.kick?.dispose();
    this.clap?.dispose();
    this.snare?.dispose();
    this.openHat?.dispose();
    this.closedHat?.dispose();
    this.ride?.dispose();
    this.percs.forEach((instrument) => instrument.dispose());
    this.shaker?.dispose();
    this.bass?.dispose();
    this.fx?.dispose();
    this.distortion?.dispose();
    this.compressor?.dispose();
    this.drumBus?.dispose();
    this.kick = null;
    this.clap = null;
    this.snare = null;
    this.openHat = null;
    this.closedHat = null;
    this.ride = null;
    this.percs = [];
    this.shaker = null;
    this.bass = null;
    this.fx = null;
    this.distortion = null;
    this.compressor = null;
    this.drumBus = null;
  }
}

export class AudioEngine {
  private metronomeId: number | null = null;
  private scheduledNotes: number[] = [];
  private metronomeBeat = 0;
  private countInSeconds = 0;
  private startToken = 0;
  private click: Tone.Synth | null = null;
  private modelVoices = new PadVoiceSet();
  private playerVoices = new PadVoiceSet();
  private padSettings: PadSoundSettings[] = Array.from({ length: 12 }, () => ({ modelVolume: 65, playerVolume: 100, tune: 0 }));

  get time() { return Math.max(0, Tone.Transport.seconds - this.countInSeconds); }
  get running() { return Tone.Transport.state === 'started'; }

  private prepareInstruments() {
    this.click ??= new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.02 }, volume: -13 }).toDestination();
    this.modelVoices.prepare();
    this.playerVoices.prepare();
  }

  setPadSettings(pad: number, settings: PadSoundSettings) {
    this.padSettings[pad] = { ...settings };
  }

  private triggerPad(pad: number, velocity: number, time: number, source: 'model' | 'player') {
    const settings = this.padSettings[pad];
    const level = source === 'model' ? settings.modelVolume : settings.playerVolume;
    const strength = Math.max(0.02, Math.min(1.4, velocity / 127 * level / 100));
    const transpose = settings.tune;
    (source === 'model' ? this.modelVoices : this.playerVoices).trigger(pad, time, strength, transpose);
  }

  async unlock() {
    const context = Tone.getContext();
    context.lookAhead = 0.01;
    await Tone.start();
    this.prepareInstruments();
  }

  async start(exercise: Exercise, countInBars = 1, withMetronome = true, loop = false) {
    this.stop();
    const token = this.startToken;
    await Tone.start();
    if (token !== this.startToken) return;
    this.prepareInstruments();
    Tone.Transport.bpm.value = exercise.bpm;
    this.countInSeconds = countInBars * 4 * 60 / exercise.bpm;
    Tone.Transport.loop = loop;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = this.countInSeconds + exercise.bars * 4 * 60 / exercise.bpm;
    if (withMetronome) {
      this.metronomeId = Tone.Transport.scheduleRepeat((time) => {
        const downbeat = this.metronomeBeat % 4 === 0;
        this.click?.triggerAttackRelease(downbeat ? 'C6' : 'C5', '32n', time, downbeat ? 0.9 : 0.55);
        this.metronomeBeat += 1;
      }, '4n');
    }
    this.scheduledNotes = exercise.targets.map((target) => Tone.Transport.schedule((time) => {
      this.triggerPad(target.pad, 100, time, 'model');
    }, this.countInSeconds + target.beat * 60 / exercise.bpm));
    Tone.Transport.start();
  }

  playPad(pad: number, velocity: number) {
    this.prepareInstruments();
    // `immediate()` contourne le look-ahead musical pour les frappes live.
    this.triggerPad(pad, velocity, Tone.immediate(), 'player');
  }

  async previewPad(pad: number) {
    await Tone.start();
    this.prepareInstruments();
    this.triggerPad(pad, 110, Tone.immediate(), 'player');
  }

  stop() {
    this.startToken += 1;
    Tone.Transport.stop();
    if (this.metronomeId !== null) Tone.Transport.clear(this.metronomeId);
    this.scheduledNotes.forEach((id) => Tone.Transport.clear(id));
    Tone.Transport.cancel(0);
    Tone.Transport.seconds = 0;
    Tone.Transport.loop = false;
    this.metronomeId = null;
    this.scheduledNotes = [];
    this.metronomeBeat = 0;
    this.countInSeconds = 0;
  }

  dispose() {
    this.stop();
    this.click?.dispose();
    this.modelVoices.dispose();
    this.playerVoices.dispose();
    this.click = null;
  }

  async loadBackingTrack(url: string) {
    await Tone.loaded();
    return new Tone.Player(url).toDestination();
  }
}
