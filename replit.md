# SchemaMind - Digital Brain

## Overview
SchemaMind is a hierarchical digital brain application for organizing and connecting knowledge. It uses 9 fixed top-level categories (based on Korean Decimal Classification) and AI-powered text analysis that auto-categorizes pasted text into the DIKW hierarchy.

## Architecture
- **Frontend:** React + TypeScript with Tailwind CSS, Framer Motion for animations, wouter for routing
- **Backend:** Express.js with RESTful API
- **Database:** PostgreSQL with Drizzle ORM
- **State Management:** TanStack Query for server state
- **AI:** OpenAI integration via Replit AI Integrations (gpt-4o for text analysis)

## 9 Fixed Top-Level Categories (Level 1)
철학, 종교, 사회과학, 자연과학, 기술과학, 예술, 언어, 문학, 역사

## DIKW Knowledge Hierarchy
- Level 0: Cogito (나) — center of mind map
- Level 1: Category (9 fixed categories above)
- Level 2: Article (글/보고서) — AI-generated article node with original text stored in content field
- Level 3: Wisdom (지혜) — core principles, deep insights
- Level 4: Knowledge (지식) — organized understanding, theories
- Level 5: Information (정보) — contextual facts, definitions
- Level 6: Data (데이터) — raw facts, numbers, quotes
- Level 7: Raw (원문)

## Key Files
- `shared/schema.ts` - Data models (knowledgeNodes, connections), level constants (LEVEL_NAMES, LEVEL_LABELS_KO)
- `server/routes.ts` - API endpoints for CRUD and AI analysis
- `server/storage.ts` - Database storage layer with Drizzle ORM (includes updateNode method)
- `server/ai.ts` - OpenAI text analysis: auto-classifies into 9 categories + DIKW hierarchy
- `server/seed.ts` - Seeds 9 top-level categories (TOP_CATEGORIES exported)
- `client/src/pages/home.tsx` - Main page with mind map, dialogs, navigation
- `client/src/components/`
  - `mind-map.tsx` - Radial SVG mind map with report cards on article nodes
  - `brain-header.tsx` - Header with stats, view toggle, AI analyze button
  - `analyze-dialog.tsx` - AI text analysis dialog (no manual category selection)
  - `full-text-dialog.tsx` - Full text viewer for article nodes
  - `add-node-dialog.tsx` - Manual node creation
  - `node-detail.tsx` - Node detail panel with "전문 보기" button for articles
  - `node-grid.tsx`, `connection-panel.tsx`, `breadcrumb-nav.tsx`, `growth-stats.tsx`

## API Endpoints
- `GET /api/nodes?parentId=` - Get child nodes
- `GET /api/nodes/all` - Get all nodes
- `POST /api/nodes` - Create a node
- `DELETE /api/nodes/:id` - Delete node and children
- `GET /api/connections` - Get all connections
- `POST /api/connections` - Create a connection
- `DELETE /api/connections/:id` - Delete a connection
- `GET /api/stats` - Stats (total nodes, level counts, connection count)
- `POST /api/analyze` - AI text analysis (body: {text}) → auto-classifies and creates nodes

## Design
- Space Grotesk font, purple-based color scheme (262 hue)
- SVG-based radial mind map (default) with grid view toggle
- Report cards on article nodes with "전문 보기" button
- Korean tier labels (대주제, 지혜, 지식, 정보, 데이터)
- Framer Motion animations
