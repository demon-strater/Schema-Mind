import { type KnowledgeNode, LEVEL_NAMES, LEVEL_COLORS } from "@shared/schema";
import { motion } from "framer-motion";
import {
  Brain, Globe, Layers, BookOpen, Lightbulb, FileText, Link, Database,
  ChevronRight, MoreHorizontal
} from "lucide-react";
import { useMemo } from "react";

const ICON_MAP: Record<string, any> = {
  Brain, Globe, Layers, BookOpen, Lightbulb, FileText, Link, Database
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8"
      data-testid="node-grid"
    >
      {nodes.map((node, index) => {
        const isSelected = selectedNode?.id === node.id;
        const IconComponent = ICON_MAP[node.icon || "Brain"] || Brain;
        const levelColor = node.color || LEVEL_COLORS[node.level] || LEVEL_COLORS[0];
        const children = childCounts[node.id] || 0;
        const density = Math.min(children / 5, 1);

        return (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            onClick={() => onNodeClick(node)}
            className={`relative group cursor-pointer rounded-xl border transition-all duration-200 ${
              isSelected
                ? "border-primary ring-2 ring-primary/20 bg-card"
                : "border-card-border bg-card hover:border-primary/30"
            }`}
            data-testid={`card-node-${node.id}`}
          >
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div
                className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, ${levelColor}, ${levelColor}88)`,
                  opacity: 0.6 + density * 0.4,
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${levelColor}, transparent 70%)`,
                }}
              />
            </div>

            <div className="relative p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${levelColor}15`,
                    border: `1px solid ${levelColor}25`,
                  }}
                >
                  <IconComponent
                    className="w-5 h-5"
                    style={{ color: levelColor }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    L{node.level}
                  </span>
                  {node.level < 7 && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {children} sub
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-foreground text-base mb-1.5 line-clamp-1" data-testid={`text-node-title-${node.id}`}>
                {node.title}
              </h3>
              {node.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {node.description}
                </p>
              )}
              {!node.description && (
                <p className="text-sm text-muted-foreground/50 mb-4 italic">
                  No description
                </p>
              )}

              {children > 0 && (
                <div className="mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(Math.min(children, 8))].map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full"
                        style={{
                          background: levelColor,
                          opacity: 0.3 + (i / 8) * 0.5,
                        }}
                      />
                    ))}
                    {children < 8 &&
                      [...Array(8 - Math.min(children, 8))].map((_, i) => (
                        <div key={`e-${i}`} className="h-1 flex-1 rounded-full bg-muted" />
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto">
                <span className="text-[11px] text-muted-foreground">
                  {LEVEL_NAMES[node.level]}
                </span>
                {node.level < 7 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomIn(node);
                    }}
                    className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    data-testid={`button-zoom-${node.id}`}
                  >
                    Zoom In
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
