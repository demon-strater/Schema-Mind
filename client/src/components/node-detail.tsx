import { type KnowledgeNode, type Connection, LEVEL_NAMES, LEVEL_COLORS } from "@shared/schema";
import { motion } from "framer-motion";
import { X, Trash2, Network, Clock } from "lucide-react";
import { format } from "date-fns";

interface NodeDetailProps {
  node: KnowledgeNode;
  connections: Connection[];
  allNodes: KnowledgeNode[];
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function NodeDetail({ node, connections, allNodes, onClose, onDelete, isDeleting }: NodeDetailProps) {
  const levelColor = node.color || LEVEL_COLORS[node.level] || LEVEL_COLORS[0];

  const connectedNodes = connections.map((c) => {
    const otherId = c.sourceId === node.id ? c.targetId : c.sourceId;
    const otherNode = allNodes.find((n) => n.id === otherId);
    return { connection: c, node: otherNode };
  }).filter((cn) => cn.node);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed top-0 right-0 w-full sm:w-[420px] h-full bg-card border-l border-border z-50 overflow-y-auto"
      data-testid="node-detail-panel"
    >
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: levelColor }}
            />
            <span className="text-xs font-mono text-muted-foreground">
              {LEVEL_NAMES[node.level]} · L{node.level}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-close-detail"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div
          className="w-full h-1 rounded-full mb-6"
          style={{
            background: `linear-gradient(90deg, ${levelColor}, transparent)`,
          }}
        />

        <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-detail-title">
          {node.title}
        </h2>

        {node.description && (
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {node.description}
          </p>
        )}

        {node.content && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Content
            </h4>
            <div className="bg-muted/30 rounded-lg p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap border border-border/50">
              {node.content}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Clock className="w-3.5 h-3.5" />
          <span>Created {format(new Date(node.createdAt), "PPP")}</span>
        </div>

        {connectedNodes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" />
              Connections ({connectedNodes.length})
            </h4>
            <div className="space-y-2">
              {connectedNodes.map(({ connection, node: otherNode }) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                  data-testid={`connection-${connection.id}`}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: LEVEL_COLORS[otherNode!.level] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {otherNode!.title}
                    </p>
                    {connection.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {connection.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                    L{otherNode!.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
            data-testid="button-delete-node"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete Node"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
