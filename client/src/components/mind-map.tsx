import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { type KnowledgeNode, type Connection, LEVEL_NAMES, LEVEL_COLORS, LEVEL_LABELS_KO } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize, Plus } from "lucide-react";

interface MindMapProps {
  allNodes: KnowledgeNode[];
  connections: Connection[];
  onNodeSelect: (node: KnowledgeNode) => void;
  onNodeZoom: (node: KnowledgeNode) => void;
  selectedNode: KnowledgeNode | null;
  focusNodeId: number | null;
  onAddNode: () => void;
  onViewFullText?: (node: KnowledgeNode) => void;
  fullscreen?: boolean;
}

interface PositionedNode {
  node: KnowledgeNode;
  x: number;
  y: number;
  radius: number;
}

const NODE_COLORS: Record<number, string> = {
  0: "#A78BFA",
  1: "#8B5CF6",
  2: "#7C3AED",
  3: "#6D28D9",
  4: "#5B21B6",
  5: "#6366F1",
  6: "#4F46E5",
  7: "#4338CA",
};

function buildTree(
  allNodes: KnowledgeNode[],
  focusNodeId: number | null
): Map<number | null, KnowledgeNode[]> {
  const childrenMap = new Map<number | null, KnowledgeNode[]>();
  allNodes.forEach((node) => {
    const parentId = node.parentId;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(node);
  });
  return childrenMap;
}

function layoutRadialTree(
  childrenMap: Map<number | null, KnowledgeNode[]>,
  focusNodeId: number | null,
  centerX: number,
  centerY: number
): PositionedNode[] {
  const positioned: PositionedNode[] = [];
  let rootId = focusNodeId;
  let rootChildren = childrenMap.get(rootId) || [];
  if (rootChildren.length === 0 && rootId !== null) {
    rootId = null;
    rootChildren = childrenMap.get(null) || [];
  }
  if (rootChildren.length === 0) return positioned;

  const MIN_ARC_SPACING = 100;
  const BASE_RADIUS = 240;
  const RADIUS_STEP = 220;
  const MIN_LEAF_WEIGHT = 3;

  const leafCache = new Map<number, number>();
  function countLeaves(nodeId: number): number {
    if (leafCache.has(nodeId)) return leafCache.get(nodeId)!;
    const ch = childrenMap.get(nodeId) || [];
    const count = ch.length === 0 ? 1 : ch.reduce((s, c) => s + countLeaves(c.id), 0);
    leafCache.set(nodeId, count);
    return count;
  }

  function effectiveWeight(nodeId: number): number {
    return Math.max(countLeaves(nodeId), MIN_LEAF_WEIGHT);
  }

  function nodeSize(depth: number): number {
    return Math.max(28 - depth * 4, 14);
  }

  function layoutChildren(
    parentId: number | null,
    angleStart: number,
    angleEnd: number,
    depth: number
  ) {
    const children = parentId === rootId
      ? rootChildren
      : childrenMap.get(parentId) || [];
    if (children.length === 0) return;

    const angleRange = angleEnd - angleStart;
    const baseR = BASE_RADIUS + RADIUS_STEP * (depth - 1);

    const weights = children.map(c => effectiveWeight(c.id));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const proportions = weights.map(w => totalWeight > 0 ? w / totalWeight : 1 / children.length);

    let r = baseR;
    if (children.length > 1) {
      for (let i = 0; i < children.length; i++) {
        const j = (i + 1) % children.length;
        const halfArcI = angleRange * proportions[i] / 2;
        const halfArcJ = angleRange * proportions[j] / 2;
        const gapAngle = halfArcI + halfArcJ;
        const neededR = MIN_ARC_SPACING / Math.max(gapAngle, 0.001);
        r = Math.max(r, neededR);
      }
    }

    let currentAngle = angleStart;
    children.forEach((child, i) => {
      const childAngle = angleRange * proportions[i];
      const angleMid = currentAngle + childAngle / 2;

      const x = centerX + r * Math.cos(angleMid);
      const y = centerY + r * Math.sin(angleMid);
      const nr = nodeSize(depth);

      positioned.push({ node: child, x, y, radius: nr });

      layoutChildren(child.id, currentAngle, currentAngle + childAngle, depth + 1);
      currentAngle += childAngle;
    });
  }

  layoutChildren(rootId, -Math.PI / 2, Math.PI * 1.5, 1);
  return positioned;
}

