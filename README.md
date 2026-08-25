# Schema Mind

생성형 AI 환경에서 지식 구조화를 지원하는 인지과학 기반 연구용 웹 애플리케이션입니다. 시스템은 관계를 제안하고 사용자가 관계를 확정합니다.

## 실행

```bash
pnpm install
pnpm db:migrate
pnpm seed
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 기본값은 API 키 없이 동작하는 검수된 mock 코퍼스입니다.

## 주요 경로

- `/cluster`: KnowledgeCluster
- `/canvas`: LogicCanvas
- `/schema`: SchemaMind
- `/study/study-c`, `/study/study-a`, `/study/study-at`, `/study/study-f`: 조건별 시드 참가자
- `/admin/score`: 인용 이원 평정과 Cohen’s κ
- `/admin/export`: CSV/JSON 내보내기

## 검증

```bash
pnpm verify
pnpm test:e2e
pnpm build
```

개발 DB는 SQLite를 사용합니다. 운영 배포에서는 동일한 논리 모델의 PostgreSQL 데이터 소스를 사용하며 운영 비밀과 관리자 접근 통제를 배포 환경에서 설정해야 합니다.
