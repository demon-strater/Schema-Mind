# 핵심 규칙

**시스템은 관계를 제안하고, 사용자는 관계를 확정한다. 사용자가 명시적으로 확정하기 전까지 어떤 관계도 개인 그래프에 저장하지 않는다.**

LLM 관계는 항상 `proposed`로 생성한다. `proposed` 관계는 세션 데이터로 보존할 수 있지만 개인 그래프의 저장·순회·추론에는 포함하지 않는다. 자동 확정, 자동 연결, 일괄 수락을 구현하지 않는다. 판단 유보는 항상 허용하고 이벤트로 기록한다.

## 디렉터리 책임

- `app/`: App Router 페이지, 레이아웃, Route Handler, 서버 액션
- `components/`: 조건과 무관한 UI 및 조건 전용 프레젠테이션 컴포넌트
- `lib/condition.ts`: 모든 실험 조건 결정과 기능 노출 정책의 유일한 진입점
- `lib/graph/`: 지식 그래프 타입, 불변식, 상태 전이, 순수 순회 함수
- `lib/llm/`: 제공자 어댑터, 프롬프트, 구조화 출력 검증, 캐시와 예산 제한
- `lib/study/`: 참가자 배정, 세션, 이벤트, 측정 지표
- `prisma/`: 스키마, 마이그레이션, 시드
- `tests/`: Vitest 단위·통합 테스트와 Playwright E2E

## 검증 명령

- `pnpm verify`: 타입 검사, ESLint, Vitest 전체 실행
- `pnpm typecheck`: TypeScript strict 검사
- `pnpm lint`: 경고를 허용하지 않는 ESLint 검사
- `pnpm test`: Vitest 실행
- `pnpm test:e2e`: Playwright 실행
- `pnpm seed`: 연구용 시드 적재

Next.js 16에서는 `next lint`가 제거되었으므로 `pnpm lint`는 동등한 공식 ESLint CLI를 직접 실행한다.

## 상태 전이 불변식

- LLM 생성 엣지는 반드시 `state: 'proposed'`, `proposedBy: 'llm'`이다.
- `proposed` 엣지는 점선과 낮은 채도로 표시하고 기본 그래프 순회에서 제외한다.
- `confirmed` 승격은 사용자의 명시적 단일 확정 액션으로만 수행한다.
- 사용자가 직접 만든 엣지는 `state: 'confirmed'`, `proposedBy: 'user'`이다.
- 노드는 사용자가 확정하는 순간에만 `scope: 'session'`에서 `scope: 'personal'`로 승격한다.
- 위 규칙을 우회하면 구성 활동이라는 독립변인이 사라져 연구 결과를 해석할 수 없다.

## 실험 무결성

- 조건 분기와 기능 노출 판정은 오직 `lib/condition.ts`에서 한다. 페이지에서 조건을 재판정하지 않는다.
- 조건 A와 A-timed에는 관계망, 정박점, 확정 연결 UI를 렌더링하거나 전송하지 않는다.
- `EventType`의 이름을 임의로 추가·삭제·변경하지 않는다. 분석 스크립트가 정확한 문자열에 의존한다.
- 로깅되지 않는 연구 상호작용을 추가하지 않는다.
- 이벤트는 append-only이며 수정·삭제 API를 만들지 않는다.
- 8일차 세션에는 1일차 학습 자료를 반환하지 않는다.
- API 키와 관리자 비밀은 서버에서만 읽으며 `NEXT_PUBLIC_` 환경변수로 만들지 않는다.

<!-- NEXT-DEV-AGENTS:START -->
<!-- `next dev`가 생성하는 버전별 문서 블록이 이 위치에 추가되면 삭제하거나 수정하지 않는다. -->
<!-- NEXT-DEV-AGENTS:END -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
