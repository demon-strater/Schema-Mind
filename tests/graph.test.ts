import { describe, expect, it } from "vitest";
import { confirmEdge, createLlmEdge, createUserEdge, neighbors, promoteNode } from "../lib/graph/transitions";
import type { KNode } from "../lib/graph/types";

const proposed = createLlmEdge({ id: "e1", fromId: "a", toId: "b", type: "supports", confidence: 0.8, participantId: "p1" });
describe("graph invariants", () => {
  it("excludes proposed edges from traversal", () => expect(neighbors("a", [proposed])).toEqual([]));
  it("creates all LLM edges as proposed", () => expect(proposed).toMatchObject({ state: "proposed", proposedBy: "llm" }));
  it("requires an explicit action to confirm", () => expect(confirmEdge(proposed, { kind: "explicit_confirmation", confirmedAt: new Date(1) })).toMatchObject({ state: "confirmed", confirmedAt: new Date(1) }));
  it("creates user edges as confirmed", () => expect(createUserEdge({ id: "e2", fromId: "a", toId: "b", type: "supports", participantId: "p1" })).toMatchObject({ state: "confirmed", proposedBy: "user" }));
  it("promotes a node only through the explicit promotion function", () => {
    const node: KNode = { id: "a", label: "a", body: "b", layer: 1, scope: "session", createdAt: new Date(), participantId: "p1" };
    expect(promoteNode(node, { kind: "explicit_confirmation", confirmedAt: new Date() }).scope).toBe("personal");
  });
});
