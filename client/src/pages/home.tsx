import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type KnowledgeNode, type Connection, LEVEL_NAMES } from "@shared/schema";
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
import { Brain, Sparkles, Network, Zap, LayoutGrid, GitBranch, Home as HomeIcon, ChevronRight } from "lucide-react";

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

  const totalNodes = stats?.totalNodes ?? 0;
  const connectionCount = stats?.connectionCount ?? 0;

  if (viewMode === "mindmap") {
    return (
      <div className="fixed inset-0 bg-background" data-testid="home-page">
        <MindMap
          allNodes={allNodes}
          connections={connections}
          onNodeSelect={handleNodeClick}
          onNodeZoom={handleZoomIn}
          selectedNode={selectedNode}
          focusNodeId={currentParentId}
          onAddNode={() => setAnalyzeDialogOpen(true)}
          onViewFullText={(node) => setFullTextNode(node)}
          fullscreen
        />

        <div className="fixed top-4 left-4 z-20 flex items-center gap-3" data-testid="floating-header">
          <div className="flex items-center gap-2.5 bg-card/90 backdrop-blur-md border border-border/60 rounded-xl px-3 py-2 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-foreground tracking-tight leading-none" data-testid="text-app-title">
                SchemaMind
              </h1>
              <p className="text-[9px] text-muted-foreground leading-none mt-0.5">Digital Brain</p>
            </div>
          </div>
        </div>

        {currentPath.length > 0 && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20" data-testid="floating-breadcrumb">
            <div className="flex items-center gap-1 bg-card/90 backdrop-blur-md border border-border/60 rounded-xl px-3 py-1.5 shadow-lg text-xs">
              <button
                onClick={() => handleZoomOut(0)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                data-testid="breadcrumb-root"
              >
                <HomeIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Cogito</span>
              </button>
              {currentPath.map((node, index) => (
                <div key={node.id} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                  <button
                    onClick={() => handleZoomOut(index + 1)}
                    className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap max-w-[120px] truncate ${
                      index === currentPath.length - 1
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    data-testid={`breadcrumb-item-${node.id}`}
                  >
                    {node.title}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="fixed top-4 right-4 z-20 flex items-center gap-2" data-testid="floating-controls">
          <div className="flex items-center gap-1 bg-card/90 backdrop-blur-md border border-border/60 rounded-xl px-1.5 py-1 shadow-lg">
            <button
              onClick={() => setViewMode("mindmap")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground shadow-sm"
              data-testid="button-view-mindmap"
            >
              <GitBranch className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-view-grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setAnalyzeDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-lg"
            data-testid="button-open-analyze"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI 분석</span>
          </button>
        </div>

        <div className="fixed bottom-4 left-4 z-20" data-testid="floating-stats">
          <div className="flex items-center gap-3 bg-card/90 backdrop-blur-md border border-border/60 rounded-xl px-3 py-2 shadow-lg text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-3 h-3 text-primary" />
              <span className="font-medium" data-testid="text-total-nodes">{totalNodes}</span>
              <span className="text-[10px]">nodes</span>
            </div>
            <button
              onClick={() => setConnectionPanelOpen(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-open-connections"
            >
              <Network className="w-3 h-3 text-chart-2" />
              <span className="font-medium" data-testid="text-connections">{connectionCount}</span>
              <span className="text-[10px]">links</span>
            </button>
          </div>
        </div>

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
              onViewFullText={selectedNode.level === 2 && selectedNode.content ? () => setFullTextNode(selectedNode) : undefined}
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      <header className="relative overflow-hidden border-b border-border/50" data-testid="brain-header">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight" data-testid="text-app-title">SchemaMind</h1>
                <p className="text-[11px] text-muted-foreground">Digital Brain · Knowledge Hierarchy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/50">
                <button
                  onClick={() => setViewMode("mindmap")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                  data-testid="button-view-mindmap"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mind Map</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground shadow-sm"
                  data-testid="button-view-grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
              <button
                onClick={() => setAnalyzeDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-sm"
                data-testid="button-open-analyze"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI 분석</span>
              </button>
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium" data-testid="text-total-nodes">{totalNodes}</span>
                  <span className="text-xs">nodes</span>
                </div>
                <button
                  onClick={() => setConnectionPanelOpen(true)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-open-connections"
                >
                  <Network className="w-3.5 h-3.5 text-chart-2" />
                  <span className="font-medium" data-testid="text-connections">{connectionCount}</span>
                  <span className="text-xs">links</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
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
              {currentLevel === 0 ? "Start Building Your Digital Brain" : "No nodes at this level yet"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {currentLevel === 0
                ? "Add your first domain to begin organizing your knowledge."
                : `Add your first ${LEVEL_NAMES[currentLevel + 1]?.toLowerCase() ?? "node"} to expand this branch.`}
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
              onViewFullText={selectedNode.level === 2 && selectedNode.content ? () => setFullTextNode(selectedNode) : undefined}
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
