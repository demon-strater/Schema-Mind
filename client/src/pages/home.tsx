import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  Network,
  LayoutGrid,
  GitBranch,
  Home as HomeIcon,
  ChevronRight,
  ArrowRight,
  Plus,
  Compass
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type KnowledgeNode, type Connection, LEVEL_NAMES } from "@shared/schema";
import { NodeGrid } from "@/components/node-grid";
import { NodeDetail } from "@/components/node-detail";
import { AddNodeDialog } from "@/components/add-node-dialog";
import { AnalyzeDialog } from "@/components/analyze-dialog";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ConnectionPanel } from "@/components/connection-panel";
import { MindMap } from "@/components/mind-map";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";

type ViewMode = "mindmap" | "grid";

function levelLabel(level: number) {
  return LEVEL_NAMES[level] ?? `Level ${level}`;
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("mindmap");
  const [currentPath, setCurrentPath] = useState<KnowledgeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [connectionPanelOpen, setConnectionPanelOpen] = useState(false);

  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
  const currentLevel = currentPath.length;
  const currentTitle = currentLevel === 0 ? "Atlas Core" : currentPath[currentPath.length - 1]?.title ?? "Branch";
  const currentSubtitle =
    currentLevel === 0
      ? "Discover the structure of knowledge through an interactive neural map."
      : `Exploring depths of "${currentTitle}" architecture.`;

  const parentQueryParam = currentParentId !== null ? `?parentId=${currentParentId}` : "";

  const { data: nodes = [], isLoading: nodesLoading } = useQuery<KnowledgeNode[]>({
    queryKey: ["/api/nodes", currentParentId ?? "root"],
    queryFn: async () => {
      const res = await fetch(`/api/nodes${parentQueryParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch nodes");
      return res.json();
    },
  });

  const { data: allNodes = [] } = useQuery<KnowledgeNode[]>({
    queryKey: ["/api/nodes/all"],
  });

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });

  const { data: stats } = useQuery<{ totalNodes: number; levelCounts: Record<number, number>; connectionCount: number }>({
    queryKey: ["/api/stats"],
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/nodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nodes/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedNode(null);
    },
  });

  const handleZoomIn = (node: KnowledgeNode) => {
    if (node.level < 7) {
      setCurrentPath([...currentPath, node]);
      setSelectedNode(null);
    }
  };

  const handleZoomOut = (targetIndex: number) => {
    setCurrentPath(currentPath.slice(0, targetIndex));
    setSelectedNode(null);
  };

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  const totalNodes = stats?.totalNodes ?? 0;
  const connectionCount = stats?.connectionCount ?? 0;
  const isEmpty = allNodes.length === 0;

  return (
    <div className={`fixed inset-0 overflow-hidden transition-colors duration-700 ${viewMode === 'mindmap' ? 'bg-[#05070a]' : 'bg-[#f8fafc] dark:bg-[#05070a]'}`}>
      
      {/* Background patterns for Grid view */}
      {viewMode === 'grid' && (
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative h-full w-full">
        <AnimatePresence mode="wait">
          {viewMode === "mindmap" ? (
            <motion.div
              key="mindmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="h-full w-full"
            >
              <MindMap
                allNodes={allNodes}
                connections={connections}
                onNodeSelect={handleNodeClick}
                onNodeZoom={handleZoomIn}
                selectedNode={selectedNode}
                focusNodeId={currentParentId}
                onAddNode={() => setAnalyzeDialogOpen(true)}
                fullscreen
              />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full w-full overflow-y-auto pt-28 pb-32 px-10"
            >
              <div className="max-w-7xl mx-auto">
                <header className="mb-16">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-cyan-500/10 text-cyan-400 text-[9px] font-bold uppercase tracking-[0.3em] mb-4 border border-cyan-500/20">
                      <Compass className="h-3 w-3" />
                      DATA_GRID_EXPLORER
                   </div>
                   <h2 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 uppercase">
                      {isEmpty ? "Initialize Atlas" : currentTitle}
                   </h2>
                   <p className="text-sm font-mono text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed uppercase opacity-60">
                      {isEmpty 
                        ? "Waiting for document upload. AI-Core will architect thoughts into a structured neural network."
                        : `Sub-structural mapping: ${currentSubtitle}`}
                   </p>
                </header>

                {nodesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-72 rounded-[4px] dark:bg-white/5 border border-white/5" />
                    ))}
                  </div>
                ) : nodes.length === 0 ? (
                  <div className="py-32 flex flex-col items-center text-center rounded-sm border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/2 backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center mb-8 animate-pulse">
                      <Sparkles className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-widest uppercase">
                       {currentLevel === 0 ? "Neural Map Empty" : "Branch Vacant"}
                    </h3>
                    <div className="flex gap-4">
                       <button 
                        onClick={() => setAnalyzeDialogOpen(true)}
                        className="px-8 py-3 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all"
                       >
                         Execute AI Analysis
                       </button>
                    </div>
                  </div>
                ) : (
                  <NodeGrid
                    nodes={nodes}
                    currentLevel={currentLevel}
                    selectedNode={selectedNode}
                    onNodeClick={handleNodeClick}
                    onZoomIn={handleZoomIn}
                    allNodes={allNodes}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Top Header (Technical HUD) */}
        <div className="fixed top-0 left-0 right-0 z-50 p-8 flex justify-between items-start pointer-events-none">
          <div className="flex items-start gap-6 pointer-events-auto">
            <div className="px-6 py-4 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-sm bg-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                     <Brain className="h-4 w-4 text-black" />
                  </div>
                  <div>
                     <div className="text-[8px] font-black uppercase tracking-[0.4em] text-cyan-400/80">SCHEMAMIND</div>
                     <div className="text-xs font-bold text-white tracking-widest uppercase">ATLAS_PROTOCOL</div>
                  </div>
               </div>
            </div>
            
            <AnimatePresence>
              {currentPath.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="hidden xl:flex items-center gap-1 p-1 bg-black/40 backdrop-blur-3xl border border-white/10"
                >
                  <button
                    onClick={() => handleZoomOut(0)}
                    className="p-2 text-cyan-400 hover:bg-cyan-500/10 transition-all"
                  >
                    <HomeIcon className="h-3 w-3" />
                  </button>
                  {currentPath.map((node, index) => (
                    <div key={node.id} className="flex items-center">
                      <div className="text-[8px] text-white/20 mx-1">/</div>
                      <button
                        onClick={() => handleZoomOut(index + 1)}
                        className={`px-3 py-2 text-[9px] font-mono tracking-widest transition-all ${
                          index === currentPath.length - 1
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : "text-white/40 hover:text-white"
                        }`}
                      >
                        {node.title.toUpperCase().slice(0, 15)}
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="flex p-1 bg-black/40 backdrop-blur-3xl border border-white/10">
              <button
                onClick={() => setViewMode("mindmap")}
                className={`px-6 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                  viewMode === "mindmap" ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "text-white/40 hover:text-white"
                }`}
              >
                MAP
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-6 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                  viewMode === "grid" ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "text-white/40 hover:text-white"
                }`}
              >
                GRID
              </button>
            </div>
            
            <button
              onClick={() => setAnalyzeDialogOpen(true)}
              className="px-6 py-3 bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all active:scale-95"
            >
              ANALYSIS_CORE
            </button>
            
            <ThemeToggle />
          </div>
        </div>

        {/* Floating Bottom Stats (Technical HUD) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-8 flex justify-center pointer-events-none">
          <div className="flex items-center gap-12 px-10 py-5 bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] pointer-events-auto">
            <div className="flex flex-col items-center">
               <span className="text-[7px] font-black uppercase tracking-[0.5em] text-cyan-400/60 mb-2">SYSTEM_NODES</span>
               <span className="text-xl font-mono text-white leading-none tracking-tighter">{totalNodes.toString().padStart(3, '0')}</span>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <button 
              onClick={() => setConnectionPanelOpen(true)}
              className="flex flex-col items-center group transition-all"
            >
               <span className="text-[7px] font-black uppercase tracking-[0.5em] text-cyan-400/60 mb-2 group-hover:text-cyan-400">NETWORK_FLUX</span>
               <span className="text-xl font-mono text-white leading-none tracking-tighter group-hover:text-cyan-400">{connectionCount.toString().padStart(3, '0')}</span>
            </button>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex flex-col items-center">
               <span className="text-[7px] font-black uppercase tracking-[0.5em] text-cyan-400/60 mb-2">DEPTH_LVL</span>
               <span className="text-xl font-mono text-white leading-none tracking-tighter">{currentLevel.toString().padStart(2, '0')}</span>
            </div>
            {currentLevel < 7 && (
              <>
                <div className="h-10 w-px bg-white/5" />
                <button
                  onClick={() => setAddDialogOpen(true)}
                  className="flex items-center justify-center w-10 h-10 border border-white/20 text-white hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all active:scale-95"
                  title={`Append ${levelLabel(currentLevel + 1)}`}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetail
            node={selectedNode}
            connections={connections.filter((c) => c.sourceId === selectedNode.id || c.targetId === selectedNode.id)}
            allNodes={allNodes}
            onClose={() => setSelectedNode(null)}
            onDelete={() => deleteNodeMutation.mutate(selectedNode.id)}
            isDeleting={deleteNodeMutation.isPending}
          />
        )}
      </AnimatePresence>

      <AddNodeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        parentId={currentParentId}
        level={currentLevel + 1}
      />

      <ConnectionPanel
        open={connectionPanelOpen}
        onOpenChange={setConnectionPanelOpen}
        connections={connections}
        allNodes={allNodes}
      />

      <AnalyzeDialog open={analyzeDialogOpen} onOpenChange={setAnalyzeDialogOpen} />
    </div>
  );
}
