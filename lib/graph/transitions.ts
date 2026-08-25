import type { ExplicitConfirmation, KEdge, KNode, RelationType } from "./types";

export function createLlmEdge(input: Omit<KEdge, "state" | "proposedBy" | "confirmedAt">): KEdge {
  return { ...input, state: "proposed", proposedBy: "llm" };
}

export function createUserEdge(input: Omit<KEdge, "state" | "proposedBy" | "confirmedAt" | "confidence"> & { type: RelationType }, now = new Date()): KEdge {
  return { ...input, state: "confirmed", proposedBy: "user", confidence: 1, confirmedAt: now };
}

export function confirmEdge(edge: KEdge, action: ExplicitConfirmation): KEdge {
  if (edge.state !== "proposed") throw new Error("Only proposed edges can be confirmed");
  return { ...edge, state: "confirmed", confirmedAt: action.confirmedAt };
}

export function promoteNode(node: KNode, action: ExplicitConfirmation): KNode {
  void action;
  return { ...node, scope: "personal" };
}

export function traversableEdges(edges: readonly KEdge[]): KEdge[] {
  return edges.filter((edge) => edge.state === "confirmed");
}

export function neighbors(nodeId: string, edges: readonly KEdge[]): string[] {
  return traversableEdges(edges).flatMap((edge) => edge.fromId === nodeId ? [edge.toId] : edge.toId === nodeId ? [edge.fromId] : []);
}
