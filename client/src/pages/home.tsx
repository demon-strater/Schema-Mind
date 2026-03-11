import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type KnowledgeNode, type Connection, LEVEL_NAMES } from "@shared/schema";
import { BrainHeader } from "@/components/brain-header";
import { NodeGrid } from "@/components/node-grid";
import { NodeDetail } from "@/components/node-detail";
import { AddNodeDialog } from "@/components/add-node-dialog";
import { AnalyzeDialog } from "@/components/analyze-dialog";
import { FullTextDialog } from "@/components/full-text-dialog";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ConnectionPanel } from "@/components/connection-panel";
import { MindMap } from "@/components/mind-map";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Network as NetworkIcon } from "lucide-react";

type ViewMode = "mindmap" | "grid";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("mindmap");
  const [currentPath, setCurrentPath] = useState<KnowledgeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [connectionPanelOpen, setConnectionPanelOpen] = useState(false);
  const [fullTextNode, setFullTextNode] = useState<KnowledgeNode | null>(null);

  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
  const currentLevel = currentPath.length;

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

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      <BrainHeader
        stats={stats}
        onOpenConnections={() => setConnectionPanelOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAnalyze={() => setAnalyzeDialogOpen(true)}
      />

      <main className={viewMode === "mindmap" ? "px-4 sm:px-6 pb-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"}>
        {viewMode === "mindmap" ? (
          <>
            <div className="mt-4 flex items-center justify-between">
              <BreadcrumbNav
                path={currentPath}
                currentLevel={currentLevel}
                onNavigate={handleZoomOut}
              />
              <button
                onClick={() => setAddDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex-shrink-0 ml-4"
                data-testid="button-add-node"
              >
                <span className="text-lg leading-none">+</span>
                Add {LEVEL_NAMES[Math.min(currentLevel + 1, 7)] ?? "Node"}
              </button>
            </div>
            <div className="mt-4">
              <MindMap
                allNodes={allNodes}
                connections={connections}
                onNodeSelect={handleNodeClick}
                onNodeZoom={handleZoomIn}
                selectedNode={selectedNode}
                focusNodeId={currentParentId}
                onAddNode={() => setAddDialogOpen(true)}
                onViewFullText={(node) => setFullTextNode(node)}
              />
            </div>
          </>
        ) : (
          <>
            <BreadcrumbNav
              path={currentPath}
              currentLevel={currentLevel}
              onNavigate={handleZoomOut}
            />
            <div className="mt-6 flex items-center justify-between">
              <div>
                <motion.h2
                  key={currentLevel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-foreground"
                  data-testid="level-title"
                >
                  {currentLevel === 0
                    ? "Cogito — Your Knowledge Universe"
                    : `${LEVEL_NAMES[currentLevel]} Level`}
                </motion.h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentLevel === 0
                    ? "Explore your digital brain from the highest level"
                    : `Viewing children of "${currentPath[currentPath.length - 1]?.title}"`}
                </p>
              </div>
              {currentLevel < 7 && (
                <button
                  onClick={() => setAddDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                  data-testid="button-add-node"
                >
                  <span className="text-lg">+</span>
                  Add {LEVEL_NAMES[currentLevel + 1] ?? "Node"}
                </button>
              )}
            </div>

            {nodesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : nodes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-12 text-center py-20"
                data-testid="empty-state"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                  <span className="text-4xl opacity-60">🧠</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {currentLevel === 0
                    ? "Start Building Your Digital Brain"
                    : "No nodes at this level yet"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  {currentLevel === 0
                    ? "Add your first domain to begin organizing your knowledge into a hierarchical structure."
                    : `Add your first ${LEVEL_NAMES[currentLevel + 1]?.toLowerCase() ?? "node"} to expand this branch of knowledge.`}
                </p>
                {currentLevel < 7 && (
                  <button
                    onClick={() => setAddDialogOpen(true)}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    data-testid="button-add-first-node"
                  >
                    + Add Your First {LEVEL_NAMES[currentLevel + 1] ?? "Node"}
                  </button>
                )}
              </motion.div>
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
          </>
        )}

        <AnimatePresence>
          {selectedNode && (
            <NodeDetail
              node={selectedNode}
              connections={connections.filter(
                (c) => c.sourceId === selectedNode.id || c.targetId === selectedNode.id
              )}
              allNodes={allNodes}
              onClose={() => setSelectedNode(null)}
              onDelete={() => deleteNodeMutation.mutate(selectedNode.id)}
              isDeleting={deleteNodeMutation.isPending}
              onViewFullText={selectedNode.level === 1 && selectedNode.content ? () => setFullTextNode(selectedNode) : undefined}
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

        <AnalyzeDialog
          open={analyzeDialogOpen}
          onOpenChange={setAnalyzeDialogOpen}
        />

        <FullTextDialog
          open={fullTextNode !== null}
          onOpenChange={(open) => { if (!open) setFullTextNode(null); }}
          node={fullTextNode}
        />
      </main>
    </div>
  );
}
