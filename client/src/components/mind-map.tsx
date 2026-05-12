import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { type KnowledgeNode, type Connection } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2, ZoomIn, Plus, Sparkles, Activity, Crosshair, Box, Zap } from "lucide-react";
import { AddNodeDialog } from "./add-node-dialog";

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

type Vec3 = { x: number; y: number; z: number };

const BACKRONYM_CYAN = "#00f2ff";
const BACKRONYM_BG = "#020305";
const PURPLE_ACCENT = "#a855f7";

// Math Helpers
function add(a: Vec3, b: Vec3): Vec3 { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function scale(vec: Vec3, factor: number): Vec3 { return { x: vec.x * factor, y: vec.y * factor, z: vec.z * factor }; }
function normalize(vec: Vec3): Vec3 { const len = Math.sqrt(vec.x**2 + vec.y**2 + vec.z**2) || 1; return { x: vec.x / len, y: vec.y / len, z: vec.z / len }; }
function rotateX(vec: Vec3, angle: number): Vec3 { const c = Math.cos(angle), s = Math.sin(angle); return { x: vec.x, y: vec.y * c - vec.z * s, z: vec.y * s + vec.z * c }; }
function rotateY(vec: Vec3, angle: number): Vec3 { const c = Math.cos(angle), s = Math.sin(angle); return { x: vec.x * c + vec.z * s, y: vec.y, z: -vec.x * s + vec.z * c }; }

function fibonacciSphere(index: number, count: number) {
  if (count <= 1) return { x: 0, y: 0, z: 1 };
  const y = 1 - (index / (count - 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const phi = Math.PI * (3 - Math.sqrt(5)) * index;
  return { x: Math.cos(phi) * radius, y, z: Math.sin(phi) * radius };
}

function extractKeyword(title: string) {
  if (!title) return "DAT";
  const primaryLine = title.split("\n").map(l => l.trim()).find(l => l && !l.includes("날짜")) ?? title.trim();
  const cleaned = primaryLine.replace(/[\[\]{}()📅💡📖ℹ️📊:;,/\\|]/g, " ").replace(/\s+/g, " ").trim();
  const token = cleaned.match(/[A-Za-z0-9가-힣]+/)?.[0];
  return token ? token.slice(0, 14) : cleaned.slice(0, 14) || "DAT";
}

const HUD_Bracket = ({ pos, isLight }: { pos: "tl" | "tr" | "bl" | "br", isLight: boolean }) => {
  const styles = {
    tl: "top-0 left-0 border-t border-l",
    tr: "top-0 right-0 border-t border-r",
    bl: "bottom-0 left-0 border-b border-l",
    br: "bottom-0 right-0 border-b border-r",
  };
  const borderColor = isLight ? "border-slate-400" : "border-cyan-500/40";
  return <div className={`absolute w-2 h-2 ${borderColor} ${styles[pos]}`} />;
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function MindMap({ allNodes, connections, onNodeSelect, onNodeZoom, selectedNode, focusNodeId, onAddNode, fullscreen }: MindMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [manualAdd, setManualAdd] = useState<{ parentId: number | null, level: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: number | null, level: number } | null>(null);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsLight(!document.documentElement.classList.contains("dark"));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    setIsLight(!document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  const state = useRef({
    yaw: 0.8, pitch: -0.2, yawVel: 0, pitchVel: 0, zoom: 400, zoomVel: 0,
    offsetX: 0, offsetY: 0, isDragging: false, dragMode: "rotate" as "rotate" | "pan" | "node",
    lastX: 0, lastY: 0, targetNodeId: null as number | null, 
    nodeOffsets: {} as Record<number, Vec3>,
    nodeVelocities: {} as Record<number, Vec3>,
    particles: [] as { nodeId: number, parentId: number, progress: number, speed: number }[],
    cursorParticles: [] as { x: number, y: number, life: number, size: number }[],
    lastClickTime: 0, lastClickNodeId: null as number | null,
    frame: 0
  });

  useEffect(() => {
    state.current.particles = connections.map(c => ({
      nodeId: c.targetId,
      parentId: c.sourceId,
      progress: Math.random(),
      speed: 0.002 + Math.random() * 0.005
    }));
  }, [connections]);

  const nodePositions = useMemo(() => {
    const posMap = new Map<number, Vec3>();
    const childrenMap = new Map<number | null, KnowledgeNode[]>();
    allNodes.forEach(n => {
      if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, []);
      childrenMap.get(n.parentId)!.push(n);
    });

    const visited = new Set<number>();
    function place(node: KnowledgeNode, basePos: Vec3, dir: Vec3, depth: number) {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      posMap.set(node.id, basePos);
      const children = childrenMap.get(node.id) || [];
      const radius = 350 + depth * 150;
      children.forEach((child, i) => {
        const childDir = depth === 0 ? fibonacciSphere(i, children.length) : normalize(add(scale(dir, 1.5), fibonacciSphere(i, children.length)));
        place(child, add(basePos, scale(childDir, radius)), childDir, depth + 1);
      });
    }

    const roots = allNodes.filter(n => n.parentId === null);
    roots.forEach((root, i) => {
      const dir = roots.length === 1 ? { x: 0, y: 0, z: 1 } : fibonacciSphere(i, roots.length);
      place(root, scale(dir, roots.length === 1 ? 0 : 400), dir, 0);
    });
    return posMap;
  }, [allNodes]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let rafId: number;

    const render = () => {
      const s = state.current;
      s.frame++;
      
      s.zoom += s.zoomVel;
      s.zoomVel *= 0.85;

      if (!s.isDragging) { 
        s.yaw += s.yawVel; s.pitch += s.pitchVel; 
        s.yawVel *= 0.95; s.pitchVel *= 0.95; 
      }

      // Advanced Physics Simulation: Spring-Mass System with Decay
      const pk = 0.04; // Elastic constant
      const pdamping = 0.82; // Resistance
      
      connections.forEach(conn => {
        const srcId = conn.sourceId, tgtId = conn.targetId;
        const offSrc = s.nodeOffsets[srcId] || {x:0,y:0,z:0};
        const offTgt = s.nodeOffsets[tgtId] || {x:0,y:0,z:0};
        
        const dx = offSrc.x - offTgt.x;
        const dy = offSrc.y - offTgt.y;
        const dz = offSrc.z - offTgt.z;
        
        const vSrc = s.nodeVelocities[srcId] || {x:0,y:0,z:0};
        const vTgt = s.nodeVelocities[tgtId] || {x:0,y:0,z:0};
        
        if (s.targetNodeId !== srcId) {
          s.nodeVelocities[srcId] = { 
            x: vSrc.x - dx * pk, 
            y: vSrc.y - dy * pk, 
            z: vSrc.z - dz * pk 
          };
        }
        if (s.targetNodeId !== tgtId) {
          s.nodeVelocities[tgtId] = { 
            x: vTgt.x + dx * pk, 
            y: vTgt.y + dy * pk, 
            z: vTgt.z + dz * pk 
          };
        }
      });

      allNodes.forEach(node => {
        const id = node.id;
        if (s.isDragging && s.dragMode === "node" && s.targetNodeId === id) return;

        const v = s.nodeVelocities[id] || {x:0,y:0,z:0};
        const o = s.nodeOffsets[id] || {x:0,y:0,z:0};
        
        // Restorative force (pulling back to origin)
        const rx = -o.x * 0.015, ry = -o.y * 0.015, rz = -o.z * 0.015;

        s.nodeVelocities[id] = { 
          x: (v.x + rx) * pdamping, 
          y: (v.y + ry) * pdamping, 
          z: (v.z + rz) * pdamping 
        };
        
        s.nodeOffsets[id] = { 
          x: o.x + s.nodeVelocities[id].x, 
          y: o.y + s.nodeVelocities[id].y, 
          z: o.z + s.nodeVelocities[id].z 
        };
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const accent = isLight ? "#6d28d9" : BACKRONYM_CYAN;
      const cardBg = isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(2, 3, 5, 0.85)";
      const textMain = isLight ? "#1e293b" : "#FFFFFF";

      // Cursor Trail
      if (s.cursorParticles.length < 25) s.cursorParticles.push({ x: mousePos.x, y: mousePos.y, life: 1, size: Math.random() * 3 + 1 });
      s.cursorParticles.forEach((p, i) => { p.life -= 0.03; if (p.life <= 0) s.cursorParticles.splice(i, 1); });
      s.cursorParticles.forEach(p => {
        ctx.globalAlpha = p.life * 0.3; ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      });

      // Neural Particles
      s.particles.forEach(p => { p.progress += p.speed; if (p.progress > 1) p.progress = 0; });

      const nodesProjected = allNodes.map(node => {
        const base = nodePositions.get(node.id) || { x: 0, y: 0, z: 0 };
        const final = add(base, s.nodeOffsets[node.id] || { x: 0, y: 0, z: 0 });
        const rotated = rotateX(rotateY(final, s.yaw), s.pitch);
        const distFromCenter = Math.sqrt(rotated.x**2 + rotated.y**2 + rotated.z**2);
        const zoomWeight = 1 + (distFromCenter / 1200);
        const cameraDist = 2500;
        const perspective = cameraDist / Math.max(50, 2500 + rotated.z + (s.zoom * zoomWeight));
        return { id: node.id, node, x: canvas.width / 2 + rotated.x * perspective + s.offsetX, y: canvas.height / 2 + rotated.y * perspective + s.offsetY, scale: perspective, z: rotated.z, visible: (2500 + rotated.z + s.zoom * zoomWeight) > -300 };
      }).filter(n => n.visible).sort((a, b) => b.z - a.z);

      const projMap = new Map(nodesProjected.map(n => [n.id, n]));
      
      // Draw Connections
      allNodes.forEach(node => {
        if (node.parentId !== null) {
          const src = projMap.get(node.id), tgt = projMap.get(node.parentId);
          if (src && tgt) {
            ctx.globalAlpha = Math.max(0.1, 0.4 * Math.min(src.scale, tgt.scale));
            ctx.beginPath(); ctx.moveTo(src.x, src.y);
            const dx = tgt.x - src.x, dy = tgt.y - src.y, dist = Math.sqrt(dx*dx + dy*dy) || 1;
            const nx = -dy/dist, ny = dx/dist, bend = Math.min(50, dist * 0.15);
            
            const grad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
            grad.addColorStop(0, isLight ? "rgba(109, 40, 217, 0.6)" : "rgba(0, 242, 255, 0.8)");
            grad.addColorStop(1, isLight ? "rgba(139, 92, 246, 0.2)" : "rgba(168, 85, 247, 0.4)");
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(0.5, 2 * Math.min(src.scale, tgt.scale));

            const cpX = (src.x+tgt.x)/2 + nx*bend, cpY = (src.y+tgt.y)/2 + ny*bend;
            ctx.quadraticCurveTo(cpX, cpY, tgt.x, tgt.y);
            ctx.stroke();

            // Flux Particles
            s.particles.filter(p => p.nodeId === node.id && p.parentId === node.parentId).forEach(p => {
              const t = p.progress;
              const px = (1-t)**2 * src.x + 2*(1-t)*t * cpX + t**2 * tgt.x;
              const py = (1-t)**2 * src.y + 2*(1-t)*t * cpY + t**2 * tgt.y;
              ctx.globalAlpha = 1;
              ctx.shadowBlur = 10; ctx.shadowColor = accent;
              ctx.fillStyle = isLight ? accent : "#fff";
              ctx.beginPath(); ctx.arc(px, py, 2 * Math.min(src.scale, tgt.scale), 0, Math.PI*2); ctx.fill();
              ctx.shadowBlur = 0;
            });
          }
        }
      });

      // Draw Nodes
      nodesProjected.forEach(n => {
        const isSelected = selectedNode?.id === n.id, isHov = hoveredNode === n.id;
        const hoverScale = (isHov || isSelected) ? 1.25 : 1.0;
        const currentScale = n.scale * hoverScale;
        
        let gx = 0, gy = 0;
        if (isHov && s.frame % 30 < 3) {
          gx = (Math.random() - 0.5) * 4 * currentScale;
          gy = (Math.random() - 0.5) * 4 * currentScale;
        }

        ctx.globalAlpha = Math.max(0.2, Math.min(1, currentScale * 1.5));
        const cardW = 160 * currentScale, cardH = 80 * currentScale;
        const cx = n.x - cardW / 2 + gx, cy = n.y - cardH / 2 + gy;
        const radius = 6 * currentScale;

        // Chromatic Aberration / Glitch Effect
        if (isHov || isSelected) {
          ctx.strokeStyle = "rgba(255, 0, 80, 0.4)"; ctx.lineWidth = 2 * currentScale;
          ctx.strokeRect(cx - 2, cy, cardW, cardH);
          ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
          ctx.strokeRect(cx + 2, cy, cardW, cardH);
          
          const ringSize = cardW * 0.8;
          ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(s.frame * 0.02);
          ctx.strokeStyle = isLight ? "rgba(0,0,0,0.1)" : "rgba(0, 242, 255, 0.2)";
          ctx.setLineDash([10, 10]);
          ctx.beginPath(); ctx.arc(0, 0, ringSize, 0, Math.PI*2); ctx.stroke();
          ctx.rotate(-s.frame * 0.05);
          ctx.strokeStyle = isLight ? "rgba(109,40,217,0.2)" : "rgba(168, 85, 247, 0.3)";
          ctx.beginPath(); ctx.arc(0, 0, ringSize + 10 * currentScale, 0, Math.PI*1.5); ctx.stroke();
          ctx.restore();
        }

        ctx.beginPath(); ctx.roundRect(cx, cy, cardW, cardH, radius);
        ctx.fillStyle = cardBg; ctx.fill();

        if (isHov || isSelected) { ctx.shadowBlur = 25; ctx.shadowColor = accent; ctx.strokeStyle = accent; ctx.lineWidth = 2 * currentScale; }
        else { ctx.shadowBlur = 5; ctx.shadowColor = isLight ? "rgba(0,0,0,0.05)" : "rgba(0, 242, 255, 0.2)"; ctx.strokeStyle = isLight ? "rgba(0,0,0,0.15)" : "rgba(0, 242, 255, 0.4)"; ctx.lineWidth = 0.5 * currentScale; }
        ctx.stroke(); ctx.shadowBlur = 0;

        const bl = 10 * currentScale; ctx.beginPath();
        ctx.moveTo(cx, cy + bl); ctx.lineTo(cx, cy); ctx.lineTo(cx + bl, cy);
        ctx.moveTo(cx + cardW - bl, cy); ctx.lineTo(cx + cardW, cy); ctx.lineTo(cx + cardW, cy + bl);
        ctx.moveTo(cx, cy + cardH - bl); ctx.lineTo(cx, cy + cardH); ctx.lineTo(cx + bl, cy + cardH);
        ctx.moveTo(cx + cardW - bl, cy + cardH); ctx.lineTo(cx + cardW, cy + cardH); ctx.lineTo(cx + cardW, cy + cardH - bl);
        ctx.strokeStyle = isHov || isSelected ? (isLight ? "#000" : "#fff") : (isLight ? "rgba(0,0,0,0.3)" : "rgba(0, 242, 255, 0.7)"); ctx.lineWidth = 1 * currentScale; ctx.stroke();

        if (currentScale > 0.45) {
          const padding = 12 * currentScale;
          const maxTextWidth = cardW - padding * 2;
          
          ctx.fillStyle = isHov || isSelected ? (isLight ? "#000" : "#fff") : (isLight ? "#1e293b" : "rgba(0, 242, 255, 0.9)"); 
          ctx.font = `bold ${Math.floor(11 * currentScale)}px sans-serif`; ctx.textAlign = "left";
          const titleLines = wrapText(ctx, n.node.title, maxTextWidth).slice(0, 2);
          titleLines.forEach((line, i) => {
            ctx.fillText(line, cx + padding, cy + (18 + i * 14) * currentScale);
          });

          ctx.fillStyle = isLight ? "rgba(0,0,0,0.4)" : "rgba(255, 255, 255, 0.5)"; ctx.font = `${Math.floor(7 * currentScale)}px monospace`;
          ctx.fillText(`AUTH: SYSTEM | ${new Date(n.node.createdAt).toLocaleDateString()}`, cx + padding, cy + 48 * currentScale);
          
          ctx.fillStyle = isLight ? "rgba(0,0,0,0.6)" : "rgba(255, 255, 255, 0.7)"; ctx.font = `${Math.floor(9 * currentScale)}px sans-serif`;
          const desc = n.node.description || (n.node.content ? n.node.content.slice(0, 60) : "No data");
          const descLines = wrapText(ctx, desc, maxTextWidth).slice(0, 2);
          descLines.forEach((line, i) => {
            const yPos = cy + (62 + i * 11) * currentScale;
            if (yPos < cy + cardH - padding / 2) ctx.fillText(line, cx + padding, yPos);
          });
        } else {
           ctx.fillStyle = accent; ctx.font = `bold ${Math.floor(16 * currentScale)}px sans-serif`; ctx.textAlign = "center";
           ctx.fillText(extractKeyword(n.node.title), n.x, n.y + 5 * currentScale);
        }
      });
      rafId = requestAnimationFrame(render);
    };
    render(); return () => cancelAnimationFrame(rafId);
  }, [allNodes, nodePositions, hoveredNode, selectedNode, mousePos, isLight, connections]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const s = state.current, rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let hitId = null;
    const nodesSortedByDepth = allNodes.map(node => {
      const base = nodePositions.get(node.id) || {x:0,y:0,z:0};
      const final = add(base, s.nodeOffsets[node.id] || {x:0,y:0,z:0});
      const rotated = rotateX(rotateY(final, s.yaw), s.pitch);
      const distFromCenter = Math.sqrt(rotated.x**2 + rotated.y**2 + rotated.z**2);
      const zoomWeight = 1 + (distFromCenter / 1200);
      const perspective = 2500 / Math.max(50, 2500 + rotated.z + s.zoom * zoomWeight);
      return { id: node.id, x: rect.width/2 + rotated.x*perspective + s.offsetX, y: rect.height/2 + rotated.y*perspective + s.offsetY, z: rotated.z, perspective };
    }).sort((a, b) => a.z - b.z);

    for (const n of nodesSortedByDepth) {
      const hitRadius = n.perspective > 0.4 ? 80 * n.perspective : 30 * n.perspective;
      if (Math.sqrt((mx-n.x)**2 + (my-n.y)**2) < hitRadius) { hitId = n.id; break; }
    }

    const now = Date.now();
    const isDoubleClick = now - s.lastClickTime < 300 && s.lastClickNodeId === hitId && hitId !== null;
    s.lastClickTime = now; s.lastClickNodeId = hitId;
    if (isDoubleClick && hitId !== null) { onNodeSelect(allNodes.find(n => n.id === hitId)!); return; }

    if (hitId !== null) { s.isDragging = true; s.lastX = e.clientX; s.lastY = e.clientY; s.dragMode = "node"; s.targetNodeId = hitId; }
    else { s.isDragging = true; s.lastX = e.clientX; s.lastY = e.clientY; s.dragMode = e.button === 1 ? "pan" : "rotate"; }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = state.current; setMousePos({ x: e.clientX, y: e.clientY });
    if (s.isDragging) {
      const dx = e.clientX - s.lastX, dy = e.clientY - s.lastY; s.lastX = e.clientX; s.lastY = e.clientY;
      if (s.dragMode === "rotate") { s.yawVel = dx * 0.005; s.pitchVel = dy * 0.005; s.yaw += s.yawVel; s.pitch += s.pitchVel; }
      else if (s.dragMode === "pan") { s.offsetX += dx; s.offsetY += dy; }
      else if (s.dragMode === "node" && s.targetNodeId !== null) {
        const moveScale = 1.5;
        const moveX = rotateY({ x: dx * moveScale, y: 0, z: 0 }, -s.yaw), moveY = rotateX({ x: 0, y: dy * moveScale, z: 0 }, -s.pitch);
        s.nodeOffsets[s.targetNodeId] = add(s.nodeOffsets[s.targetNodeId] || {x:0,y:0,z:0}, add(moveX, moveY));
      }
    } else {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let foundId = null;
      for (const node of allNodes) {
        const base = nodePositions.get(node.id) || {x:0,y:0,z:0};
        const final = add(base, s.nodeOffsets[node.id] || {x:0,y:0,z:0});
        const rotated = rotateX(rotateY(final, s.yaw), s.pitch);
        const distFromCenter = Math.sqrt(rotated.x**2 + rotated.y**2 + rotated.z**2);
        const zoomWeight = 1 + (distFromCenter / 1200);
        const perspective = 2500 / Math.max(50, 2500 + rotated.z + s.zoom * zoomWeight);
        const px = rect.width/2 + rotated.x*perspective + s.offsetX, py = rect.height/2 + rotated.y*perspective + s.offsetY;
        const hitRadius = perspective > 0.4 ? 80 * perspective : 30 * perspective;
        if (Math.sqrt((mx-px)**2 + (my-py)**2) < hitRadius) { foundId = node.id; break; }
      }
      setHoveredNode(foundId);
    }
  };

  useEffect(() => {
    const upd = () => { setViewport({ width: window.innerWidth, height: window.innerHeight }); };
    upd(); window.addEventListener("resize", upd);
    const stp = () => { state.current.isDragging = false; };
    window.addEventListener("pointerup", stp);
    return () => { window.removeEventListener("resize", upd); window.removeEventListener("pointerup", stp); };
  }, []);

  return (
    <div ref={containerRef} className={`fixed inset-0 w-full h-full ${isLight ? "bg-[#F8FAFC]" : "bg-[#020305]"} overflow-hidden touch-none cursor-none z-0 transition-colors duration-700`}>
      <canvas ref={canvasRef} width={viewport.width} height={viewport.height} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onWheel={e => { e.preventDefault(); state.current.zoomVel = e.deltaY * 0.5; }} onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, nodeId: null, level: 1 }); }} className="block w-full h-full" />
      
      {/* HUD Cursor */}
      <div className="pointer-events-none fixed z-[999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75" style={{ left: mousePos.x, top: mousePos.y }}>
        <div className={`relative w-8 h-8 border ${isLight ? "border-slate-400" : "border-cyan-500/30"} rounded-full flex items-center justify-center transition-all ${hoveredNode ? "scale-150" : "scale-100"}`}>
           <div className={`absolute w-full h-[1px] ${isLight ? "bg-slate-300" : "bg-cyan-500/20"}`} />
           <div className={`absolute w-[1px] h-full ${isLight ? "bg-slate-300" : "bg-cyan-500/20"}`} />
           {hoveredNode && <div className={`absolute inset-0 border-2 ${isLight ? "border-slate-400" : "border-cyan-400"} animate-ping opacity-20`} />}
           <div className={`w-1 h-1 ${isLight ? "bg-slate-800" : "bg-cyan-400"} rounded-full`} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(${isLight ? "#64748b" : "#00f2ff"} 1px, transparent 1px), linear-gradient(90deg, ${isLight ? "#64748b" : "#00f2ff"} 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      {!isLight && <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, cyan 3px)" }} />}

      <div className={`absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 ${isLight ? "border-slate-300" : "border-cyan-500/30"} pointer-events-none`} />
      <div className={`absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 ${isLight ? "border-slate-300" : "border-cyan-500/30"} pointer-events-none`} />
      <div className={`absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 ${isLight ? "border-slate-300" : "border-cyan-500/30"} pointer-events-none`} />
      <div className={`absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 ${isLight ? "border-slate-300" : "border-cyan-500/30"} pointer-events-none`} />

      <div className={`pointer-events-auto absolute top-12 left-12 w-64 p-4 ${isLight ? "bg-white/80" : "bg-black/40"} backdrop-blur-md border ${isLight ? "border-slate-200" : "border-white/5"} shadow-2xl`}>
         <HUD_Bracket pos="tl" isLight={isLight} /><HUD_Bracket pos="tr" isLight={isLight} /><HUD_Bracket pos="bl" isLight={isLight} /><HUD_Bracket pos="br" isLight={isLight} />
         <div className={`flex items-center gap-3 mb-4 border-b ${isLight ? "border-slate-100" : "border-white/5"} pb-2`}><Activity className={`h-3 w-3 ${isLight ? "text-purple-600" : "text-cyan-400"} animate-pulse`} /><div className={`text-[9px] font-black uppercase tracking-[0.3em] ${isLight ? "text-slate-800" : "text-cyan-400/80"}`}>NEURAL_SYNC</div></div>
         <div className={`space-y-1 font-mono text-[7px] ${isLight ? "text-slate-500" : "text-white/30"} uppercase tracking-widest`}>
            <div className="flex justify-between"><span>NODES:</span> <span className={isLight ? "text-purple-700" : "text-cyan-400"}>{allNodes.length}</span></div>
            <div className="flex justify-between"><span>LINKS:</span> <span className={isLight ? "text-purple-700" : "text-cyan-400"}>{connections.length}</span></div>
            <div className="flex justify-between"><span>STATE:</span> <span className="text-green-500">NOMINAL</span></div>
         </div>
      </div>

      <div className={`pointer-events-none absolute bottom-12 right-12 flex gap-10 items-center p-3 ${isLight ? "bg-white/80" : "bg-black/40"} backdrop-blur-md border ${isLight ? "border-slate-200" : "border-white/5"} text-[7px] font-black ${isLight ? "text-slate-500" : "text-white/30"} uppercase tracking-[0.4em]`}>
        <div className="flex items-center gap-2"><MousePointer2 className="h-2.5 w-2.5" /> [DRAG] Navigate</div>
        <div className="flex items-center gap-2"><Zap className={`h-2.5 w-2.5 ${isLight ? "text-purple-600" : "text-cyan-400"}`} /> Interaction_Active</div>
      </div>

      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: "fixed", left: contextMenu.x, top: contextMenu.y }} className={`z-[100] min-w-[160px] ${isLight ? "bg-white" : "bg-black"} border ${isLight ? "border-slate-200" : "border-cyan-500/30"} p-1 shadow-2xl`}>
            <button className={`flex w-full items-center gap-3 px-4 py-2 text-[9px] font-black ${isLight ? "text-slate-800 hover:bg-slate-50" : "text-cyan-400 hover:bg-cyan-500/10"} transition-all uppercase tracking-widest`} onClick={() => { setManualAdd({ parentId: contextMenu.nodeId, level: contextMenu.level }); setContextMenu(null); }}><Plus className="h-3 w-3" /> APPEND_DAT</button>
            {!contextMenu.nodeId && <button className={`flex w-full items-center gap-3 px-4 py-2 text-[9px] font-black ${isLight ? "text-purple-600 hover:bg-slate-50" : "text-purple-400 hover:bg-purple-500/10"} transition-all uppercase tracking-widest`} onClick={() => { onAddNode(); setContextMenu(null); }}><Sparkles className="h-3 w-3" /> NEURAL_RUN</button>}
          </motion.div>
        )}
      </AnimatePresence>
      <AddNodeDialog open={!!manualAdd} onOpenChange={o => { if (!o) setManualAdd(null); }} parentId={manualAdd?.parentId ?? null} level={manualAdd?.level ?? 1} />
    </div>
  );
}
