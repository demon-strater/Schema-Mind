import Link from "next/link";
const systems = [{name:"KnowledgeCluster",href:"/cluster",phase:"정보 수집"},{name:"LogicCanvas",href:"/canvas",phase:"검토"},{name:"SchemaMind",href:"/schema",phase:"통합"},{name:"Study Harness",href:"/study/demo-001",phase:"실험 운영"}] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <div className="space-y-4">
        <p className="eyebrow">Research study platform · N=180</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Schema Mind</h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
          생성형 AI 환경에서 사용자가 관계를 직접 판단하고 확정하도록 지원하는 지식 구조화 실험 도구입니다.
        </p>
      </div>
      <section aria-label="구현 대상" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {systems.map((system, index) => (
          <Link className="surface" key={system.name} href={system.href}>
            <span className="text-xs text-[var(--text-muted)]">0{index + 1}</span>
            <small>{system.phase}</small><h2 className="mt-8 font-medium">{system.name}</h2><span>열기 →</span>
          </Link>
        ))}
      </section>
      <p className="rule">시스템은 관계를 제안하고, 사용자는 관계를 확정한다.</p>
    </main>
  );
}
