# SchemaMind - Digital Brain

## Overview
SchemaMind is an 8-level hierarchical digital brain application for organizing and connecting knowledge. Users can create knowledge nodes across 8 levels (Cogito → Domain → Field → Topic → Concept → Note → Reference → Data) and establish connections between nodes across different domains.

## Architecture
- **Frontend:** React + TypeScript with Tailwind CSS, Framer Motion for animations, wouter for routing
- **Backend:** Express.js with RESTful API
- **Database:** PostgreSQL with Drizzle ORM
- **State Management:** TanStack Query for server state

## Key Files
- `shared/schema.ts` - Data models (knowledgeNodes, connections) and level constants
- `server/routes.ts` - API endpoints for CRUD operations on nodes and connections
- `server/storage.ts` - Database storage layer with Drizzle ORM
- `server/seed.ts` - Seed data with sample knowledge hierarchy
- `client/src/pages/home.tsx` - Main application page with navigation state
- `client/src/components/` - Reusable UI components (brain-header, node-grid, node-detail, etc.)

## API Endpoints
- `GET /api/nodes?parentId=` - Get child nodes of a parent
- `GET /api/nodes/all` - Get all nodes
- `POST /api/nodes` - Create a node
- `DELETE /api/nodes/:id` - Delete a node and its children
- `GET /api/connections` - Get all connections
- `POST /api/connections` - Create a connection
- `DELETE /api/connections/:id` - Delete a connection
- `GET /api/stats` - Get stats (total nodes, level counts, connection count)

## 8 Knowledge Levels
0. Cogito (root level)
1. Domain (Philosophy, Engineering, etc.)
2. Field
3. Topic
4. Concept
5. Note
6. Reference
7. Data (raw data)

## Design
- Space Grotesk font for modern tech feel
- Purple-based color scheme (262 hue)
- Framer Motion animations for smooth transitions
- Card-based node grid with growth density indicators
- Breadcrumb navigation with level progress bar
