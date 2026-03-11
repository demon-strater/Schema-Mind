import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { type KnowledgeNode, type Connection, LEVEL_NAMES, LEVEL_COLORS } from "@shared/schema";
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

  const rootChildren = focusNodeId === null
    ? childrenMap.get(null) || []
    : childrenMap.get(focusNodeId) || [];

  if (rootChildren.length === 0) return positioned;

  const LEVEL_RADIUS_BASE = 180;
  const MIN_SPACING = 90;

  function layoutSubtree(
    nodeId: number,
    node: KnowledgeNode,
    angleStart: number,
    angleEnd: number,
    depth: number
  ) {
    const r = LEVEL_RADIUS_BASE * depth;
    const angleMid = (angleStart + angleEnd) / 2;
    const x = centerX + r * Math.cos(angleMid);
    const y = centerY + r * Math.sin(angleMid);
    const nodeRadius = Math.max(28 - depth * 3, 12);

    positioned.push({ node, x, y, radius: nodeRadius });

    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return;

    const angleRange = angleEnd - angleStart;
    const childAngleStep = angleRange / children.length;

    children.forEach((child, i) => {
      const childStart = angleStart + childAngleStep * i;
      const childEnd = childStart + childAngleStep;
      layoutSubtree(child.id, child, childStart, childEnd, depth + 1);
    });
  }

  const totalAngle = Math.PI * 2;
  const angleStep = totalAngle / rootChildren.length;

  rootChildren.forEach((child, i) => {
    const startAngle = angleStep * i - Math.PI / 2;
    const endAngle = startAngle + angleStep;
    layoutSubtree(child.id, child, startAngle, endAngle, 1);
  });

  return positioned;
}

function CurvedLink({
  x1, y1, x2, y2, color, opacity, isConnection
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; opacity: number; isConnection?: boolean;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (isConnection) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const perpX = -dy * 0.2;
    const perpY = dx * 0.2;
    const cpX = midX + perpX;
    const cpY = midY + perpY;
    return (
      <path
        d={`M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        fill="none"
        opacity={opacity * 0.5}
        className="transition-opacity duration-300"
      />
    );
  }

  const cx1 = x1 + dx * 0.4;
  const cy1 = y1;
  const cx2 = x1 + dx * 0.6;
  const cy2 = y2;

  return (
    <path
      d={`M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`}
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
  selectedNode, focusNodeId, onAddNode
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
      minX = Math.min(minX, x - radius - 60);
      maxX = Math.max(maxX, x + radius + 60);
      minY = Math.min(minY, y - radius - 60);
      maxY = Math.max(maxY, y + radius + 60);
    });
    minX = Math.min(minX, -60);
    maxX = Math.max(maxX, 60);
    minY = Math.min(minY, -60);
    maxY = Math.max(maxY, 60);
    const padding = 80;
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
      } else {
        e.preventDefault();
        const svgEl = el.querySelector("svg");
        if (!svgEl) return;
        const rect = svgEl.getBoundingClientRect();
        const scaleY = viewBox.h / rect.height;
        const scaleX = viewBox.w / rect.width;
        setViewBox((v) => ({
          ...v,
          x: v.x + (e.deltaX * scaleX),
          y: v.y + (e.deltaY * scaleY),
        }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [handleZoom, viewBox]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as SVGElement).closest("[data-map-node]")) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const dx = (e.clientX - panStart.x) * scaleX;
    const dy = (e.clientY - panStart.y) * scaleY;
    setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, viewBox]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const focusNode = focusNodeId !== null ? allNodes.find((n) => n.id === focusNodeId) : null;
  const centerLabel = focusNode ? focusNode.title : "Cogito";
  const centerSublabel = focusNode ? LEVEL_NAMES[focusNode.level] : "나";

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-background rounded-2xl border border-border overflow-hidden"
      style={{ height: "calc(100vh - 200px)", minHeight: 500 }}
      data-testid="mind-map"
    >
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => handleZoom(0.8)}
          className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          data-testid="button-zoom-in-map"
        >
          <ZoomIn className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={() => handleZoom(1.25)}
          className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          data-testid="button-zoom-out-map"
        >
          <ZoomOut className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={handleReset}
          className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          data-testid="button-fit-map"
        >
          <Maximize className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 flex-wrap">
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
        className={`select-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
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

        {[1, 2, 3, 4].map((ring) => (
          <circle
            key={ring}
            cx="0"
            cy="0"
            r={180 * ring}
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
            opacity={
              hoveredNode !== null
                ? hoveredNode === edge.level
                  ? 0.7
                  : 0.15
                : 0.4
            }
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
            {centerLabel}
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
                y={pn.y + pn.radius + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--foreground))"
                fontSize={Math.max(11 - (pn.node.level - 1), 8)}
                fontWeight="600"
                fontFamily="var(--font-sans)"
                opacity={isHovered || isSelected ? 1 : 0.8}
              >
                {pn.node.title.length > 18
                  ? pn.node.title.slice(0, 16) + "…"
                  : pn.node.title}
              </text>

              <text
                x={pn.x}
                y={pn.y + pn.radius + 28}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize="8"
                fontFamily="var(--font-mono)"
              >
                L{pn.node.level}
                {hasChildren ? ` · ${children.length}` : ""}
              </text>

              {isHovered && pn.node.description && (
                <foreignObject
                  x={pn.x - 100}
                  y={pn.y - pn.radius - 52}
                  width="200"
                  height="44"
                >
                  <div className="bg-popover border border-popover-border rounded-lg px-3 py-1.5 text-[10px] text-popover-foreground leading-tight text-center shadow-lg line-clamp-2">
                    {pn.node.description}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>

      {positionedNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center pointer-events-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <span className="text-3xl">🌱</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Start adding knowledge nodes to grow your brain
            </p>
            <button
              onClick={onAddNode}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              data-testid="button-add-first-mind-map"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add First Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
