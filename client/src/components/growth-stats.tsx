import { LEVEL_NAMES, LEVEL_COLORS } from "@shared/schema";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3 } from "lucide-react";

interface GrowthStatsProps {
  stats?: { totalNodes: number; levelCounts: Record<number, number>; connectionCount: number };
}

export function GrowthStats({ stats }: GrowthStatsProps) {
  if (!stats || stats.totalNodes === 0) return null;

  const maxCount = Math.max(...Object.values(stats.levelCounts), 1);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-4 left-4 z-30 hidden w-80 max-w-[calc(100vw-2rem)] bg-background/40 p-6 shadow-2xl backdrop-blur-3xl border border-foreground/5 group sm:block lg:bottom-12 lg:left-12"
      data-testid="growth-stats"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
           <BarChart3 className="w-4 h-4 text-foreground/40" />
           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Network_Growth</h4>
        </div>
        <span className="text-[9px] font-mono text-foreground/30">{stats.totalNodes} UNITS</span>
      </div>

      <div className="flex items-end gap-1.5 h-20 mb-4">
        {LEVEL_NAMES.map((name, i) => {
          const count = stats.levelCounts[i] || 0;
          const height = count > 0 ? Math.max((count / maxCount) * 100, 4) : 2;

          return (
            <div
              key={name}
              className="flex-1 flex flex-col items-center gap-2 group/bar relative"
            >
              <div className="w-full flex-1 flex flex-col justify-end bg-foreground/[0.02]">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.05, duration: 0.8, ease: "circOut" }}
                  className="w-full bg-foreground/20 group-hover/bar:bg-foreground/40 transition-colors"
                />
              </div>
              <span className="text-[7px] font-black text-foreground/20 uppercase tracking-tighter">
                L{i}
              </span>
              
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover/bar:scale-100">
                <div className="bg-foreground text-background px-2 py-1 text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                   {name}: {count}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-foreground/5">
         <div className="flex justify-between items-center opacity-40">
            <span className="text-[7px] font-black uppercase tracking-widest">Connectivity_Ratio</span>
            <span className="text-[9px] font-mono">{(stats.connectionCount / stats.totalNodes).toFixed(2)}x</span>
         </div>
      </div>
    </motion.div>
  );
}
