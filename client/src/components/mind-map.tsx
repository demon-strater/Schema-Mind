import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { type KnowledgeNode, type Connection, LEVEL_NAMES, LEVEL_COLORS, LEVEL_LABELS_KO } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize, Plus, X, FileText } from "lucide-react";

interface MindMapProps {
  allNodes: KnowledgeNode[];
  connections: Connection[];
  onNodeSelect: (node: KnowledgeNode) => void;
  onNodeZoom: (node: KnowledgeNode) => void;
  selectedNode: KnowledgeNode | null;
  focusNodeId: number | null;
  onAddNode: () => void;
  fullscreen?: boolean;
}

function buildAdjacency(
  allNodes: KnowledgeNode[],
  connections: Connection[],
  posMap: Map<number, PositionedNode>
): Map<number, Set<number>> {
  const adj = new Map<number, Set<number>>();
  const ensure = (id: number) => { if (!adj.has(id)) adj.set(id, new Set()); };

  allNodes.forEach((node) => {
    if (!posMap.has(node.id)) return;
    ensure(node.id);
    if (node.parentId !== null && posMap.has(node.parentId)) {
      ensure(node.parentId);
      adj.get(node.id)!.add(node.parentId);
      adj.get(node.parentId)!.add(node.id);
    }
  });

  connections.forEach((conn) => {
    if (posMap.has(conn.sourceId) && posMap.has(conn.targetId)) {
      ensure(conn.sourceId);
      ensure(conn.targetId);
      adj.get(conn.sourceId)!.add(conn.targetId);
      adj.get(conn.targetId)!.add(conn.sourceId);
    }
  });

  return adj;
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

const TIER_ICONS: Record<number, string> = {
  2: "📄",
  3: "💡",
  4: "📖",
  5: "ℹ️",
  6: "📊",
};

const CATEGORY_PALETTE = [
  "#F87171", // red
  "#FB923C", // orange
  "#FBBF24", // amber
  "#4ADE80", // green
  "#22D3EE", // cyan
  "#60A5FA", // blue
  "#A78BFA", // violet
  "#F472B6", // pink
  "#2DD4BF", // teal
];

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

  const BASE_RADIUS = 300;
  const RADIUS_STEP = 300;
  // Force all categories to equal arc proportion so inter-category L2 nodes never crowd together
  const MIN_LEAF_WEIGHT = 8;

  // Per-depth box sizes – must match the rendered BOX_SIZES below.
  // L1 uses L2's box dims so that spacing at depth=1 accounts for L2 adjacency too.
  const LAYOUT_BOX_W: Record<number, number> = { 1: 172, 2: 172, 3: 152, 4: 138, 5: 104, 6: 90 };
  const LAYOUT_BOX_H: Record<number, number> = { 1: 48,  2: 48,  3: 38,  4: 34,  5: 28,  6: 26 };
  const SPACING_MARGIN = 24;

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

    // Compute minimum spacing from box diagonal so no two siblings ever overlap
    const bw = LAYOUT_BOX_W[depth] ?? 90;
    const bh = LAYOUT_BOX_H[depth] ?? 26;
    const minArcSpacing = Math.sqrt(bw * bw + bh * bh) + SPACING_MARGIN;

    let r = baseR;
    if (children.length > 1) {
      for (let i = 0; i < children.length; i++) {
        const j = (i + 1) % children.length;
        const halfArcI = angleRange * proportions[i] / 2;
        const halfArcJ = angleRange * proportions[j] / 2;
        const gapAngle = halfArcI + halfArcJ;
        const neededR = minArcSpacing / Math.max(gapAngle, 0.001);
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
        strokeWidth={1}
        strokeDasharray="4 4"
        fill="none"
        opacity={opacity * 0.7}
        className="transition-opacity duration-300"
      />
    );
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const cx1 = x1 + dx * 0.3;
  const cy1 = y1;
  const cx2 = x1 + dx * 0.7;
  const cy2 = y2;
  return (
    <path
      d={`M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`}
      stroke={color}
      strokeWidth={2.2}
      fill="none"
      opacity={opacity}
      className="transition-opacity duration-300"
    />
  );
}

function screenToSvg(svgEl: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: svgPt.x, y: svgPt.y };
}