function truncateLabel(title: string, depth: number): string {
  const maxLen = depth <= 1 ? 8 : depth === 2 ? 10 : 8;
  if (title.length <= maxLen) return title;
  return title.slice(0, maxLen - 1) + "…";
}

function CurvedLink({
  x1, y1, x2, y2, color, opacity, isConnection
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; opacity: number; isConnection?: boolean;
}) {
  if (isConnection) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const perpX = -dy * 0.2;
    const perpY = dx * 0.2;
    return (
      <path
        d={`M ${x1} ${y1} Q ${midX + perpX} ${midY + perpY} ${x2} ${y2}`}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        fill="none"
        opacity={opacity * 0.5}
        className="transition-opacity duration-300"
      />
    );
  }

  const dx = x2 - x1;
  return (
    <path
      d={`M ${x1} ${y1} C ${x1 + dx * 0.4} ${y1} ${x1 + dx * 0.6} ${y2} ${x2} ${y2}`}
      stroke={color}
      strokeWidth={2}
      fill="none"
      opacity={opacity}
      className="transition-opacity duration-300"
    />
  );
}

export function MindMap({
  allNodes, connections, onNodeSelect, onNodeZoom,
  selectedNode, focusNodeId, onAddNode, onViewFullText, fullscreen
}: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: -600, y: -450, w: 1200, h: 900 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 900 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const childrenMap = useMemo(() => buildTree(allNodes, focusNodeId), [allNodes, focusNodeId]);
  const positionedNodes = useMemo(
    () => layoutRadialTree(childrenMap, focusNodeId, 0, 0),
    [childrenMap, focusNodeId]
  );

  const posMap = useMemo(() => {
    const m = new Map<number, PositionedNode>();
    positionedNodes.forEach((pn) => m.set(pn.node.id, pn));
    return m;
  }, [positionedNodes]);

  const parentEdges = useMemo(() => {
    return positionedNodes
      .filter((pn) => {
        const pid = pn.node.parentId;
        if (pid === null) return focusNodeId === null;
        if (focusNodeId !== null && pid === focusNodeId) return true;
        return posMap.has(pid);
      })
      .map((pn) => {
        const pid = pn.node.parentId;
        const parentPos = pid !== null && pid !== focusNodeId ? posMap.get(pid) : null;
        return {
          id: `edge-${pid ?? "root"}-${pn.node.id}`,
          x1: parentPos ? parentPos.x : 0,
          y1: parentPos ? parentPos.y : 0,
          x2: pn.x,
          y2: pn.y,
          color: pn.node.color || NODE_COLORS[pn.node.level] || "#8B5CF6",
          level: pn.node.level,
        };
      });
  }, [positionedNodes, posMap, focusNodeId]);

  const connectionEdges = useMemo(() => {
    return connections
      .map((conn) => {
        const source = posMap.get(conn.sourceId);
        const target = posMap.get(conn.targetId);
        if (!source || !target) return null;
        return {
          id: `conn-${conn.id}`,
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y,
          description: conn.description,
        };
      })
      .filter(Boolean) as {
        id: string; x1: number; y1: number; x2: number; y2: number; description: string | null;
      }[];
  }, [connections, posMap]);

  const handleZoom = useCallback((factor: number) => {
    setViewBox((v) => {
      const newW = v.w * factor;
      const newH = v.h * factor;
      return {
        x: v.x - (newW - v.w) / 2,
        y: v.y - (newH - v.h) / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

  const handleReset = useCallback(() => {
    if (positionedNodes.length === 0) {
      setViewBox({ x: -600, y: -450, w: 1200, h: 900 });
      return;
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    positionedNodes.forEach(({ x, y, radius }) => {
      minX = Math.min(minX, x - radius - 100);
      maxX = Math.max(maxX, x + radius + 100);
      minY = Math.min(minY, y - radius - 100);
      maxY = Math.max(maxY, y + radius + 100);
    });
    minX = Math.min(minX, -100);
    maxX = Math.max(maxX, 100);
    minY = Math.min(minY, -100);
    maxY = Math.max(maxY, 100);
    const padding = 120;
    setViewBox({
      x: minX - padding,
      y: minY - padding,
      w: maxX - minX + padding * 2,
      h: maxY - minY + padding * 2,
    });
  }, [positionedNodes]);

  useEffect(() => {
    handleReset();
  }, [focusNodeId, allNodes.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.08 : 0.92;
        handleZoom(factor);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [handleZoom]);

  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const canPan = useCallback((e: React.PointerEvent) => {
    return spaceHeld || e.ctrlKey || e.metaKey;
  }, [spaceHeld]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (canPan(e)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  }, [canPan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const dx = (e.clientX - panStart.x) * scaleX * 0.08;
    const dy = (e.clientY - panStart.y) * scaleY * 0.08;
    setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, viewBox]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const focusNode = focusNodeId !== null ? allNodes.find((n) => n.id === focusNodeId) : null;
  const centerLabel = focusNode ? focusNode.title : "Cogito";
  const centerSublabel = focusNode ? LEVEL_NAMES[focusNode.level] : "나";

  const maxRing = useMemo(() => {
    if (positionedNodes.length === 0) return 3;
    let maxDist = 0;
    positionedNodes.forEach(({ x, y }) => {
      const d = Math.sqrt(x * x + y * y);
      if (d > maxDist) maxDist = d;
    });
    return Math.ceil(maxDist / 220) + 1;
  }, [positionedNodes]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-background overflow-hidden ${fullscreen ? "" : "rounded-2xl border border-border"}`}
      style={fullscreen ? { width: "100%", height: "100%" } : { height: "calc(100vh - 200px)", minHeight: 500 }}
      data-testid="mind-map"
    >
      <div className={`absolute ${fullscreen ? "bottom-4 right-4" : "top-4 right-4"} z-10 flex ${fullscreen ? "flex-row" : "flex-col"} gap-1.5`}>
        <button
          onClick={() => handleZoom(0.8)}
          className="w-9 h-9 rounded-lg bg-card/90 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
          data-testid="button-zoom-in-map"
        >
          <ZoomIn className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={() => handleZoom(1.25)}
          className="w-9 h-9 rounded-lg bg-card/90 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
          data-testid="button-zoom-out-map"
        >
          <ZoomOut className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={handleReset}
          className="w-9 h-9 rounded-lg bg-card/90 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
          data-testid="button-fit-map"
        >
          <Maximize className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className={`absolute ${fullscreen ? "bottom-4 left-1/2 -translate-x-1/2" : "bottom-4 left-4"} z-10 flex items-center gap-2 flex-wrap`}>
        {LEVEL_NAMES.map((name, i) => {
          const color = NODE_COLORS[i];
          return (
            <div key={name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span>{name}</span>
            </div>
          );
        })}
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className={`select-none ${isPanning ? "cursor-grabbing" : spaceHeld ? "cursor-grab" : "cursor-default"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.15" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="0" cy="0" r="300" fill="url(#center-glow)" />

        {Array.from({ length: maxRing }, (_, i) => i + 1).map((ring) => (
          <circle
            key={ring}
            cx="0"
            cy="0"
            r={220 * ring}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity="0.3"
            strokeDasharray="4 8"
          />
        ))}

        {connectionEdges.map((edge) => (
          <CurvedLink
            key={edge.id}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            color="#6366F1"
            opacity={0.4}
            isConnection
          />
        ))}

        {parentEdges.map((edge) => (
          <CurvedLink
            key={edge.id}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            color={edge.color}
            opacity={0.4}
          />
        ))}

        <g data-map-node="center" className="cursor-pointer" onClick={onAddNode}>
          <circle
            cx="0"
            cy="0"
            r="42"
            fill="hsl(var(--card))"
            stroke="#8B5CF6"
            strokeWidth="2.5"
            filter="url(#node-shadow)"
          />
          <circle
            cx="0"
            cy="0"
            r="50"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="1"
            opacity="0.3"
          />
          <text
            x="0"
            y="-5"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            fontSize="14"
            fontWeight="700"
            fontFamily="var(--font-sans)"
          >
            {truncateLabel(centerLabel, 0)}
          </text>
          <text
            x="0"
            y="13"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize="10"
            fontFamily="var(--font-sans)"
          >
            {centerSublabel}
          </text>
        </g>

        {positionedNodes.map((pn) => {
          const isSelected = selectedNode?.id === pn.node.id;
          const isHovered = hoveredNode === pn.node.id;
          const color = pn.node.color || NODE_COLORS[pn.node.level] || "#8B5CF6";
          const children = allNodes.filter((n) => n.parentId === pn.node.id);
          const hasChildren = children.length > 0;
          const density = Math.min(children.length / 5, 1);
          const tierLabel = LEVEL_LABELS_KO[pn.node.level] || LEVEL_NAMES[pn.node.level];
          const depth = pn.node.level;
          const fontSize = Math.max(10 - depth, 7);

          return (
            <g
              key={pn.node.id}
              data-map-node={pn.node.id}
              className="cursor-pointer"
              onPointerEnter={() => setHoveredNode(pn.node.id)}
              onPointerLeave={() => setHoveredNode(null)}
              onClick={(e) => {
                e.stopPropagation();
                onNodeSelect(pn.node);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (hasChildren || pn.node.level < 7) {
                  onNodeZoom(pn.node);
                }
              }}
              data-testid={`map-node-${pn.node.id}`}
            >
              {isSelected && (
                <circle
                  cx={pn.x}
                  cy={pn.y}
                  r={pn.radius + 8}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.4"
                  strokeDasharray="4 3"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${pn.x} ${pn.y}`}
                    to={`360 ${pn.x} ${pn.y}`}
                    dur="12s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              <circle
                cx={pn.x}
                cy={pn.y}
                r={isHovered || isSelected ? pn.radius + 3 : pn.radius}
                fill={`${color}${isHovered ? "30" : "18"}`}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                opacity={density * 0.3 + 0.7}
                filter={isHovered ? "url(#glow)" : "url(#node-shadow)"}
                style={{ transition: "r 0.2s, stroke-width 0.2s" }}
              />

              <circle
                cx={pn.x}
                cy={pn.y}
                r={pn.radius * 0.3}
                fill={color}
                opacity={0.3 + density * 0.5}
              />

              <text
                x={pn.x}
                y={pn.y + pn.radius + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--foreground))"
                fontSize={fontSize}
                fontWeight="600"
                fontFamily="var(--font-sans)"
                opacity={isHovered || isSelected ? 1 : 0.8}
              >
                {truncateLabel(pn.node.title, depth)}
              </text>

              <text
                x={pn.x}
                y={pn.y + pn.radius + 14 + fontSize + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={Math.max(fontSize - 2, 6)}
                fontFamily="var(--font-mono)"
              >
                {tierLabel}
                {hasChildren ? ` · ${children.length}` : ""}
              </text>

              {isHovered && pn.node.description && (
                <foreignObject
                  x={pn.x - 90}
                  y={pn.y - pn.radius - 48}
                  width="180"
                  height="40"
                  style={{ pointerEvents: "none" }}
                >
                  <div className="bg-popover border border-popover-border rounded-lg px-3 py-1.5 text-[10px] text-popover-foreground leading-tight text-center shadow-lg line-clamp-2">
                    {pn.node.description}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {positionedNodes
          .filter((pn) => pn.node.level === 2 && pn.node.content)
          .map((pn) => {
            const angle = Math.atan2(pn.y, pn.x);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const cardW = 140;
            const cardH = 52;
            const dist = pn.radius + 16;
            const cx = pn.x + cos * dist + (cos >= 0 ? 0 : -cardW);
            const cy = pn.y + sin * dist - cardH / 2;

            return (
              <foreignObject
                key={`report-${pn.node.id}`}
                x={cx}
                y={cy}
                width={cardW}
                height={cardH}
                data-testid={`report-card-${pn.node.id}`}
                style={{ pointerEvents: "auto" }}
              >
                <div
                  className="h-full rounded-lg border border-violet-500/30 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden flex flex-col"
                  style={{ fontSize: 0 }}
                >
                  <div className="flex-1 px-2 py-1">
                    <div style={{ fontSize: 7 }} className="text-violet-400 font-semibold uppercase tracking-wider">
                      📄 보고서
                    </div>
                    <div style={{ fontSize: 9 }} className="font-bold text-foreground leading-tight truncate">
                      {pn.node.title}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewFullText?.(pn.node);
                    }}
                    className="w-full px-2 py-1 border-t border-violet-500/20 hover:bg-violet-500/10 transition-colors cursor-pointer"
                    style={{ fontSize: 8 }}
                    data-testid={`button-view-fulltext-${pn.node.id}`}
                  >
                    <span className="text-violet-400 font-medium">전문 보기 →</span>
                  </button>
                </div>
              </foreignObject>
            );
          })}
      </svg>

      {positionedNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center pointer-events-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              텍스트를 분석하여 지식을 구조화하세요
            </p>
            <button
              onClick={onAddNode}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-add-first-node"
            >
              AI 분석 시작
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
