import { type Connection, type KnowledgeNode, LEVEL_COLORS } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { X, Network, ArrowRight, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ConnectionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: Connection[];
  allNodes: KnowledgeNode[];
}

export function ConnectionPanel({ open, onOpenChange, connections, allNodes }: ConnectionPanelProps) {
  const { toast } = useToast();
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/connections", {
        sourceId: Number.parseInt(sourceId, 10),
        targetId: Number.parseInt(targetId, 10),
        description: description || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSourceId("");
      setTargetId("");
      setDescription("");
      toast({
        title: "연결 생성 완료",
        description: "선택한 두 노드를 연결했습니다.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/connections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-0 right-0 w-full sm:w-[460px] h-full bg-card border-l border-border z-50 overflow-y-auto"
        data-testid="connection-panel"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-chart-2" />
              <h3 className="font-semibold text-foreground">지식 연결</h3>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              data-testid="button-close-connections"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-6">
            <h4 className="text-sm font-medium text-foreground mb-2">새 연결 만들기</h4>
            <p className="mb-4 text-xs leading-5 text-muted-foreground">
              서로 다른 브랜치의 개념을 연결하면 단순한 계층 구조를 넘어서 지식 그래프를 만들 수 있습니다.
            </p>
            <div className="space-y-3">
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger data-testid="select-source-node">
                  <SelectValue placeholder="출발 노드를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {allNodes.map((node) => (
                    <SelectItem key={node.id} value={String(node.id)}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[node.level] }} />
                        {node.title}
                        <span className="text-muted-foreground text-xs">L{node.level}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>

              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger data-testid="select-target-node">
                  <SelectValue placeholder="도착 노드를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {allNodes.filter((n) => String(n.id) !== sourceId).map((node) => (
                    <SelectItem key={node.id} value={String(node.id)}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[node.level] }} />
                        {node.title}
                        <span className="text-muted-foreground text-xs">L{node.level}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="두 노드가 왜 연결되는지 짧게 적으세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-connection-description"
              />

              <button
                onClick={() => createMutation.mutate()}
                disabled={!sourceId || !targetId || createMutation.isPending}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                data-testid="button-create-connection"
              >
                {createMutation.isPending ? "연결 중..." : "연결 만들기"}
              </button>
            </div>
          </div>

          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            기존 연결 ({connections.length})
          </h4>

          {connections.length === 0 ? (
            <div className="text-center py-8">
              <Network className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">아직 연결이 없습니다</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                다른 분야의 노드를 연결해 지식 간 관계를 드러내보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => {
                const source = allNodes.find((n) => n.id === conn.sourceId);
                const target = allNodes.find((n) => n.id === conn.targetId);
                if (!source || !target) return null;

                return (
                  <motion.div
                    key={conn.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group rounded-lg border border-border/50 bg-muted/20 p-3 hover:border-border transition-colors"
                    data-testid={`connection-item-${conn.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LEVEL_COLORS[source.level] }} />
                          <span className="text-sm font-medium text-foreground truncate">{source.title}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LEVEL_COLORS[target.level] }} />
                          <span className="text-sm font-medium text-foreground truncate">{target.title}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(conn.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                        data-testid={`button-delete-connection-${conn.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                    {conn.description && (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {conn.description}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
