import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type KnowledgeNode, type Connection, LEVEL_NAMES } from "@shared/schema";
import { NodeGrid } from "@/components/node-grid";
import { NodeDetail } from "@/components/node-detail";
import { AddNodeDialog } from "@/components/add-node-dialog";
import { AnalyzeDialog } from "@/components/analyze-dialog";
import { ConnectionPanel } from "@/components/connection-panel";
import { MindMap } from "@/components/mind-map";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainHeader } from "@/components/brain-header";
import { GrowthStats } from "@/components/growth-stats";

type ViewMode = "mindmap" | "grid";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("mindmap");
  const [currentPath, setCurrentPath] = useState<KnowledgeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [connectionPanelOpen, setConnectionPanelOpen] = useState(false);
  const [teamMode, setTeamMode] = useState(false);
  const [teamMemberIndex, setTeamMemberIndex] = useState(0);

  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
  const currentLevel = currentPath.length;

  const { data: nodes = [], isLoading: nodesLoading } = useQuery<KnowledgeNode[]>({
    queryKey: ["/api/nodes", currentParentId ?? "root"],
    queryFn: async () => {
      const parentQueryParam = currentParentId !== null ? `?parentId=${currentParentId}` : "";
      const res = await fetch(`/api/nodes${parentQueryParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch nodes");
      return res.json();
    },
  });

  const { data: allNodes = [] } = useQuery<KnowledgeNode[]>({ queryKey: ["/api/nodes/all"] });
  const { data: connections = [] } = useQuery<Connection[]>({ queryKey: ["/api/connections"] });
  const { data: stats } = useQuery<{ totalNodes: number; levelCounts: Record<number, number>; connectionCount: number }>({ queryKey: ["/api/stats"] });

  const deleteNodeMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/nodes/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nodes/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedNode(null);
    },
  });

  const handleZoomIn = (node: KnowledgeNode) => {
    if (node.level < 7) { setCurrentPath([...currentPath, node]); setSelectedNode(null); }
  };

  const handleZoomOut = (targetIndex: number) => {
    setCurrentPath(currentPath.slice(0, targetIndex));
    setSelectedNode(null);
  };

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* Background Grid Pattern (Sutera Style) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <BrainHeader 
        stats={stats} 
        onOpenConnections={() => setConnectionPanelOpen(true)} 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAnalyze={() => setAnalyzeDialogOpen(true)}
        teamMode={teamMode}
        teamMemberIndex={teamMemberIndex}
        onTeamModeToggle={() => {
          setTeamMode((value) => !value);
          setViewMode("mindmap");
        }}
        onTeamMemberChange={setTeamMemberIndex}
      />

      {currentPath.length > 0 && (
        <div className="fixed left-4 top-44 z-[40] max-w-[calc(100vw-2rem)] pointer-events-auto sm:left-6 sm:top-28">
          <BreadcrumbNav path={currentPath} currentLevel={currentLevel} onNavigate={handleZoomOut} />
        </div>
      )}

      <main className="relative h-full w-full">
        <AnimatePresence mode="wait">
          {viewMode === "mindmap" ? (
            <motion.div key="mindmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
              <MindMap
                allNodes={allNodes}
                connections={connections}
                onNodeSelect={handleNodeClick}
                onNodeZoom={handleZoomIn}
                selectedNode={selectedNode}
                focusNodeId={currentParentId}
                onAddNode={() => setAnalyzeDialogOpen(true)}
                teamMode={teamMode}
                teamMemberIndex={teamMemberIndex}
                fullscreen
              />
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full w-full overflow-y-auto px-4 pt-52 sm:px-8 sm:pt-36 lg:px-10">
              <div className="max-w-7xl mx-auto py-12">
                 {nodesLoading ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 rounded-none border border-foreground/10" />)}
                   </div>
                 ) : (
                   <NodeGrid nodes={nodes} currentLevel={currentLevel} selectedNode={selectedNode} onNodeClick={handleNodeClick} onZoomIn={handleZoomIn} allNodes={allNodes} />
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <GrowthStats stats={stats} />

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

      <AddNodeDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} parentId={currentParentId} level={currentLevel + 1} teamMode={teamMode} teamMemberIndex={teamMemberIndex} />
      <ConnectionPanel open={connectionPanelOpen} onOpenChange={setConnectionPanelOpen} connections={connections} allNodes={allNodes} />
      <AnalyzeDialog open={analyzeDialogOpen} onOpenChange={setAnalyzeDialogOpen} />
    </div>
  );
}
