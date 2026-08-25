export const LAYERS = { 1: "Data", 2: "Information", 3: "Principle", 4: "Concept", 5: "Skill", 6: "Domain", 7: "Field", 8: "Cogito" } as const;
export type RelationType = "is-a" | "part-of" | "causes" | "supports" | "contradicts" | "precedes";
export type EdgeState = "proposed" | "confirmed";
export type GraphScope = "session" | "personal";
export interface KNode { id: string; label: string; body: string; layer: keyof typeof LAYERS; scope: GraphScope; sourceUrl?: string; sourceTitle?: string; createdAt: Date; participantId: string }
export interface KEdge { id: string; fromId: string; toId: string; type: RelationType; state: EdgeState; confidence: number; proposedBy: "llm" | "user"; confirmedAt?: Date; participantId: string }
export type ExplicitConfirmation = { kind: "explicit_confirmation"; confirmedAt: Date };
