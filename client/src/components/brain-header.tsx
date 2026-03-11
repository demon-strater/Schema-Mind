import { Brain, Zap, Network, LayoutGrid, GitBranch, Sparkles } from "lucide-react";
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
    <header className="relative overflow-hidden border-b border-border/50" data-testid="brain-header">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight" data-testid="text-app-title">
                SchemaMind
              </h1>
              <p className="text-[11px] text-muted-foreground">Digital Brain · 8-Level Knowledge</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onViewModeChange && (
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/50">
                <button
                  onClick={() => onViewModeChange("mindmap")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === "mindmap"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-view-mindmap"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mind Map</span>
                </button>
                <button
                  onClick={() => onViewModeChange("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-view-grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            )}

            {onOpenAnalyze && (
              <button
                onClick={onOpenAnalyze}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-sm"
                data-testid="button-open-analyze"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI 분석</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium" data-testid="text-total-nodes">{totalNodes}</span>
                <span className="text-xs">nodes</span>
              </div>
              <button
                onClick={onOpenConnections}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-open-connections"
              >
                <Network className="w-3.5 h-3.5 text-chart-2" />
                <span className="font-medium" data-testid="text-connections">{connectionCount}</span>
                <span className="text-xs">links</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
