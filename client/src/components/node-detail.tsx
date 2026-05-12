import { type KnowledgeNode, type Connection, LEVEL_NAMES, LEVEL_COLORS, LEVEL_LABELS_KO } from "@shared/schema";
import { motion } from "framer-motion";
import { X, Trash2, Network, Clock, Layers3, Activity } from "lucide-react";
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

  const connectedNodes = connections
    .map((c) => {
      const otherId = c.sourceId === node.id ? c.targetId : c.sourceId;
      const otherNode = allNodes.find((n) => n.id === otherId);
      return { connection: c, node: otherNode };
    })
    .filter((cn) => cn.node);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#020305]/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,242,255,0.15)] rounded-none overflow-hidden"
      >
        {/* HUD Brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

        <div className="flex-shrink-0 border-b border-cyan-500/20 bg-cyan-950/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/80 mb-1">
                {LEVEL_LABELS_KO[node.level]} · L{node.level}
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">{node.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-white/10 bg-white/5 p-4 flex flex-col items-start justify-center">
              <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-400/60 mb-2">Author</span>
              <span className="text-sm font-mono text-white">SYSTEM</span>
            </div>
            <div className="border border-white/10 bg-white/5 p-4 flex flex-col items-start justify-center">
              <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-400/60 mb-2">Created</span>
              <span className="text-sm font-mono text-white">{format(new Date(node.createdAt), "yyyy-MM-dd")}</span>
            </div>
            <div className="border border-white/10 bg-white/5 p-4 flex flex-col items-start justify-center">
              <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-400/60 mb-2">Level</span>
              <span className="text-sm font-mono text-white">{LEVEL_NAMES[node.level]}</span>
            </div>
            <div className="border border-white/10 bg-white/5 p-4 flex flex-col items-start justify-center">
              <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-400/60 mb-2">Links</span>
              <span className="text-sm font-mono text-white">{connectedNodes.length}</span>
            </div>
          </div>

          {node.description && (
            <div className="border border-cyan-500/20 bg-cyan-950/10 p-5">
              <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Layers3 className="w-4 h-4" /> Summary
              </h4>
              <p className="text-sm text-cyan-100/80 leading-relaxed font-sans">{node.description}</p>
            </div>
          )}

          <div className="border border-white/10 bg-black/40 p-5 min-h-[200px]">
            <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Network className="w-4 h-4" /> Full Text Data
            </h4>
            <div className="text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap font-sans">
              {node.content || "NO CONTENT DATA AVAILABLE"}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-cyan-500/20 bg-black/60 p-4 flex justify-between items-center">
          <div className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest">
            ID_0{node.id} // SECURE
          </div>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "PURGING..." : "PURGE_DATA"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
