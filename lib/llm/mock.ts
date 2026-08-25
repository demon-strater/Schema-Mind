import type { z } from "zod";
import type { anchorInputSchema, anchorOutputSchema, argumentInputSchema, argumentOutputSchema, expandInputSchema, expandOutputSchema, scopeOutputSchema } from "./schemas";
export function mockExpand(input: z.infer<typeof expandInputSchema>): z.infer<typeof expandOutputSchema> {
  const participantId = input.participantId; const coreId = `core-${encodeURIComponent(input.query).slice(0, 20)}`;
  const facts = [
    ["열섬 완화", "고반사 표면은 낮 동안 표면 온도를 낮출 수 있습니다.", "supports"],
    ["겨울철 상쇄", "난방 수요 증가 가능성은 기후대별로 검토해야 합니다.", "contradicts"],
    ["도시 녹화", "그늘과 증산은 보행자 체감온도에 영향을 줍니다.", "supports"],
    ["물 관리", "식생 기반 해법은 관수와 유지관리 조건에 의존합니다.", "part-of"],
    ["형평성", "개입 위치는 취약계층의 실제 노출과 함께 결정해야 합니다.", "precedes"],
    ["생애주기", "초기 비용만으로 장기 효과를 비교하기 어렵습니다.", "causes"],
  ] as const;
  const neighbors = facts.map(([label, body], index) => ({ id: `${coreId}-${index}`, label, body, layer: 3 as const, scope: "session" as const, sourceTitle: "검수 시드 코퍼스", participantId }));
  return { core: { id: coreId, label: input.query, body: "도시 기후 적응 전략은 온도 저감 효과뿐 아니라 계절성, 유지관리, 형평성을 함께 비교해야 합니다.", layer: 4, scope: "session", sourceTitle: "검수 시드 코퍼스", participantId }, neighbors, edges: neighbors.map((node, index) => ({ id: `edge-${coreId}-${index}`, fromId: coreId, toId: node.id, type: facts[index][2], state: "proposed", confidence: index === 1 ? 0.86 : 0.72 + index * 0.03, proposedBy: "llm", participantId })), contradictionStatus: "found" };
}
export function mockArgument(input: z.infer<typeof argumentInputSchema>): z.infer<typeof argumentOutputSchema> {
  const sentenceEnd = Math.min(input.text.length, Math.max(20, input.text.indexOf(".") + 1));
  return { slots: [
    { id: "claim", role: "claim", text: input.text.slice(0, sentenceEnd), status: "identified", confidence: 0.88, sourceSpan: [0, sentenceEnd] },
    { id: "data", role: "data", text: "표면 온도 저감 관찰", status: "identified", confidence: 0.7 },
    { id: "warrant", role: "warrant", text: null, status: "empty", confidence: 0.61 },
    { id: "qualifier", role: "qualifier", text: "기후대와 계절에 따라", status: "identified", confidence: 0.54 },
    { id: "rebuttal", role: "rebuttal", text: null, status: "empty", confidence: 0.76 },
  ] };
}
export function mockAnchor(input: z.infer<typeof anchorInputSchema>): z.infer<typeof anchorOutputSchema> { return { candidates: input.personalGraphSummary.slice(0, 3).map((node, index) => ({ nodeId: node.id, label: node.label, relationType: index ? "part-of" : "supports", confidence: 0.82 - index * 0.11, rationale: "확정된 개인 지식과 의미적으로 인접합니다." })) }; }
export function mockScope(topic: string): z.infer<typeof scopeOutputSchema> { return { lines: [`${topic}의 주요 개념과 적용 범위`, "지지 근거와 상충 관점의 비교", "적용 조건과 한계", "출처가 실제 주장을 뒷받침하는지 검토"] }; }
