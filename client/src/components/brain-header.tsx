import { Brain, Zap, Network } from "lucide-react";
import { motion } from "framer-motion";

interface BrainHeaderProps {
  stats?: { totalNodes: number; levelCounts: Record<number, number>; connectionCount: number };
  onOpenConnections: () => void;
}

export function BrainHeader({ stats, onOpenConnections }: BrainHeaderProps) {
  const totalNodes = stats?.totalNodes ?? 0;
  const connectionCount = stats?.connectionCount ?? 0;

  return (
    <header className="relative overflow-hidden border-b border-border/50" data-testid="brain-header">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="relative"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight" data-testid="text-app-title">
                SchemaMind
              </h1>
              <p className="text-xs text-muted-foreground">Digital Brain · 8-Level Knowledge</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-medium" data-testid="text-total-nodes">{totalNodes}</span>
                <span>nodes</span>
              </div>
              <button
                onClick={onOpenConnections}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-open-connections"
              >
                <Network className="w-4 h-4 text-chart-2" />
                <span className="font-medium" data-testid="text-connections">{connectionCount}</span>
                <span>links</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
