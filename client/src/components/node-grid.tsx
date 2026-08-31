import { type KnowledgeNode, LEVEL_NAMES, LEVEL_COLORS } from "@shared/schema";
import { motion } from "framer-motion";
import {
  Brain, Globe, Layers, BookOpen, Lightbulb, FileText, Link, Database,
  ChevronRight, Sparkles, ArrowUpRight, ArrowRight
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
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 border-t border-l border-foreground/10 mt-10"
      data-testid="node-grid"
    >
      {nodes.map((node, index) => {
        const isSelected = selectedNode?.id === node.id;
        const levelColor = node.color || LEVEL_COLORS[node.level] || LEVEL_COLORS[0];
        const children = childCounts[node.id] || 0;

        return (
          <motion.div
            key={node.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => onNodeClick(node)}
            className={`group relative flex flex-col cursor-pointer p-10 border-r border-b border-foreground/10 transition-all duration-500 ${
              isSelected ? "bg-foreground text-background" : "bg-transparent hover:bg-foreground/[0.02]"
            }`}
            data-testid={`card-node-${node.id}`}
          >
            <div className="flex items-start justify-between mb-12">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                Layer_0{node.level} // {LEVEL_NAMES[node.level]}
              </div>
              <div className="text-[10px] font-mono opacity-20">ID_0{node.id}</div>
            </div>

            <div className="flex-grow space-y-6">
               <h3 className={`text-4xl font-black uppercase tracking-tighter leading-[0.9] break-words transition-colors ${isSelected ? "text-background" : "text-foreground"}`} data-testid={`text-node-title-${node.id}`}>
                 {node.title}
               </h3>
               
               <p className={`text-sm font-medium leading-relaxed max-w-xs transition-colors ${isSelected ? "text-background/60" : "text-foreground/60"}`}>
                 {node.description || "NO_DESCRIPTION_DATA_LOGGED"}
               </p>
            </div>

            <div className="mt-16 flex items-center justify-between">
               <div className="flex gap-4 items-center">
                  <div className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? "text-background/40" : "text-foreground/40"}`}>
                    Connections: <span className={isSelected ? "text-background" : "text-foreground"}>{children}</span>
                  </div>
               </div>
               
               {node.level < 7 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onZoomIn(node);
                  }}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    isSelected ? "text-background hover:translate-x-2" : "text-foreground hover:translate-x-2"
                  }`}
                  data-testid={`button-zoom-${node.id}`}
                >
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
