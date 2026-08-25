export const CONDITIONS = ["C", "A", "A-timed", "F"] as const;
export type StudyCondition = (typeof CONDITIONS)[number];
export type ConditionFeatures = { searchResults: boolean; aiSummary: boolean; timedReading: boolean; cluster: boolean; schema: boolean };
const FEATURES: Record<StudyCondition, ConditionFeatures> = {
  C: { searchResults: true, aiSummary: false, timedReading: false, cluster: false, schema: false },
  A: { searchResults: false, aiSummary: true, timedReading: false, cluster: false, schema: false },
  "A-timed": { searchResults: false, aiSummary: true, timedReading: true, cluster: false, schema: false },
  F: { searchResults: false, aiSummary: true, timedReading: false, cluster: true, schema: true },
};
export function featuresFor(condition: StudyCondition): ConditionFeatures { return FEATURES[condition]; }
export function deterministicCondition(participantId: string): StudyCondition {
  let hash = 2166136261;
  for (const char of participantId.normalize("NFKC")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return CONDITIONS[(hash >>> 0) % CONDITIONS.length];
}
