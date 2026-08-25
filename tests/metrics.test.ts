import { describe, expect, it } from "vitest";
import { cohensKappa } from "../lib/study/kappa";
describe("Cohen kappa", () => {
  it("returns one for perfect agreement", () => expect(cohensKappa([true, false], [true, false])).toBe(1));
  it("rejects mismatched inputs", () => expect(() => cohensKappa([true], [])).toThrow());
});
