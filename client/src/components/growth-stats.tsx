import { LEVEL_NAMES, LEVEL_COLORS } from "@shared/schema";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface GrowthStatsProps {
  stats?: { totalNodes: number; levelCounts: Record<number, number>; connectionCount: number };
}

export function GrowthStats({ stats }: GrowthStatsProps) {
  if (!stats || stats.totalNodes === 0) return null;

  const maxCount = Math.max(...Object.values(stats.levelCounts), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-4 rounded-xl bg-card border border-card-border"
      data-testid="growth-stats"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Knowledge Growth</h4>
        <span className="text-xs text-muted-foreground ml-auto">
          {stats.totalNodes} total nodes
        </span>
      </div>

      <div className="flex items-end gap-1 h-16">
        {LEVEL_NAMES.map((name, i) => {
          const count = stats.levelCounts[i] || 0;
          const height = count > 0 ? Math.max((count / maxCount) * 100, 8) : 4;

          return (
            <div
              key={name}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="w-full rounded-t-sm min-h-[2px]"
                style={{
                  background: count > 0
                    ? `linear-gradient(to top, ${LEVEL_COLORS[i]}, ${LEVEL_COLORS[i]}88)`
                    : "hsl(var(--muted))",
                  opacity: count > 0 ? 0.5 + (count / maxCount) * 0.5 : 0.3,
                }}
              />
              <span className="text-[9px] font-mono text-muted-foreground leading-none">
                {name.substring(0, 3)}
              </span>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] text-foreground bg-popover px-1.5 py-0.5 rounded shadow-sm border border-border whitespace-nowrap">
                  {name}: {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
