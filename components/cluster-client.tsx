"use client";
import { useRef, useState } from "react";

type Node = { id: string; label: string; body: string };
type Edge = { toId: string; type: string; confidence: number; state: "proposed" };
type Result = { core: Node; neighbors: Node[]; edges: Edge[]; contradictionStatus: string };

export function ClusterClient({ participantId = "demo" }: { participantId?: string }) {
  const [query, setQuery] = useState("도시 기후 적응에서 쿨루프와 도시 녹화를 어떻게 비교해야 하나요?");
  const [result, setResult] = useState<Result | null>(null);
  const [scope, setScope] = useState<string[]>([]);
  const [trail, setTrail] = useState<Node[]>([]);
  const [viewed, setViewed] = useState(new Set<string>());
  const [contradicts, setContradicts] = useState(0);
  const [loading, setLoading] = useState(false);
  const started = useRef(0);

  const log = (type: string, payload: Record<string, unknown>) =>
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: crypto.randomUUID(), participantId, condition: "F", sessionDay: 1, type, payload, clientTs: performance.now() }),
    }).catch(() => undefined);

  async function submit(text = query, resetTrail = true) {
    started.current = performance.now();
    setLoading(true);
    const [expanded, scoped] = await Promise.all([
      fetch("/api/expand", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: text, participantId }) }).then((r) => r.json() as Promise<Result>),
      fetch("/api/scope", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic: text }) }).then((r) => r.json() as Promise<{ lines: string[] }>),
    ]);
    setResult(expanded);
    setScope(scoped.lines);
    if (resetTrail) setTrail([expanded.core]);
    setLoading(false);
    void log("query_submit", { query: text });
  }

  function open(node: Node) {
    const edge = result?.edges.find((item) => item.toId === node.id);
    const first = viewed.size === 0;
    setViewed((old) => new Set(old).add(node.id));
    if (edge?.type === "contradicts") {
      setContradicts((n) => n + 1);
      void log("contradict_view", { nodeId: node.id });
    }
    void log("neighbor_view", { nodeId: node.id, depth: trail.length });
    if (first) void log("first_click_latency", { durationMs: performance.now() - started.current });
    if (trail.length < 5) {
      setTrail((old) => [...old, node]);
      setQuery(node.label);
      void log("neighbor_expand", { nodeId: node.id, depth: trail.length + 1 });
      void submit(node.label, false);
    }
  }

  return (
    <div className="workspace">
      <section className="querybar">
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="질의" />
          <button type="submit" data-loading={loading}>관계와 함께 탐색</button>
        </form>
        {scope.length > 0 && (
          <details open onToggle={() => void log("scope_card_open", {})}>
            <summary>이 주제에서 탐색할 수 있는 범위</summary>
            <ul>{scope.map((line) => <li key={line}>{line}</li>)}</ul>
          </details>
        )}
      </section>

      {result ? (
        <>
          <div className="breadcrumbs" aria-label="탐색 경로">
            {trail.map((node, index) => (
              <button key={`${node.id}-${index}`} onClick={() => { setTrail((old) => old.slice(0, index + 1)); void log("breadcrumb_back", { depth: index + 1 }); }}>
                {node.label}
              </button>
            ))}
          </div>

          <section className="cluster" aria-label="부분 가시 관계망">
            <article className="core-node">
              <small>핵심 응답</small>
              <h2>{result.core.label}</h2>
              <p>{result.core.body}</p>
            </article>
            {result.neighbors.map((node, index) => {
              const edge = result.edges.find((item) => item.toId === node.id);
              const conflict = edge?.type === "contradicts";
              const confidencePct = Math.round((edge?.confidence ?? 0) * 100);
              return (
                <button
                  className={`neighbor ${conflict ? "contradict" : ""}`}
                  key={node.id}
                  onClick={() => open(node)}
                  style={{ "--angle": `${index * (360 / result.neighbors.length)}deg` } as React.CSSProperties}
                >
                  <span className={`badge ${conflict ? "badge--contradict" : "badge--proposed"}`}>{conflict ? "상충" : `${edge?.type} · 제안됨`}</span>
                  <strong>{node.label}</strong>
                  <span className="blurred">{node.body}</span>
                  <div className="meter" aria-hidden="true"><span style={{ width: `${confidencePct}%` }} /></div>
                  <small>확신도 {confidencePct}%</small>
                </button>
              );
            })}
          </section>

          <aside className="counter">
            확장 깊이 {Math.min(trail.length, 5)} / 5<br />
            열람한 이웃 {viewed.size}<br />
            상충 노드 열람 {contradicts}
          </aside>
        </>
      ) : (
        <div className="empty">
          <h2>질문을 입력해 관계의 맥락부터 확인하세요.</h2>
          <button onClick={() => void submit()} data-loading={loading}>예시 질문 시작</button>
        </div>
      )}
    </div>
  );
}
