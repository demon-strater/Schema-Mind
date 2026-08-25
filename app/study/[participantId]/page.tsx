import { StudyClient } from "@/components/study-client";
export default async function StudyPage({ params }: PageProps<"/study/[participantId]">) { const { participantId } = await params; return <main className="page"><header className="page-title"><p>실험 하네스</p><h1>학습 과제</h1><span>조건 배정과 세션 진행은 서버에서 관리됩니다.</span></header><StudyClient participantId={participantId}/></main>; }
