import { ScoreClient } from "@/components/score-client";

export default function ScorePage() {
  return (
    <main className="page">
      <header className="page-title">
        <p>관리자</p>
        <h1>인용 정확도 채점</h1>
        <span>출처가 참가자의 주장을 실제로 뒷받침하는지 독립적으로 평정합니다.</span>
      </header>
      <ScoreClient />
    </main>
  );
}
