"use client";
import { useEffect, useRef, useState } from "react";
import type { StudyCondition } from "@/lib/condition";

type Study = { participantId: string; condition: StudyCondition; sessionDay: 1 | 8; sessionId: string };

export function StudyClient({ participantId }: { participantId: string }) {
  const [study, setStudy] = useState<Study | null>(null);
  const [started, setStarted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(0);
  const lastOperation = useRef(0);

  useEffect(() => {
    void fetch(`/api/study/${encodeURIComponent(participantId)}`).then((r) => r.json()).then(setStudy);
  }, [participantId]);

  useEffect(() => {
    if (!study || !started || done) return;
    const mark = () => { lastOperation.current = performance.now(); };
    window.addEventListener("pointerdown", mark);
    window.addEventListener("keydown", mark);
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const type = performance.now() - lastOperation.current < 1200 ? "operation_time_tick" : "read_time_tick";
      void fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: crypto.randomUUID(), participantId, condition: study.condition, sessionDay: study.sessionDay, type, payload: { durationMs: 1000 }, clientTs: performance.now() }),
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, [study, started, done, participantId]);

  async function log(type: string, payload: Record<string, unknown> = {}) {
    if (!study) return;
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: crypto.randomUUID(), participantId, condition: study.condition, sessionDay: study.sessionDay, type, payload, clientTs: performance.now() }),
    });
  }

  if (!study) {
    return <div className="empty">실험 세션을 준비하고 있습니다.</div>;
  }

  if (done) {
    return (
      <section className="study-card">
        <p className="success">응답이 저장되었습니다.</p>
        <h1>{study.sessionDay}일차 과제를 마쳤습니다.</h1>
      </section>
    );
  }

  const dayProgress = study.sessionDay === 8 ? 100 : 50;

  if (!started) {
    return (
      <section className="study-card">
        <div className="progress" aria-label="세션 진행 단계">
          <span>1일차</span>
          <div className="meter"><span style={{ width: `${dayProgress}%` }} /></div>
          <span>8일차</span>
        </div>
        <p>참가자 {participantId}</p>
        <h1>{study.sessionDay}일차 · 조건 {study.condition}</h1>
        <p>자료를 읽고 근거를 비교한 뒤 자신의 판단을 작성해 주세요. 모든 행동은 익명 코드로 기록됩니다.</p>
        <button
          onClick={() => { setStarted(true); startedAt.current = performance.now(); void log("task_start"); }}
        >
          과제 시작
        </button>
      </section>
    );
  }

  if (study.sessionDay === 8) {
    return (
      <section className="study-card">
        <div className="condition-badge">8일차 검사 · 자료 재접근 차단</div>
        <h2>지연 파지·전이 검사</h2>
        <p>1일차 자료를 다시 보지 않고 기억과 새로운 상황에 대한 판단을 작성하세요.</p>
        <label>
          새로운 도시 기후 사례에 적용한다면?
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </label>
        <label>
          AI 없이 해결할 때 선택할 전략
          <select>
            <option>근거를 먼저 회상한다</option>
            <option>외부 도구에 바로 위임한다</option>
          </select>
        </label>
        <div className="progress" aria-live="polite">
          <span>{answer.trim().length < 20 ? `${20 - answer.trim().length}자 더 입력하면 제출할 수 있어요` : "제출 가능"}</span>
        </div>
        <button
          disabled={answer.trim().length < 20}
          data-loading={submitting}
          onClick={() => {
            setSubmitting(true);
            void log("task_end", { durationMs: performance.now() - startedAt.current, response: answer, instrument: "delayed_transfer_offloading" }).then(() => setDone(true));
          }}
        >
          8일차 검사 제출
        </button>
      </section>
    );
  }

  return (
    <section className="study-card">
      <div className="condition-badge">조건 {study.condition}</div>
      {study.condition === "C" ? (
        <article>
          <h2>검색 결과</h2>
          {["쿨루프의 열 환경 효과", "도시 녹화와 형평성", "계절별 에너지 상쇄"].map((title) => (
            <div className="search-result" key={title}>
              <a href="#source">{title}</a>
              <p>검수된 연구 자료의 주요 내용과 출처 정보입니다.</p>
            </div>
          ))}
        </article>
      ) : (
        <article className="ai-answer">
          <h2>AI 요약</h2>
          <p>쿨루프와 도시 녹화는 서로 대체되는 단일 해법이 아닙니다. 기후대, 계절, 유지관리, 취약계층의 열 노출을 기준으로 조합해야 합니다.</p>
          {study.condition === "A-timed" && <p className="timer">권장 열람 시간: 8분</p>}
          {study.condition === "F" && (
            <p>
              <a href="/cluster">관계망을 탐색</a>한 뒤 <a href="/schema">개인 지식 구조에 연결</a>하세요.
            </p>
          )}
        </article>
      )}
      <label>
        당신의 결론과 근거
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </label>
      <div className="progress" aria-live="polite">
        <span>{answer.trim().length < 20 ? `${20 - answer.trim().length}자 더 입력하면 제출할 수 있어요` : "제출 가능"}</span>
      </div>
      <button
        disabled={answer.trim().length < 20}
        data-loading={submitting}
        onClick={() => {
          setSubmitting(true);
          void log("task_end", { durationMs: performance.now() - startedAt.current, response: answer }).then(() => setDone(true));
        }}
      >
        과제 제출
      </button>
    </section>
  );
}
