import fs from 'node:fs';
import { decodeEp133ProjectTar } from '../src/core/project/importers.ts';

const [input, output, projectNumber = '1'] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node tools/export-ep133-project-snapshot.mjs projet.tar sortie.json [numéro]');

const decoded = decodeEp133ProjectTar(new Uint8Array(fs.readFileSync(input)), input);
const document = {
  schema: 'ep.project.v1',
  product: 'ep133',
  metadata: { title: `EP-133 · PROJET ${String(projectNumber).padStart(2, '0')}`, source: 'device-readonly', project: Number(projectNumber) },
  settings: { bpm: decoded.bpm || 120 },
  pads: decoded.pads.map(({ group, pad, slot, playMode, rootNote }) => ({ group, pad, slot, playMode, rootNote })),
  patterns: decoded.patterns.map((pattern) => ({
    id: `${pattern.group}${String(pattern.pattern).padStart(2, '0')}`,
    bars: pattern.bars,
    events: pattern.notes.map(({ tick, pad, note, velocity, duration }) => ({ tick, pad, note, velocity, duration })),
  })),
  scenes: decoded.scenes.map(({ scene, groupPatterns, timeSignature }) => ({ scene, groupPatterns, timeSignature })),
  song: decoded.song,
  currentScene: decoded.currentScene,
  warnings: decoded.warnings,
};

fs.writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Projet ${projectNumber} décodé : ${decoded.patterns.length} patterns, ${decoded.scenes.length} scènes, ${decoded.song.length} Song Position(s) -> ${output}`);
