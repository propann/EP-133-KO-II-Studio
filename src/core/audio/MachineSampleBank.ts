interface SampleMetadata {
  channels?: number;
  samplerate?: number;
  'sound.rootnote'?: number;
}

export class MachineSampleBank {
  private context: AudioContext | null = null;
  private pcmFiles = new Map<number, File>();
  private metadata = new Map<number, SampleMetadata>();
  private buffers = new Map<number, AudioBuffer>();
  private sources = new Set<AudioBufferSourceNode>();

  get size() { return this.pcmFiles.size; }

  async load(files: FileList | File[]) {
    this.stopAll();
    this.pcmFiles.clear(); this.metadata.clear(); this.buffers.clear();
    const list = [...files];
    const metadataFiles: Array<{ slot: number; file: File }> = [];
    list.forEach((file) => {
      const path = file.webkitRelativePath || file.name;
      const pcm = /(?:^|\/)samples\/(\d{3})\.pcm$/i.exec(path);
      const meta = /(?:^|\/)metadata\/(\d{3})\.json$/i.exec(path);
      if (pcm) this.pcmFiles.set(Number(pcm[1]), file);
      if (meta) metadataFiles.push({ slot: Number(meta[1]), file });
    });
    await Promise.all(metadataFiles.map(async ({ slot, file }) => {
      try { this.metadata.set(slot, JSON.parse(await file.text()) as SampleMetadata); } catch { /* PCM reste lisible avec les valeurs natives par défaut. */ }
    }));
    return this.size;
  }

  private async bufferFor(slot: number) {
    const cached = this.buffers.get(slot); if (cached) return cached;
    const file = this.pcmFiles.get(slot); if (!file) return null;
    this.context ??= new AudioContext({ latencyHint: 'interactive' });
    if (this.context.state === 'suspended') await this.context.resume();
    const metadata = this.metadata.get(slot) || {};
    const channels = metadata.channels === 2 ? 2 : 1;
    const bytes = await file.arrayBuffer();
    const frames = Math.floor(bytes.byteLength / 2 / channels);
    const buffer = this.context.createBuffer(channels, frames, metadata.samplerate || 46875);
    const view = new DataView(bytes);
    for (let frame = 0; frame < frames; frame += 1) for (let channel = 0; channel < channels; channel += 1) {
      buffer.getChannelData(channel)[frame] = view.getInt16((frame * channels + channel) * 2, true) / 32768;
    }
    this.buffers.set(slot, buffer);
    return buffer;
  }

  async play(slot: number, velocity = 110, atPerformanceMs = performance.now(), note?: number, rootNote = 60) {
    const buffer = await this.bufferFor(slot); if (!buffer || !this.context) return false;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = 2 ** (((note ?? rootNote) - rootNote) / 12);
    gain.gain.value = Math.max(0, Math.min(1, velocity / 127));
    source.connect(gain).connect(this.context.destination);
    source.onended = () => this.sources.delete(source);
    this.sources.add(source);
    const delay = Math.max(0, atPerformanceMs - performance.now()) / 1000;
    source.start(this.context.currentTime + delay);
    return true;
  }

  stopAll() {
    this.sources.forEach((source) => { try { source.stop(); } catch { /* déjà terminé */ } });
    this.sources.clear();
  }
}
