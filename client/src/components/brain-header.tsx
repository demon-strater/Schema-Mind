import { Brain, Zap, Network, LayoutGrid, GitBranch, Sparkles, Activity, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { TEAM_MEMBERS } from "@/lib/team-mode";

interface BrainHeaderProps {
  stats?: { totalNodes: number; levelCounts: Record<number, number>; connectionCount: number };
  onOpenConnections: () => void;
  viewMode?: "mindmap" | "grid";
  onViewModeChange?: (mode: "mindmap" | "grid") => void;
  onOpenAnalyze?: () => void;
  teamMode?: boolean;
  teamMemberIndex?: number;
  onTeamModeToggle?: () => void;
  onTeamMemberChange?: (index: number) => void;
}

export function BrainHeader({ stats, onOpenConnections, viewMode = "mindmap", onViewModeChange, onOpenAnalyze, teamMode = false, teamMemberIndex = 0, onTeamModeToggle, onTeamMemberChange }: BrainHeaderProps) {
  const totalNodes = stats?.totalNodes ?? 0;
  const connectionCount = stats?.connectionCount ?? 0;

  return (
    <header className="fixed top-0 left-0 w-full z-[40] pointer-events-none" data-testid="brain-header">
      <div className="max-w-[100vw] mx-auto px-4 py-4 sm:px-6 sm:py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        {/* Left HUD: Title & Stats */}
        <div className="flex min-w-0 flex-col gap-1 pointer-events-auto group">
          <div className="flex items-center gap-3">
             <div className="w-1 h-8 bg-current opacity-20" />
             <div className="min-w-0">
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
        <div className="flex w-full flex-col items-stretch gap-3 pointer-events-auto sm:w-auto sm:items-end">
          {onOpenAnalyze && (
            <button
              onClick={onOpenAnalyze}
              className="min-h-9 px-4 sm:px-6 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] hover:scale-[1.02] transition-transform active:scale-95 whitespace-nowrap"
              data-testid="button-open-analyze"
            >
              [ Run_AI_Analysis ]
            </button>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            {onViewModeChange && (
              <div className="flex min-h-9 shrink-0 border border-foreground/10 bg-background/40 backdrop-blur-xl">
                <button
                  onClick={() => onViewModeChange("mindmap")}
                  className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    viewMode === "mindmap" ? "bg-foreground text-background" : "text-foreground/40 hover:text-foreground"
                  }`}
                  data-testid="button-view-mindmap"
                >
                  Graph
                </button>
                <button
                  onClick={() => onViewModeChange("grid")}
                  className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
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
              className="min-h-9 px-4 py-2 border border-foreground/10 bg-background/40 backdrop-blur-xl text-[9px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all whitespace-nowrap"
              data-testid="button-open-connections"
            >
              Connections
            </button>
            {onTeamModeToggle && (
              <button
                onClick={onTeamModeToggle}
                className={`inline-flex min-h-9 items-center gap-2 px-4 py-2 border text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  teamMode
                    ? "border-amber-400/60 bg-amber-400/15 text-amber-500"
                    : "border-foreground/10 bg-background/40 text-foreground/40 hover:text-foreground"
                } backdrop-blur-xl`}
                data-testid="button-team-mode"
              >
                <Users className="h-3.5 w-3.5" />
                Team
              </button>
            )}
            <ThemeToggle />
          </div>
          {teamMode && onTeamMemberChange && (
            <div className="flex flex-wrap justify-end gap-2">
              {TEAM_MEMBERS.map((member, index) => (
                <button
                  key={member.name}
                  onClick={() => onTeamMemberChange(index)}
                  className={`flex min-h-8 items-center gap-2 border px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${
                    teamMemberIndex === index ? "border-foreground text-foreground" : "border-foreground/10 text-foreground/40"
                  } bg-background/40 backdrop-blur-xl`}
                  data-testid={`button-team-member-${member.name.toLowerCase()}`}
                >
                  <span className="h-2.5 w-2.5" style={{ backgroundColor: member.color }} />
                  Member_{member.name}
                </button>
              ))}
            </div>
          )}
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
