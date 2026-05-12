import { Brain, Zap, Network, LayoutGrid, GitBranch, Sparkles, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface BrainHeaderProps {
  stats?: { totalNodes: number; levelCounts: Record<number, number>; connectionCount: number };
  onOpenConnections: () => void;
  viewMode?: "mindmap" | "grid";
  onViewModeChange?: (mode: "mindmap" | "grid") => void;
  onOpenAnalyze?: () => void;
}

export function BrainHeader({ stats, onOpenConnections, viewMode = "mindmap", onViewModeChange, onOpenAnalyze }: BrainHeaderProps) {
  const totalNodes = stats?.totalNodes ?? 0;
  const connectionCount = stats?.connectionCount ?? 0;

  return (
    <header className="fixed top-0 left-0 w-full z-[40] pointer-events-none" data-testid="brain-header">
      <div className="max-w-[100vw] mx-auto px-6 py-6 flex justify-between items-start">
        {/* Left HUD: Title & Stats */}
        <div className="flex flex-col gap-1 pointer-events-auto group">
          <div className="flex items-center gap-3">
             <div className="w-1 h-8 bg-current opacity-20" />
             <div>
                <h1 className="text-2xl font-black uppercase tracking-[-0.02em] leading-none text-foreground" data-testid="text-app-title">
                  SchemaMind
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Activity className="w-3 h-3 opacity-40 animate-pulse" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40">Operational_v1.0.4</span>
                </div>
             </div>
          </div>
          
          <div className="mt-6 space-y-1 font-mono text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             <div className="flex justify-between w-32 border-b border-foreground/5 pb-1"><span>Nodes:</span> <span className="font-bold">{totalNodes}</span></div>
             <div className="flex justify-between w-32 border-b border-foreground/5 pb-1"><span>Links:</span> <span className="font-bold">{connectionCount}</span></div>
             <div className="flex justify-between w-32"><span>Latency:</span> <span className="text-green-500">14ms</span></div>
          </div>
        </div>

        {/* Right HUD: Controls */}
        <div className="flex flex-col items-end gap-4 pointer-events-auto">
          {onOpenAnalyze && (
            <button
              onClick={onOpenAnalyze}
              className="px-6 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform active:scale-95"
              data-testid="button-open-analyze"
            >
              [ Run_AI_Analysis ]
            </button>
          )}

          <div className="flex gap-2">
            {onViewModeChange && (
              <div className="flex border border-foreground/10 bg-background/40 backdrop-blur-xl">
                <button
                  onClick={() => onViewModeChange("mindmap")}
                  className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${
                    viewMode === "mindmap" ? "bg-foreground text-background" : "text-foreground/40 hover:text-foreground"
                  }`}
                  data-testid="button-view-mindmap"
                >
                  Graph
                </button>
                <button
                  onClick={() => onViewModeChange("grid")}
                  className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${
                    viewMode === "grid" ? "bg-foreground text-background" : "text-foreground/40 hover:text-foreground"
                  }`}
                  data-testid="button-view-grid"
                >
                  Grid
                </button>
              </div>
            )}
            
            <button
              onClick={onOpenConnections}
              className="px-4 py-2 border border-foreground/10 bg-background/40 backdrop-blur-xl text-[9px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all"
              data-testid="button-open-connections"
            >
              Connections
            </button>
          </div>
        </div>
      </div>

      {/* Viewport Frame Brackets */}
      <div className="fixed top-4 left-4 w-12 h-12 border-t border-l border-foreground/10 pointer-events-none" />
      <div className="fixed top-4 right-4 w-12 h-12 border-t border-r border-foreground/10 pointer-events-none" />
      <div className="fixed bottom-4 left-4 w-12 h-12 border-b border-l border-foreground/10 pointer-events-none" />
      <div className="fixed bottom-4 right-4 w-12 h-12 border-b border-r border-foreground/10 pointer-events-none" />
    </header>
  );
}
