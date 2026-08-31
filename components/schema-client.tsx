"use client";
import { useState } from "react";

const layers = [
  [8, "Cogito"],
  [7, "Field"],
  [6, "Domain"],
  [5, "Skill"],
  [4, "Concept"],
  [3, "Principle"],
  [2, "Information"],
  [1, "Data"],
] as const;

type Personal = { id: string; label: string; body: string; layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; scope: "personal"; participantId: string };

const initial: Personal[] = [
  { id: "cogito", label: "나는 근거를 비교하며 학습한다", body: "메타인지적 정박점", layer: 8, scope: "personal", participantId: "demo" },
  { id: "field", label: "도시설계", body: "관심 지식 분야", layer: 7, scope: "personal", participantId: "demo" },
  { id: "domain", label: "기후 적응", body: "현재 문제 영역", layer: 6, scope: "personal", participantId: "demo" },
];

const NEW_NODE_LAYER = 3;

export function SchemaClient() {
  const [personal, setPersonal] = useState(initial);
  const [label, setLabel] = useState("쿨루프의 계절별 효과");
  const [candidates, setCandidates] = useState<{ nodeId: string; label: string; relationType: string; confidence: number; rationale: string }[]>([]);
  const [unanchored, setUnanchored] = useState<string[]>([]);
  const [decision, setDecision] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const log = (type: string, payload: Record<string, unknown>) =>
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: crypto.randomUUID(), participantId: "demo", condition: "F", sessionDay: 1, type, payload, clientTs: performance.now() }),
    }).catch(() => undefined);

  async function suggest() {
    setSuggesting(true);
    const newNode = { id: crypto.randomUUID(), label, body: "새로 수집한 정보", layer: NEW_NODE_LAYER, scope: "session", participantId: "demo" };
    const data = await fetch("/api/anchor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ newNode, personalGraphSummary: personal }) }).then((r) => r.json() as Promise<{ candidates: typeof candidates }>);
    setCandidates(data.candidates);
    setDecision("");
    setSuggesting(false);
    void log("anchor_suggest_shown", { candidateCount: data.candidates.length });
  }

  function accept(candidate: (typeof candidates)[number]) {
    setPersonal((items) => [...items, { id: crypto.randomUUID(), label, body: `${candidate.label}에 ${candidate.relationType}로 연결`, layer: NEW_NODE_LAYER, scope: "personal", participantId: "demo" }]);
    setDecision(`“${candidate.label}”에 연결을 확정했습니다.`);
    setCandidates([]);
    void log(candidate.confidence === 1 ? "anchor_manual" : "anchor_accept", { nodeId: candidate.nodeId, relationType: candidate.relationType });
  }

  function defer() {
    setUnanchored((all) => [...all, label]);
    setDecision("판단을 유보했습니다. 24시간 후 다시 제안합니다.");
    setCandidates([]);
    void log("anchor_defer", { label, reproposeHours: 24 });
    void log("friction_bypass", { reason: "judgment_deferred" });
  }

  return (
    <div className="schema-layout">
      <section className="pyramid" aria-label="8계층 개인 지식 구조">
        {layers.map(([level, name]) => (
          <div key={level} style={{ width: `${42 + (8 - level) * 7}%` }}>
            <b>{level}</b>
            <span>{name}</span>
            <small>{personal.filter((n) => n.layer === level).length}개</small>
          </div>
        ))}
      </section>

      <section className="anchor-panel">
        <div className="unanchored">
          <strong>미고착 영역 <span>{unanchored.length}</span></strong>
          {unanchored.map((item) => <p key={item}>{item}</p>)}
        </div>

        <label>
          새 정보
          <input value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <button onClick={() => void suggest()} data-loading={suggesting}>정박점 후보 확인</button>

        {candidates.length > 0 && (
          <div className="candidates">
            <h2>어디에 연결하시겠습니까?</h2>
            {candidates.map((candidate) => (
              <button key={candidate.nodeId} onClick={() => accept(candidate)}>
                <strong>{candidate.label}</strong>
                <span>{candidate.relationType} · 확신도 {Math.round(candidate.confidence * 100)}%</span>
                <div className="meter" aria-hidden="true"><span style={{ width: `${Math.round(candidate.confidence * 100)}%` }} /></div>
                <small>{candidate.rationale}</small>
              </button>
            ))}
            <button
              onClick={() => {
                const custom = personal.at(-1);
                if (custom) accept({ nodeId: custom.id, label: custom.label, relationType: "part-of", confidence: 1, rationale: "사용자 직접 지정" });
              }}
            >
              다른 노드 직접 지정
            </button>
            <button className="defer" onClick={defer}>판단 유보</button>
          </div>
        )}

        {decision && <p className="notice">{decision}</p>}
      </section>
    </div>
  );
}
