import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/plugins/regions';
import { computeWaveformPeaks } from '../../core/audio/wavAnalysis';

export interface WaveformTrimSelection {
  startSeconds: number;
  endSeconds: number;
}

interface WaveformTrimProps {
  file: File;
  /** Sélection déjà connue pour ce fichier (retour dans le panneau après l'avoir refermé). */
  initialTrim?: WaveformTrimSelection | null;
  onTrimChange: (selection: WaveformTrimSelection) => void;
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
export function WaveformTrim({ file, initialTrim, onTrimChange }: WaveformTrimProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unsupported'>('loading');

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    setStatus('loading');
    setPlaying(false);

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
      onTrimChange({ startSeconds: region.start, endSeconds: region.end });
    })();

    const handleRegionUpdated = (region: Region) => onTrimChange({ startSeconds: region.start, endSeconds: region.end });
    regions.on('region-updated', handleRegionUpdated);
    wavesurfer.on('play', () => setPlaying(true));
    wavesurfer.on('pause', () => setPlaying(false));
    wavesurfer.on('finish', () => setPlaying(false));

    return () => {
      cancelled = true;
      wavesurfer.destroy();
      wavesurferRef.current = null;
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

  return <div className="waveform-trim">
    <div className="waveform-trim-canvas" ref={containerRef} />
    {status === 'loading' && <p className="waveform-trim-status">CHARGEMENT DE LA FORME D’ONDE…</p>}
    {status === 'unsupported' && <p className="waveform-trim-status">FORMAT NON WAV PCM/FLOAT — PAS DE FORME D’ONDE</p>}
    {status === 'ready' && <button className="waveform-trim-play" onClick={togglePlayback}>{playing ? '⏸ PAUSE' : '▶ ÉCOUTER LA SÉLECTION'}</button>}
  </div>;
}
