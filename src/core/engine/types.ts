export type Grade = 'PERFECT' | 'GOOD' | 'MISS';
export type TargetStatus = 'PENDING' | 'HIT' | 'MISS';
export interface Target { id: string; beat: number; pad: number; note?: number; hit?: boolean; status?: TargetStatus; }
export interface Grading { perfectMs: number; goodMs: number; }
export interface Exercise { id: string; title: string; bpm: number; bars: number; description: string; backingTrack?: string | null; sourceMidi?: string; offsetMs?: number; countInBars?: number; timeSignature?: string; targets: Target[]; grading: Grading; }
export interface PadHit { pad: number; velocity: number; timestamp: number; }
export interface Score { perfect: number; good: number; miss: number; combo: number; maxCombo: number; totalDeltaMs: number; hits: number; }

export const isResolved = (target: Target) => target.status === 'HIT' || target.status === 'MISS';