export function MindMap({
  allNodes, connections, onNodeSelect, onNodeZoom,
  selectedNode, focusNodeId, onAddNode, fullscreen
}: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: -600, y: -450, w: 1200, h: 900 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [fullTextNode, setFullTextNode] = useState<KnowledgeNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 900 });

  const nodeOffsets = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [dragState, setDragState] = useState<{
    nodeId: number;
    startSvg: { x: number; y: number };
    startOffset: { x: number; y: number };
  } | null>(null);
  const velocityRef = useRef<Map<number, { vx: number; vy: number }>>(new Map());
  const lastDragPos = useRef<{ x: number; y: number; t: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const dragSpringRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const [, forceUpdate] = useState(0);

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

  useEffect(() => {
    nodeOffsets.current.clear();
    velocityRef.current.clear();
    forceUpdate(n => n + 1);
  }, [focusNodeId, allNodes.length]);

  const getNodePos = useCallback((pn: PositionedNode) => {
    const off = nodeOffsets.current.get(pn.node.id);
    return {
      x: pn.x + (off?.x ?? 0),
      y: pn.y + (off?.y ?? 0),
    };
  }, []);

  const posMap = useMemo(() => {
    const m = new Map<number, PositionedNode>();
    positionedNodes.forEach((pn) => m.set(pn.node.id, pn));
    return m;
  }, [positionedNodes]);

  // Category color map: L1 nodeId → unique color
  const categoryColorMap = useMemo(() => {
    const map = new Map<number, string>();
    const l1Nodes = allNodes.filter(n => n.level === 1).sort((a, b) => a.sortOrder - b.sortOrder);
    l1Nodes.forEach((node, i) => map.set(node.id, CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]));
    return map;
  }, [allNodes]);

  // Node → ancestor category color map
  const nodeCategoryColorMap = useMemo(() => {
    const map = new Map<number, string>();
    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    allNodes.forEach(node => {
      let cur: KnowledgeNode | undefined = node;
      while (cur) {
        if (cur.level === 1) { const c = categoryColorMap.get(cur.id); if (c) map.set(node.id, c); break; }
        cur = cur.parentId != null ? nodeMap.get(cur.parentId) : undefined;
      }
    });
    return map;
  }, [allNodes, categoryColorMap]);

  // Sector wedge paths for each L1 category
  const sectorWedges = useMemo(() => {
    const l1 = positionedNodes.filter(pn => pn.node.level === 1);
    if (l1.length < 2) return [];
    const norm = (a: number) => { while (a < -Math.PI / 2 - 0.001) a += Math.PI * 2; return a; };
    const sorted = [...l1].sort((a, b) => norm(Math.atan2(a.y, a.x)) - norm(Math.atan2(b.y, b.x)));
    const n = sorted.length;
    const angles = sorted.map(pn => norm(Math.atan2(pn.y, pn.x)));
    // boundary[i] = midpoint between category i and i+1
    const boundaries = angles.map((a, i) => {
      const next = i < n - 1 ? angles[i + 1] : angles[0] + Math.PI * 2;
      return (a + next) / 2;
    });
    const INNER_R = 108;
    const OUTER_R = 1900;
    return sorted.map((pn, i) => {
      const a1 = i === 0 ? boundaries[n - 1] - Math.PI * 2 : boundaries[i - 1];
      const a2 = boundaries[i];
      const sweep = a2 - a1;
      const large = sweep > Math.PI ? 1 : 0;
      const [c1, s1, c2, s2] = [Math.cos(a1), Math.sin(a1), Math.cos(a2), Math.sin(a2)];
      const d = `M ${INNER_R*c1} ${INNER_R*s1} L ${OUTER_R*c1} ${OUTER_R*s1} A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${OUTER_R*c2} ${OUTER_R*s2} L ${INNER_R*c2} ${INNER_R*s2} A ${INNER_R} ${INNER_R} 0 ${large} 0 ${INNER_R*c1} ${INNER_R*s1} Z`;
      const color = categoryColorMap.get(pn.node.id) ?? '#8B5CF6';
      const labelAngle = (a1 + a2) / 2;
      const labelR = INNER_R + 40;
      return { nodeId: pn.node.id, d, color, labelAngle, labelR, a1, a2 };
    });
  }, [positionedNodes, categoryColorMap]);

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
          childId: pn.node.id,
          parentNodeId: parentPos ? pid : null,
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
          sourceId: conn.sourceId,
          targetId: conn.targetId,
          description: conn.description,
        };
      })
      .filter(Boolean) as {
        id: string; sourceId: number; targetId: number; description: string | null;
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
      const off = nodeOffsets.current.get(positionedNodes.find(pn => pn.x === x && pn.y === y)?.node.id ?? -1);
      const px = x + (off?.x ?? 0);
      const py = y + (off?.y ?? 0);
      minX = Math.min(minX, px - radius - 100);
      maxX = Math.max(maxX, px + radius + 100);
      minY = Math.min(minY, py - radius - 100);
      maxY = Math.max(maxY, py + radius + 100);
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
    return spaceHeld || e.ctrlKey || e.metaKey || e.button === 1;
  }, [spaceHeld]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1) {
      e.preventDefault();
    }
    if (canPan(e)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  }, [canPan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const dx = (e.clientX - panStart.x) * scaleX * 1.4;
    const dy = (e.clientY - panStart.y) * scaleY * 1.4;
    setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, viewBox]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const adjacency = useMemo(
    () => buildAdjacency(allNodes, connections, posMap),
    [allNodes, connections, posMap]
  );

  const applySpringForces = useCallback((draggedId: number | null, dt: number) => {
    const SPRING_K = 0.15;
    const DAMPING = 0.85;

    const forces = new Map<number, { fx: number; fy: number }>();

    adjacency.forEach((neighbors, nodeId) => {
      if (nodeId === draggedId) return;
      const pn = posMap.get(nodeId);
      if (!pn) return;
      const offA = nodeOffsets.current.get(nodeId) || { x: 0, y: 0 };

      neighbors.forEach((neighborId) => {
        const pnB = posMap.get(neighborId);
        if (!pnB) return;
        const offB = nodeOffsets.current.get(neighborId) || { x: 0, y: 0 };

        const diffX = offB.x - offA.x;
        const diffY = offB.y - offA.y;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);
        if (dist < 0.5) return;

        const fx = diffX * SPRING_K;
        const fy = diffY * SPRING_K;

        if (!forces.has(nodeId)) forces.set(nodeId, { fx: 0, fy: 0 });
        const f = forces.get(nodeId)!;
        f.fx += fx;
        f.fy += fy;
      });
    });

    let anyMoved = false;
    forces.forEach(({ fx, fy }, nodeId) => {
      const magnitude = Math.sqrt(fx * fx + fy * fy);
      if (magnitude < 0.3) return;

      anyMoved = true;
      const vel = velocityRef.current.get(nodeId) || { vx: 0, vy: 0 };
      vel.vx = (vel.vx + fx) * DAMPING;
      vel.vy = (vel.vy + fy) * DAMPING;
      velocityRef.current.set(nodeId, vel);

      const off = nodeOffsets.current.get(nodeId) || { x: 0, y: 0 };
      off.x += vel.vx * dt;
      off.y += vel.vy * dt;
      nodeOffsets.current.set(nodeId, off);
    });

    return anyMoved;
  }, [adjacency, posMap]);

  const startMomentumDecay = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    let lastTime = performance.now();
    const FRICTION = 3.5;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      let anyMoving = false;

      velocityRef.current.forEach((vel, nodeId) => {
        const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
        if (speed < 0.5) {
          velocityRef.current.delete(nodeId);
          return;
        }
        anyMoving = true;
        const decay = Math.exp(-FRICTION * dt);
        vel.vx *= decay;
        vel.vy *= decay;

        const off = nodeOffsets.current.get(nodeId) || { x: 0, y: 0 };
        off.x += vel.vx * dt;
        off.y += vel.vy * dt;
        nodeOffsets.current.set(nodeId, off);
      });

      const springMoved = applySpringForces(null, dt);
      anyMoving = anyMoving || springMoved;

      if (anyMoving) {
        forceUpdate(n => n + 1);
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [applySpringForces]);

  const handleNodeDragStart = useCallback((nodeId: number, e: React.PointerEvent) => {
    if (e.button !== 0 || canPan(e)) return;
    e.stopPropagation();
    const svgEl = svgRef.current;
    if (!svgEl) return;

    velocityRef.current.delete(nodeId);

    const svgPt = screenToSvg(svgEl, e.clientX, e.clientY);
    const off = nodeOffsets.current.get(nodeId) || { x: 0, y: 0 };

    didDragRef.current = false;
    setDragState({ nodeId, startSvg: svgPt, startOffset: { ...off } });
    lastDragPos.current = { x: svgPt.x, y: svgPt.y, t: performance.now() };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [canPan]);

  const startDragSpringLoop = useCallback(() => {
    if (dragSpringRef.current) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const dragging = dragState;
      if (dragging) {
        applySpringForces(dragging.nodeId, dt);
        forceUpdate(n => n + 1);
        dragSpringRef.current = requestAnimationFrame(loop);
      } else {
        dragSpringRef.current = null;
      }
    };
    dragSpringRef.current = requestAnimationFrame(loop);
  }, [dragState, applySpringForces]);

  useEffect(() => {
    if (dragState) {
      startDragSpringLoop();
    }
    return () => {
      if (dragSpringRef.current) {
        cancelAnimationFrame(dragSpringRef.current);
        dragSpringRef.current = null;
      }
    };
  }, [dragState, startDragSpringLoop]);

  const handleNodeDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svgPt = screenToSvg(svgEl, e.clientX, e.clientY);
    const dx = svgPt.x - dragState.startSvg.x;
    const dy = svgPt.y - dragState.startSvg.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      didDragRef.current = true;
    }

    nodeOffsets.current.set(dragState.nodeId, {
      x: dragState.startOffset.x + dx,
      y: dragState.startOffset.y + dy,
    });

    const now = performance.now();
    const prev = lastDragPos.current;
    if (prev) {
      const elapsed = (now - prev.t) / 1000;
      if (elapsed > 0.001) {
        velocityRef.current.set(dragState.nodeId, {
          vx: (svgPt.x - prev.x) / elapsed,
          vy: (svgPt.y - prev.y) / elapsed,
        });
      }
    }
    lastDragPos.current = { x: svgPt.x, y: svgPt.y, t: now };

    forceUpdate(n => n + 1);
  }, [dragState]);

  const handleNodeDragEnd = useCallback(() => {
    if (!dragState) return;
    setDragState(null);
    lastDragPos.current = null;
    startMomentumDecay();
  }, [dragState, startMomentumDecay]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (dragSpringRef.current) cancelAnimationFrame(dragSpringRef.current);
    };
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

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className={`select-none ${dragState ? "cursor-grabbing" : isPanning ? "cursor-grabbing" : spaceHeld ? "cursor-grab" : "cursor-default"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => {
          handlePointerMove(e);
          handleNodeDragMove(e);
        }}
        onPointerUp={(e) => {
          handlePointerUp();
          handleNodeDragEnd();
        }}
        onPointerLeave={() => {
          handlePointerUp();
          handleNodeDragEnd();
        }}
        onAuxClick={(e) => e.preventDefault()}
        onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
      >
        <defs>
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          {sectorWedges.map(({ nodeId, color }) => (
            <radialGradient
              key={`grad-${nodeId}`}
              id={`sector-grad-${nodeId}`}
              cx="0" cy="0" r="1600"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="6%" stopColor={color} stopOpacity="0.22" />
              <stop offset="55%" stopColor={color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </radialGradient>
          ))}
          <filter id="box-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#8B5CF6" floodOpacity="0.12" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="0" cy="0" r="350" fill="url(#center-glow)" />

        {/* Category sector backgrounds */}
        {sectorWedges.map(({ nodeId, d, color, a1, a2 }) => (
          <g key={`sector-${nodeId}`}>
            {/* Gradient sector fill */}
            <path
              d={d}
              fill={`url(#sector-grad-${nodeId})`}
              stroke="none"
            />
            {/* Boundary divider lines – solid, more visible */}
            <line
              x1={108 * Math.cos(a2)} y1={108 * Math.sin(a2)}
              x2={1900 * Math.cos(a2)} y2={1900 * Math.sin(a2)}
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={0.55}
            />
          </g>
        ))}
        {/* Inner arc rings per sector, colored by category */}
        {sectorWedges.map(({ nodeId, color, a1, a2 }) => {
          const R = 108;
          const sweep = a2 - a1;
          const large = sweep > Math.PI ? 1 : 0;
          const [c1, s1, c2, s2] = [Math.cos(a1), Math.sin(a1), Math.cos(a2), Math.sin(a2)];
          return (
            <path
              key={`inner-arc-${nodeId}`}
              d={`M ${R*c1} ${R*s1} A ${R} ${R} 0 ${large} 1 ${R*c2} ${R*s2}`}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeOpacity={0.5}
            />
          );
        })}

        {Array.from({ length: maxRing }, (_, i) => i + 1).map((ring) => (
          <circle
            key={ring}
            cx="0"
            cy="0"
            r={300 * ring}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity="0.3"
            strokeDasharray="3 8"
          />
        ))}

        {connectionEdges.map((edge) => {
          const srcPn = posMap.get(edge.sourceId);
          const tgtPn = posMap.get(edge.targetId);
          if (!srcPn || !tgtPn) return null;
          const srcPos = getNodePos(srcPn);
          const tgtPos = getNodePos(tgtPn);
          return (
            <CurvedLink
              key={edge.id}
              x1={srcPos.x}
              y1={srcPos.y}
              x2={tgtPos.x}
              y2={tgtPos.y}
              color="#6366F1"
              opacity={0.65}
              isConnection
            />
          );
        })}

        {parentEdges.map((edge) => {
          const childPn = posMap.get(edge.childId);
          if (!childPn) return null;
          const childPos = getNodePos(childPn);
          let parentPos = { x: 0, y: 0 };
          if (edge.parentNodeId !== null) {
            const parentPn = posMap.get(edge.parentNodeId);
            if (parentPn) parentPos = getNodePos(parentPn);
          }
          const edgeColor = nodeCategoryColorMap.get(edge.childId) || edge.color;
          return (
            <CurvedLink
              key={edge.id}
              x1={parentPos.x}
              y1={parentPos.y}
              x2={childPos.x}
              y2={childPos.y}
              color={edgeColor}
              opacity={0.65}
            />
          );
        })}

        <g data-map-node="center" className="cursor-pointer" onClick={onAddNode}>
          <foreignObject x="-85" y="-35" width="170" height="70" style={{ pointerEvents: "auto", overflow: "visible" }}>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-violet-400 dark:border-violet-300 bg-card/95 backdrop-blur-sm shadow-lg shadow-violet-500/25 hover:border-violet-300 hover:shadow-violet-500/35 transition-all" style={{ height: 70 }}>
              <span className="text-base font-bold text-foreground tracking-tight">{centerLabel}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{centerSublabel}</span>
            </div>
          </foreignObject>
        </g>

        {positionedNodes.map((pn) => {
          const pos = getNodePos(pn);
          const isSelected = selectedNode?.id === pn.node.id;
          const isHovered = hoveredNode === pn.node.id;
          const isDragging = dragState?.nodeId === pn.node.id;
          const color = pn.node.color || NODE_COLORS[pn.node.level] || "#8B5CF6";
          const children = allNodes.filter((n) => n.parentId === pn.node.id);
          const hasChildren = children.length > 0;
          const tierLabel = LEVEL_LABELS_KO[pn.node.level] || LEVEL_NAMES[pn.node.level];
          const depth = pn.node.level;
          const isArticle = pn.node.level === 2 && !!pn.node.content;
          const isCategory = pn.node.level === 1;

          const FONT_SIZES: Record<number, number> = { 1: 15, 2: 13, 3: 12, 4: 11, 5: 10, 6: 9 };
          const FONT_WEIGHTS: Record<number, number> = { 1: 500, 2: 400, 3: 400, 4: 300, 5: 300, 6: 300 };
          const fontSize = FONT_SIZES[depth] || 9;
          const fontWeight = FONT_WEIGHTS[depth] || 400;

          // Must match LAYOUT_BOX_W / LAYOUT_BOX_H in layoutRadialTree
          const BOX_SIZES: Record<number, [number, number]> = {
            1: [126, 40], 2: [172, 48], 3: [152, 38], 4: [138, 34], 5: [104, 28], 6: [90, 26]
          };
          const [boxW, boxH] = BOX_SIZES[depth] || [140, 34];
          const bx = pos.x - boxW / 2;
          const by = pos.y - boxH / 2;

          const displayTitle = pn.node.level >= 3 && pn.node.level <= 6
            ? `${tierLabel} : ${pn.node.title.replace(/^[^\p{L}\p{N}]*(지혜|지식|정보|데이터)\s*/u, "")}`
            : pn.node.title;

          const tierIcon = TIER_ICONS[pn.node.level] || "";

          return (
            <g
              key={pn.node.id}
              data-map-node={pn.node.id}
              className={isDragging ? "cursor-grabbing" : "cursor-grab"}
              onPointerEnter={() => setHoveredNode(pn.node.id)}
              onPointerLeave={() => setHoveredNode(null)}
              onPointerDown={(e) => handleNodeDragStart(pn.node.id, e)}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!didDragRef.current && pn.node.content) {
                  setFullTextNode(pn.node);
                }
              }}
              data-testid={`map-node-${pn.node.id}`}
            >
              <foreignObject
                x={bx}
                y={by}
                width={boxW}
                height={boxH + 18}
                style={{ pointerEvents: "auto", overflow: "visible" }}
              >
                <div
                  className={`flex items-center justify-center gap-1 rounded-md text-center leading-tight transition-all duration-200 ${
                    depth >= 5 ? "px-1.5 py-0.5" : depth >= 3 ? "px-2 py-1" : "px-3 py-1.5"
                  } ${
                    isArticle
                      ? "border-2 border-violet-500 dark:border-violet-400 bg-violet-950/90 dark:bg-violet-950/90 shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:border-violet-300"
                      : isCategory
                        ? "border-2 border-violet-500 dark:border-violet-400/80 bg-card shadow-sm hover:shadow-md"
                        : "border border-violet-400/70 dark:border-violet-400/50 bg-card shadow-sm hover:shadow-md"
                  } ${isDragging ? "ring-2 ring-primary/40 scale-105" : ""} ${
                    isSelected ? "ring-2 ring-primary/60" : ""
                  } ${isHovered && !isDragging ? "scale-[1.03]" : ""}`}
                  style={{
                    minHeight: boxH,
                    maxHeight: boxH,
                    overflow: "hidden",
                    borderColor: isCategory
                      ? (nodeCategoryColorMap.get(pn.node.id) ?? undefined)
                      : !isArticle && (isSelected || isHovered) ? color : undefined,
                    backgroundColor: isCategory
                      ? `${nodeCategoryColorMap.get(pn.node.id) ?? '#8B5CF6'}1A`
                      : undefined,
                    boxShadow: isCategory
                      ? `0 2px 8px ${(nodeCategoryColorMap.get(pn.node.id) ?? '#8B5CF6')}33`
                      : undefined,
                    transform: isDragging ? "scale(1.05)" : isHovered ? "scale(1.03)" : "scale(1)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  }}
                  data-testid={isArticle ? `article-box-${pn.node.id}` : `label-box-${pn.node.id}`}
                >
                  {isArticle && (
                    <FileText style={{ width: 14, height: 14, flexShrink: 0 }} className="text-violet-300" />
                  )}
                  <span
                    className={`leading-tight line-clamp-2 ${
                      isArticle ? "text-white" 
                      : isCategory ? "text-foreground" 
                      : "text-foreground"
                    }`}
                    style={{ fontSize, fontWeight, wordBreak: "keep-all", overflowWrap: "break-word" }}
                  >
                    {displayTitle}
                  </span>
                </div>
                {(isHovered || isSelected) && !isDragging && (
                  <div className="text-center mt-0.5" style={{ fontSize: Math.max(fontSize - 2, 8) }}>
                    <span className="text-foreground/60 font-mono">
                      {tierLabel}{hasChildren ? ` · ${children.length}` : ""}
                    </span>
                  </div>
                )}
              </foreignObject>
            </g>
          );
        })}

      </svg>

      <AnimatePresence>
        {fullTextNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
            onClick={() => setFullTextNode(null)}
            data-testid="fulltext-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative w-[90%] max-w-lg max-h-[80%] rounded-2xl border border-violet-500/30 bg-card shadow-2xl shadow-violet-500/10 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              data-testid="fulltext-popup"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-gradient-to-r from-violet-500/5 to-transparent">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4.5 h-4.5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate" data-testid="fulltext-title">
                    {fullTextNode.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{fullTextNode.description}</p>
                </div>
                <button
                  onClick={() => setFullTextNode(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                  data-testid="button-close-fulltext"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="fulltext-content">
                  {fullTextNode.content}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
