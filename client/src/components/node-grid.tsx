import { type KnowledgeNode, LEVEL_NAMES, LEVEL_COLORS } from "@shared/schema";
import { motion } from "framer-motion";
import {
  Brain, Globe, Layers, BookOpen, Lightbulb, FileText, Link, Database,
  ChevronRight, Sparkles, ArrowUpRight
} from "lucide-react";
import { useMemo } from "react";

const ICON_MAP: Record<string, any> = {
  Brain, Globe, Layers, BookOpen, Lightbulb, FileText, Link, Database, Sparkles
};

interface NodeGridProps {
  nodes: KnowledgeNode[];
  currentLevel: number;
  selectedNode: KnowledgeNode | null;
  onNodeClick: (node: KnowledgeNode) => void;
  onZoomIn: (node: KnowledgeNode) => void;
  allNodes: KnowledgeNode[];
}

export function NodeGrid({ nodes, currentLevel, selectedNode, onNodeClick, onZoomIn, allNodes }: NodeGridProps) {
  const childCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    nodes.forEach((node) => {
      counts[node.id] = allNodes.filter((n) => n.parentId === node.id).length;
    });
    return counts;
  }, [nodes, allNodes]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10"
      data-testid="node-grid"
    >
      {nodes.map((node, index) => {
        const isSelected = selectedNode?.id === node.id;
        const IconComponent = ICON_MAP[node.icon || "Brain"] || Brain;
        const levelColor = node.color || LEVEL_COLORS[node.level] || LEVEL_COLORS[0];
        const children = childCounts[node.id] || 0;

        return (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.04, 
              duration: 0.5, 
              ease: [0.23, 1, 0.32, 1] 
            }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => onNodeClick(node)}
            className={`group relative flex flex-col cursor-pointer rounded-[32px] p-6 transition-all duration-300 ${
              isSelected
                ? "bg-white dark:bg-[#1a1c20] ring-2 ring-primary shadow-2xl"
                : "bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-black/5 dark:border-white/5 shadow-lg hover:shadow-2xl"
            } backdrop-blur-xl overflow-hidden`}
            data-testid={`card-node-${node.id}`}
          >
            {/* Background Accent */}
            <div 
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-[0.08] transition-opacity group-hover:opacity-[0.15]"
              style={{ backgroundColor: levelColor }}
            />

            <div className="flex items-start justify-between mb-6">
              <div
                className="w-12 h-12 rounded-[18px] flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 duration-300"
                style={{
                  background: `linear-gradient(135deg, ${levelColor}22 0%, ${levelColor}11 100%)`,
                  border: `1px solid ${levelColor}33`,
                }}
              >
                <IconComponent className="w-6 h-6" style={{ color: levelColor }} />
              </div>
              
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5">
                    Layer {node.level}
                  </span>
                </div>
                {children > 0 && (
                  <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                    {children} Connections
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight group-hover:text-primary transition-colors" data-testid={`text-node-title-${node.id}`}>
              {node.title}
            </h3>
            
            {node.description ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed flex-grow">
                {node.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500/50 mb-6 italic flex-grow">
                No description available for this node.
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-slate-400">Classification</span>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                  {LEVEL_NAMES[node.level]}
                </span>
              </div>
              
              {node.level < 7 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onZoomIn(node);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 dark:bg-white/10 text-white dark:text-slate-100 transition-all hover:bg-primary dark:hover:bg-primary hover:scale-110 active:scale-95 shadow-lg"
                  data-testid={`button-zoom-${node.id}`}
                  title="Deep Explore"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Visual Indicators of child density */}
            {children > 0 && (
              <div className="absolute bottom-0 left-0 w-full h-1 flex gap-[2px] opacity-30">
                {[...Array(Math.min(children, 12))].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-full flex-grow first:rounded-bl-full last:rounded-br-full"
                    style={{ backgroundColor: levelColor }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
