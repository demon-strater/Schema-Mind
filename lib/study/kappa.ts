export function cohensKappa(a: readonly boolean[], b: readonly boolean[]): number | null {
  if (a.length !== b.length) throw new Error("Rater arrays must have equal length");
  if (a.length === 0) return null;
  const observed = a.filter((value, index) => value === b[index]).length / a.length;
  const aTrue = a.filter(Boolean).length / a.length;
  const bTrue = b.filter(Boolean).length / b.length;
  const expected = aTrue * bTrue + (1 - aTrue) * (1 - bTrue);
  return expected === 1 ? observed === 1 ? 1 : null : (observed - expected) / (1 - expected);
}
