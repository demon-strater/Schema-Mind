import { describe, expect, it } from "vitest";
import { deterministicCondition, featuresFor } from "../lib/condition";
describe("condition isolation", () => {
  it("is deterministic", () => expect(deterministicCondition("P-001")).toBe(deterministicCondition("P-001")));
  it("never exposes graph features to A", () => expect(featuresFor("A")).toMatchObject({ cluster: false, schema: false }));
  it("never exposes graph features to A-timed", () => expect(featuresFor("A-timed")).toMatchObject({ cluster: false, schema: false }));
});
