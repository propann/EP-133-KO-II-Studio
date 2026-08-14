import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/plugins/regions';
import { computeWaveformPeaks, detectSilenceTrim, suggestNormalizationGainDb, type WavAnalysisReport } from '../../core/audio/wavAnalysis';
// Module léger, sans dépendance WASM (contrairement à wavConvert.ts) — sûr à
// importer statiquement ici pour afficher un poids en direct. La conversion
// réelle reste chargée à la demande, voir `runConversion` plus bas.
import { EP133_TARGET_SAMPLE_RATES, estimateEp133ConversionBytes, estimateEp133MemoryFit, type Ep133TargetRate } from '../../core/audio/ep133Targets';
import type { ChannelMode } from '../../core/audio/wavConvert';
// midiNoteName et EditorPadMode : seule source de vérité déjà établie pour
// ces deux concepts (voir le commentaire sur PAD_MIDI_NOTES dans
// exporters.ts) — ne pas les redéfinir ici.
import { midiNoteName, type EditorPadMode } from '../../core/project/exporters';

const EP133_TARGET_LABELS: Record<Ep133TargetRate, string> = { LO: 'LO · 26 250 HZ', MID: 'MID · 32 000 HZ', HI: 'HI · 46 875 HZ' };
const SOUND_PLAY_MODES: EditorPadMode[] = ['ONE', 'KEYS', 'LEGATO'];

export interface WaveformTrimSelection {
  startSeconds: number;
  endSeconds: number;
}

export interface SoundPrepMetadata {
  /** Note MIDI 0–127, défaut 60 (C4) — même défaut que celui observé dans les
   * métadonnées RIFF réelles de l'EP-133 (`sound.rootnote`, voir
   * docs/REFERENCE_SYSEX_EP133.md). */
  rootNote: number;
  /** `null` = inconnu, jamais deviné automatiquement (pas de détection de
   * tempo ici — hors scope, et une fausse valeur serait pire que l'absence). */
  bpm: number | null;
  playMode: EditorPadMode;
}

const DEFAULT_SOUND_METADATA: SoundPrepMetadata = { rootNote: 60, bpm: null, playMode: 'ONE' };

interface WaveformTrimProps {
  file: File;
  /** Sélection déjà connue pour ce fichier (retour dans le panneau après l'avoir refermé). */
  initialTrim?: WaveformTrimSelection | null;
  onTrimChange: (selection: WaveformTrimSelection) => void;
  /** Fiche audio déjà calculée par le parent (même fichier) — réutilisée pour
   * le gain de normalisation suggéré, sans refaire une deuxième analyse. */
  report?: WavAnalysisReport | 'unsupported' | null;
  /** Occupation et capacité de la machine, du dernier scan (`SoundsPage`) —
   * pour comparer le poids estimé à l'espace restant. `null`/absent si la
   * machine n'a jamais été scannée : pas de jauge affichée, seulement le
   * poids dans l'absolu (jamais un espace disponible supposé). */
  machineMemory?: { usedBytes: number; capacityMb: number } | null;
  /** Métadonnées de préparation déjà connues pour ce fichier (hauteur
   * racine, BPM, mode) — `null`/absent affiche les valeurs par défaut sans
   * les remonter au parent tant que l'utilisateur n'a rien changé. Non
   * destructif : rien n'est encore écrit dans un en-tête RIFF réel, ça
   * exigerait de recouper le format exact sur du matériel — voir
   * `docs/REFERENCE_SYSEX_EP133.md`. */
  metadata?: SoundPrepMetadata | null;
  onMetadataChange: (metadata: SoundPrepMetadata) => void;
  /** Résultat prêt à transférer : le parent ne doit jamais envoyer le fichier
   * original après qu'une conversion EP-133 a été demandée. */
  onConversionReady?: (prepared: { bytes: ArrayBuffer; target: Ep133TargetRate; sampleRate: number; channels: number; durationSeconds: number }) => void;
}

