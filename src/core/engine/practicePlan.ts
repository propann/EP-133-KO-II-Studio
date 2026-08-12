/**
 * Parcours 7 jours / 30 jours (dernier item du plan P1, REGISTRE_IDEES.md
 * Q-14) : une rotation des dix styles écrits à la main (`DEDICATED_STYLE_IDS`),
 * difficulté qui augmente d'un cran à chaque tour complet de la rotation, et
 * répétition automatique du jour précédent quand son taux de MISS dépasse
 * 25 % — même seuil que `adviseTempo` dans `report.ts`, pour rester cohérent
 * avec le reste des conseils du jeu.
 *
 * Repose sur un journal de séances daté (`PracticeLogEntry`), séparé du
 * cumul de `playerProfile.ts` (qui ne garde qu'un total sans date ni style
 * par séance — insuffisant pour savoir ce qui a été joué un jour donné).
 *
 * Important : ce n'est **pas** un calendrier figé à l'avance. Les jours déjà
 * joués (`status: 'done'`) reflètent l'historique réel ; les jours futurs
 * (`status: 'upcoming'`) sont une prévision qui suppose une progression
 * normale — elle se recalcule à chaque consultation à partir de
 * l'historique réel, et change si un jour intermédiaire déclenche une
 * répétition.
 */

export interface PracticeLogEntry {
  /** Date locale au format YYYY-MM-DD — un jour, pas un horodatage précis. */
  date: string;
  styleId: string;
  difficulty: number;
  perfect: number;
  good: number;
  miss: number;
}

export const PRACTICE_LOG_KEY = 'ep133-rhythm-hero:practice-log:v1';

/** Nombre d'entrées conservées au maximum — un historique utile sans grossir indéfiniment le localStorage. */
const MAX_LOG_ENTRIES = 200;

/** Relit le journal ; filtre silencieusement toute entrée corrompue plutôt que d'échouer entièrement. */
export function loadPracticeLog(storage: Pick<Storage, 'getItem'>): PracticeLogEntry[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(PRACTICE_LOG_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is PracticeLogEntry => Boolean(
      entry && typeof entry === 'object'
      && typeof (entry as PracticeLogEntry).date === 'string'
      && typeof (entry as PracticeLogEntry).styleId === 'string'
      && Number.isFinite((entry as PracticeLogEntry).difficulty),
    ));
  } catch {
    return [];
  }
}

/** Ajoute une séance jouée (pas une simple LECTURE) au journal, borné à `MAX_LOG_ENTRIES` entrées les plus récentes. */
export function appendPracticeLogEntry(storage: Pick<Storage, 'setItem'>, log: PracticeLogEntry[], entry: PracticeLogEntry): PracticeLogEntry[] {
  const next = [...log, entry].slice(-MAX_LOG_ENTRIES);
  storage.setItem(PRACTICE_LOG_KEY, JSON.stringify(next));
  return next;
}

export interface PracticeDay {
  /** Position dans le parcours affiché, 1 = aujourd'hui. */
  day: number;
  date: string;
  styleId: string;
  difficulty: number;
  status: 'done' | 'today' | 'upcoming';
  /** Vrai si ce jour répète le style/niveau de la veille plutôt que d'avancer dans la rotation (taux de MISS de la veille > 25 %). */
  repeat: boolean;
  result?: { perfect: number; good: number; miss: number };
}

const MISS_RATE_REPEAT_THRESHOLD = 0.25;

function baselineForIndex(index: number, styleIds: string[]): { styleId: string; difficulty: number } {
  const cycle = Math.floor(index / styleIds.length);
  return { styleId: styleIds[index % styleIds.length], difficulty: Math.min(5, cycle + 1) };
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Construit le parcours de `days` jours (7 ou 30) démarrant à `todayISO`. Un jour sans style dédié disponible (`styleIds` vide) renvoie un tableau vide plutôt que de planter. */
export function buildPracticePlan(log: PracticeLogEntry[], styleIds: string[], days: number, todayISO: string): PracticeDay[] {
  if (!styleIds.length) return [];
  const byDate = new Map<string, PracticeLogEntry>();
  log.forEach((entry) => byDate.set(entry.date, entry)); // la dernière entrée du jour l'emporte (journal ajouté dans l'ordre chronologique)

  const plan: PracticeDay[] = [];
  let cursor = 0;
  let previousMissRate: number | null = null;
  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(todayISO, i);
    const logged = byDate.get(date);
    const repeat = previousMissRate !== null && previousMissRate > MISS_RATE_REPEAT_THRESHOLD;
    const assignment = repeat && plan.length
      ? { styleId: plan[plan.length - 1].styleId, difficulty: plan[plan.length - 1].difficulty }
      : baselineForIndex(cursor, styleIds);

    if (logged) {
      const total = logged.perfect + logged.good + logged.miss;
      previousMissRate = total > 0 ? logged.miss / total : null;
      plan.push({ day: i + 1, date, styleId: logged.styleId, difficulty: logged.difficulty, status: 'done', repeat, result: { perfect: logged.perfect, good: logged.good, miss: logged.miss } });
    } else {
      previousMissRate = null; // jour pas encore joué : aucune répétition ne peut être déduite au-delà
      plan.push({ day: i + 1, date, styleId: assignment.styleId, difficulty: assignment.difficulty, status: i === 0 ? 'today' : 'upcoming', repeat });
    }
    if (!repeat) cursor += 1;
  }
  return plan;
}
