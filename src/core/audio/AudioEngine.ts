import * as Tone from 'tone';
import type { Exercise } from '../engine/types';

export interface PadSoundSettings {
  modelVolume: number;
  playerVolume: number;
  tune: number;
}

export class AudioEngine {
  private metronomeId: number | null = null;
  private scheduledNotes: number[] = [];
  private metronomeBeat = 0;
  private countInSeconds = 0;
  private click: Tone.Synth | null = null;
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
  private padSettings: PadSoundSettings[] = Array.from({ length: 12 }, () => ({ modelVolume: 65, playerVolume: 100, tune: 0 }));

  get time() { return Math.max(0, Tone.Transport.seconds - this.countInSeconds); }
  get running() { return Tone.Transport.state === 'started'; }

  private prepareInstruments() {
    if (!this.drumBus) {
      this.drumBus = new Tone.Channel({ volume: 5 });
      this.distortion = new Tone.Distortion({ distortion: 0.18, oversample: '2x' });
      this.compressor = new Tone.Compressor({ threshold: -18, ratio: 5, attack: 0.003, release: 0.18 });
      this.drumBus.chain(this.distortion, this.compressor, Tone.Destination);
    }
    this.click ??= new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.02 }, volume: -13 }).toDestination();
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

  setPadSettings(pad: number, settings: PadSoundSettings) {
    this.padSettings[pad] = { ...settings };
  }

  private triggerPad(pad: number, velocity: number, time: number, source: 'model' | 'player') {
    const settings = this.padSettings[pad];
    const level = source === 'model' ? settings.modelVolume : settings.playerVolume;
    const strength = Math.max(0.02, Math.min(1.4, velocity / 127 * level / 100));
    const transpose = settings.tune;
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

  async unlock() {
    const context = Tone.getContext();
    context.lookAhead = 0.01;
    await Tone.start();
    this.prepareInstruments();
  }

  async start(exercise: Exercise, countInBars = 1, withMetronome = true) {
    await Tone.start();
    this.prepareInstruments();
    this.stop();
    Tone.Transport.bpm.value = exercise.bpm;
    this.countInSeconds = countInBars * 4 * 60 / exercise.bpm;
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
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
    if (this.metronomeId !== null) Tone.Transport.clear(this.metronomeId);
    this.scheduledNotes.forEach((id) => Tone.Transport.clear(id));
    this.metronomeId = null;
    this.scheduledNotes = [];
    this.metronomeBeat = 0;
    this.countInSeconds = 0;
  }

  async loadBackingTrack(url: string) {
    await Tone.loaded();
    return new Tone.Player(url).toDestination();
  }
}
