# SchemaMind - Digital Brain

## Overview
SchemaMind is an 8-level hierarchical digital brain application for organizing and connecting knowledge. Users can create knowledge nodes across 8 levels (Cogito → Subject → Wisdom → Knowledge → Information → Data → Reference → Raw) and establish connections between nodes across different domains. Includes AI-powered text analysis that auto-categorizes pasted text into the DIKW hierarchy.

## Architecture
- **Frontend:** React + TypeScript with Tailwind CSS, Framer Motion for animations, wouter for routing
- **Backend:** Express.js with RESTful API
- **Database:** PostgreSQL with Drizzle ORM
- **State Management:** TanStack Query for server state
- **AI:** OpenAI integration via Replit AI Integrations (gpt-4o for text analysis)

## Key Files
- `shared/schema.ts` - Data models (knowledgeNodes, connections) and level constants (LEVEL_NAMES, LEVEL_LABELS_KO)
- `server/routes.ts` - API endpoints for CRUD operations on nodes, connections, and AI analysis
- `server/storage.ts` - Database storage layer with Drizzle ORM
- `server/ai.ts` - OpenAI-powered text analysis (DIKW hierarchy classification)
- `server/seed.ts` - Seed data with sample knowledge hierarchy
- `client/src/pages/home.tsx` - Main application page with navigation state
- `client/src/components/` - Reusable UI components
  - `mind-map.tsx` - Radial SVG mind map visualization
  - `brain-header.tsx` - App header with stats and AI analyze button
  - `analyze-dialog.tsx` - AI text analysis dialog (paste text → auto-categorize)
  - `add-node-dialog.tsx` - Manual node creation dialog
  - `node-grid.tsx`, `node-detail.tsx` - Grid view components
  - `connection-panel.tsx`, `breadcrumb-nav.tsx`, `growth-stats.tsx`

## API Endpoints
- `GET /api/nodes?parentId=` - Get child nodes of a parent
- `GET /api/nodes/all` - Get all nodes
- `POST /api/nodes` - Create a node
- `DELETE /api/nodes/:id` - Delete a node and its children
- `GET /api/connections` - Get all connections
- `POST /api/connections` - Create a connection
- `DELETE /api/connections/:id` - Delete a connection
- `GET /api/stats` - Get stats (total nodes, level counts, connection count)
- `POST /api/analyze` - AI text analysis (body: {text, subjectId?}) → auto-creates nodes

## 8 Knowledge Levels (DIKW Hierarchy)
0. Cogito (나) - root level center
1. Subject (대주제) - main domains
2. Wisdom (지혜) - core principles, deep insights
3. Knowledge (지식) - organized understanding, theories
4. Information (정보) - contextual facts, definitions
5. Data (데이터) - raw facts, numbers, quotes
6. Reference (참조)
7. Raw (원문)

## Design
- Space Grotesk font for modern tech feel
- Purple-based color scheme (262 hue)
- Framer Motion animations for smooth transitions
- SVG-based radial mind map (default view) with grid view toggle
- Breadcrumb navigation with level progress bar
- AI analyze button in header opens analysis dialog