/**
 * Forme d'onde + trim non destructif (Roadmap Phase 4, REGISTRE_IDEES.md
 * A-09/A-10). N'écrit jamais sur le fichier source : la sélection est
 * seulement remontée au parent via `onTrimChange`, à consommer plus tard par
 * un futur pipeline de conversion — voir `etude/02_BIBLIOTHEQUES_TECHNIQUES.md`
 * pour le choix de `wavesurfer.js`.
 *
 * Les crêtes affichées viennent de `computeWaveformPeaks` (lecture directe des
 * octets PCM), pas du décodeur intégré de wavesurfer.js — même précaution que
 * `wavAnalysis.ts` : `AudioContext.decodeAudioData()` peut rééchantillonner
 * silencieusement. `wavesurfer.js` ne sert ici qu'au rendu et à la poignée de
 * région ; la lecture audio passe par son propre élément `<audio>` interne,
 * indépendant de la fiche audio déterministe déjà affichée à côté.
 */
export function WaveformTrim({ file, initialTrim, onTrimChange, report, machineMemory, metadata, onMetadataChange, onConversionReady }: WaveformTrimProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionRef = useRef<Region | null>(null);
  const bytesRef = useRef<ArrayBuffer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unsupported'>('loading');
  // Suggestion seulement (A-08) : calculée au chargement, appliquée à la
  // région uniquement si l'utilisateur clique AUTO-TRIM — jamais toute seule.
  const [silenceSuggestion, setSilenceSuggestion] = useState<{ startSeconds: number; endSeconds: number } | null>(null);
  // Reflet React de la région wavesurfer (regionRef), pour recalculer le
  // poids estimé à chaque glisser — regionRef seul ne déclenche pas de rendu.
  const [currentTrim, setCurrentTrim] = useState<{ startSeconds: number; endSeconds: number } | null>(null);
  // Conversion EP-133 (R-07) : module ~2 Mo (WASM libsamplerate embarqué en
  // base64) chargé à la demande au premier clic, jamais au chargement de la
  // page — voir la fonction `runConversion` plus bas.
  const [converting, setConverting] = useState<Ep133TargetRate | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertedPreview, setConvertedPreview] = useState<{ target: Ep133TargetRate; url: string; sampleRate: number; durationSeconds: number } | null>(null);
  // Fondu linéaire (Roadmap Phase 4) : durées en ms, converties en secondes à
  // l'appel. 0 par défaut = pas de fondu, comportement inchangé.
  const [fadeInMs, setFadeInMs] = useState(0);
  const [fadeOutMs, setFadeOutMs] = useState(0);
  const [channelMode, setChannelMode] = useState<ChannelMode>('mix');

  // Remonte une sélection au parent (sauvegarde) et au composant lui-même
  // (recalcul immédiat du poids estimé affiché sur les boutons LO/MID/HI).
  const reportTrim = (selection: { startSeconds: number; endSeconds: number }) => {
    setCurrentTrim(selection);
    onTrimChange(selection);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    setStatus('loading');
    setPlaying(false);
    setSilenceSuggestion(null);
    setCurrentTrim(null);
    setConvertedPreview(null);
    setConvertError(null);

    const regions = RegionsPlugin.create();
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height: 64,
      waveColor: '#e9a06b',
      progressColor: '#FF4400',
      cursorColor: '#1A1A1A',
      normalize: true,
      plugins: [regions],
    });
    wavesurferRef.current = wavesurfer;

    void (async () => {
      const bytes = await file.arrayBuffer();
      if (cancelled) return;
      bytesRef.current = bytes;
      const peaks = computeWaveformPeaks(bytes, 1000);
      if (!peaks) { setStatus('unsupported'); return; }
      try {
        await wavesurfer.loadBlob(file, [peaks.values], peaks.durationSeconds);
      } catch {
        if (!cancelled) setStatus('unsupported');
        return;
      }
      if (cancelled) return;
      setStatus('ready');
      setSilenceSuggestion(detectSilenceTrim(bytes));
      const duration = peaks.durationSeconds;
      const start = Math.min(initialTrim?.startSeconds ?? 0, duration);
      const end = Math.max(start, Math.min(initialTrim?.endSeconds ?? duration, duration));
      const region = regions.addRegion({
        start,
        end,
        color: 'rgba(255, 68, 0, 0.2)',
        drag: true,
        resize: true,
      });
      regionRef.current = region;
      reportTrim({ startSeconds: region.start, endSeconds: region.end });
    })();

    const handleRegionUpdated = (region: Region) => reportTrim({ startSeconds: region.start, endSeconds: region.end });
    regions.on('region-updated', handleRegionUpdated);
    wavesurfer.on('play', () => setPlaying(true));
    wavesurfer.on('pause', () => setPlaying(false));
    wavesurfer.on('finish', () => setPlaying(false));

    return () => {
      cancelled = true;
      wavesurfer.destroy();
      wavesurferRef.current = null;
      regionRef.current = null;
    };
    // `initialTrim` n'amorce la région qu'au premier chargement de ce fichier —
    // volontairement absent des dépendances, sinon chaque frappe de région
    // relancerait ce chargement et recréerait wavesurfer en boucle.
  }, [file]);

  const togglePlayback = () => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer) return;
    if (playing) wavesurfer.pause();
    else void wavesurfer.play();
  };

  const soundMetadata = metadata ?? DEFAULT_SOUND_METADATA;
  const updateMetadata = (patch: Partial<SoundPrepMetadata>) => onMetadataChange({ ...soundMetadata, ...patch });

  const applySilenceSuggestion = () => {
    const region = regionRef.current;
    if (!region || !silenceSuggestion) return;
    region.setOptions({ start: silenceSuggestion.startSeconds, end: silenceSuggestion.endSeconds });
    reportTrim(silenceSuggestion);
  };

  // Révoque l'URL de la pré-écoute convertie précédente, à chaque remplacement et au démontage.
  useEffect(() => () => { if (convertedPreview) URL.revokeObjectURL(convertedPreview.url); }, [convertedPreview]);

  const runConversion = async (target: Ep133TargetRate) => {
    const bytes = bytesRef.current;
    const region = regionRef.current;
    if (!bytes || !region || converting) return;
    setConverting(target);
    setConvertError(null);
    try {
      const { convertWavForEp133 } = await import('../../core/audio/wavConvert');
      const result = await convertWavForEp133(bytes, EP133_TARGET_SAMPLE_RATES[target], undefined, { startSeconds: region.start, endSeconds: region.end }, { fadeInSeconds: fadeInMs / 1000, fadeOutSeconds: fadeOutMs / 1000 }, channelMode);
      if (!result) { setConvertError('CONVERSION IMPOSSIBLE (FORMAT NON PRIS EN CHARGE OU SÉLECTION VIDE)'); return; }
      const url = URL.createObjectURL(new Blob([result.bytes], { type: 'audio/wav' }));
      setConvertedPreview({ target, url, sampleRate: result.sampleRate, durationSeconds: result.durationSeconds });
      onConversionReady?.({ bytes: result.bytes, target, sampleRate: result.sampleRate, channels: result.channels, durationSeconds: result.durationSeconds });
    } catch (error) {
      setConvertError((error as Error)?.message || 'ÉCHEC DE LA CONVERSION');
    } finally {
      setConverting(null);
    }
  };

  const peakLevel = report && report !== 'unsupported' ? report.peakLevel : null;
  const peakDb = peakLevel && peakLevel > 0 ? 20 * Math.log10(peakLevel) : null;
  const suggestedGainDb = peakLevel !== null ? suggestNormalizationGainDb(peakLevel) : null;
  // Même règle que `convertWavForEp133` (targetChannels non fourni) —
  // l'estimation doit correspondre à ce que la conversion produira.
  const outChannels: 1 | 2 = channelMode === 'mix' && report && report !== 'unsupported' && report.channels >= 2 ? 2 : 1;
  const trimDurationSeconds = currentTrim ? Math.max(0, currentTrim.endSeconds - currentTrim.startSeconds) : 0;

  return <div className="waveform-trim">
    <div className="waveform-trim-canvas" ref={containerRef} />
    {status === 'loading' && <p className="waveform-trim-status">CHARGEMENT DE LA FORME D’ONDE…</p>}
    {status === 'unsupported' && <p className="waveform-trim-status">FORMAT NON WAV PCM/FLOAT — PAS DE FORME D’ONDE</p>}
    {status === 'ready' && <div className="waveform-trim-actions">
      <button className="waveform-trim-play" onClick={togglePlayback}>{playing ? '⏸ PAUSE' : '▶ ÉCOUTER'}</button>
      <button className="waveform-trim-autotrim" disabled={!silenceSuggestion} onClick={applySilenceSuggestion} title="Cale la sélection sur le signal détecté au-dessus de -40 dBFS, avec 10 ms de garde">
        ✂ AUTO-TRIM SILENCE
      </button>
      {peakDb !== null && suggestedGainDb !== null && <small className="waveform-trim-gain">CRÊTE {peakDb.toFixed(1)} DBFS · GAIN SUGGÉRÉ {suggestedGainDb >= 0 ? '+' : ''}{suggestedGainDb.toFixed(1)} DB (CIBLE -1 DBFS)</small>}
      <div className="waveform-trim-metadata">
        <small>MÉTADONNÉES DE PRÉPARATION (PAS ENCORE ÉCRITES DANS LE FICHIER)</small>
        <div className="waveform-trim-metadata-fields">
          <div className="waveform-trim-mode-buttons">
            {SOUND_PLAY_MODES.map((mode) => <button key={mode} className={soundMetadata.playMode === mode ? 'active' : ''} aria-pressed={soundMetadata.playMode === mode} onClick={() => updateMetadata({ playMode: mode })}>{mode}</button>)}
          </div>
          <label>HAUTEUR RACINE
            <input type="number" min={0} max={127} value={soundMetadata.rootNote} onChange={(event) => updateMetadata({ rootNote: Math.max(0, Math.min(127, Number(event.target.value) || 0)) })} />
            <small>{midiNoteName(soundMetadata.rootNote)}</small>
          </label>
          <label>BPM
            <input type="number" min={0} placeholder="INCONNU" value={soundMetadata.bpm ?? ''} onChange={(event) => { const raw = event.target.value; updateMetadata({ bpm: raw === '' ? null : Math.max(0, Number(raw) || 0) }); }} />
          </label>
        </div>
      </div>
      <div className="waveform-trim-convert">
        <small>CONVERSION EP-133 (SÉLECTION UNIQUEMENT)</small>
        <div className="waveform-trim-fade">
          <label>FONDU ENTRÉE (MS)<input type="number" min={0} step={5} value={fadeInMs} onChange={(event) => setFadeInMs(Math.max(0, Number(event.target.value) || 0))} /></label>
          <label>FONDU SORTIE (MS)<input type="number" min={0} step={5} value={fadeOutMs} onChange={(event) => setFadeOutMs(Math.max(0, Number(event.target.value) || 0))} /></label>
        </div>
        <div className="waveform-trim-channel-buttons" aria-label="Canal stéréo">
          {(['mix', 'left', 'right'] as ChannelMode[]).map((mode) => <button key={mode} className={channelMode === mode ? 'active' : ''} aria-pressed={channelMode === mode} onClick={() => setChannelMode(mode)}>{mode === 'mix' ? 'MIX' : mode === 'left' ? 'GAUCHE' : 'DROITE'}</button>)}
        </div>
        <div className="waveform-trim-convert-buttons">
          {(Object.keys(EP133_TARGET_LABELS) as Ep133TargetRate[]).map((target) => {
            const estimatedBytes = estimateEp133ConversionBytes(trimDurationSeconds, outChannels, EP133_TARGET_SAMPLE_RATES[target]);
            const fit = machineMemory ? estimateEp133MemoryFit(estimatedBytes, machineMemory.usedBytes, machineMemory.capacityMb) : null;
            return <button key={target} className={fit && !fit.fits ? 'waveform-trim-overflow' : ''} disabled={Boolean(converting)} onClick={() => void runConversion(target)}>
              <b>{converting === target ? 'CONVERSION…' : EP133_TARGET_LABELS[target]}</b>
              <small>{(estimatedBytes / 1024).toFixed(1)} KO ESTIMÉS</small>
              {fit && <small className={fit.fits ? 'waveform-trim-fits' : 'waveform-trim-fits-not'}>{fit.fits ? `TIENT · ${(fit.remainingBytes / 1e6).toFixed(2)} MO RESTANTS` : `NE TIENT PAS · DÉPASSE DE ${((estimatedBytes - fit.remainingBytes) / 1024).toFixed(1)} KO`}</small>}
            </button>;
          })}
        </div>
        {convertError && <small className="waveform-trim-status">{convertError}</small>}
        {convertedPreview && <div className="waveform-trim-preview">
          <small>APERÇU {EP133_TARGET_LABELS[convertedPreview.target]} · {convertedPreview.durationSeconds.toFixed(2)} S</small>
          <audio controls src={convertedPreview.url} />
        </div>}
      </div>
    </div>}
  </div>;
}
