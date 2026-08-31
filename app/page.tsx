import Link from "next/link";

const flow = [
  { name: "수집", href: "/cluster", desc: "질문 주변의 지지·상충·조건을 한 단계씩 직접 열어본다" },
  { name: "검토", href: "/canvas", desc: "주장·근거·전제를 직접 채우거나 승인한다" },
  { name: "통합", href: "/schema", desc: "새 지식을 내 구조 어디에 둘지 스스로 확정한다" },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-14 px-6 py-16">
      <div className="space-y-4">
        <p className="eyebrow">연구 도구 · N=180</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Schema Mind</h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
          생성형 AI 환경에서 사용자가 관계를 직접 판단하고 확정하도록 지원하는 지식 구조화 실험 도구입니다.
        </p>
        <p className="rule">시스템은 관계를 제안하고, 사용자는 관계를 확정한다.</p>
        <div className="pt-2">
          <Link href="/study/demo-001" className="button">세션 시작하기</Link>
        </div>
      </div>

      <section aria-labelledby="flow-heading" className="space-y-4">
        <div>
          <h2 id="flow-heading" className="text-lg font-semibold">세션 안에서 벌어지는 일</h2>
          <p className="max-w-2xl text-sm text-[var(--text-muted)]">
            아래 세 화면을 직접 고르지 않습니다 — 배정된 조건에 따라 과제 진행 중 필요한 순간에 자동으로 이어집니다.
          </p>
        </div>
        <div className="flow">
          {flow.map((step, index) => (
            <div className="flow-step" key={step.name}>
              <div className="flow-step__head">
                <span className="flow-step__index">{index + 1}</span>
                <h3>{step.name}</h3>
              </div>
              <p>{step.desc}</p>
              <Link href={step.href} className="flow-step__preview">화면 미리보기</Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
