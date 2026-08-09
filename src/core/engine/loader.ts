import type { Exercise } from './types';
export async function loadExercise(url: string): Promise<Exercise> { const response = await fetch(url); if (!response.ok) throw new Error(`Exercice introuvable: ${response.status}`); return response.json() as Promise<Exercise>; }
