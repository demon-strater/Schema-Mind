import { type Connection, type KnowledgeNode, LEVEL_COLORS } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { X, Network, ArrowRight, Trash2, Plus } from "lucide-react";
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
      toast({ title: "LINK_ESTABLISHED", description: "Neural connection mapping successful." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/connections/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full sm:w-[500px] h-full bg-background border-l border-foreground/10 z-50 overflow-hidden flex flex-col"
            data-testid="connection-panel"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-8 border-b border-foreground/10">
               <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Network // TOPOLOGY_MGR</div>
                  <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground">Links</h3>
               </div>
               <button 
                onClick={() => onOpenChange(false)}
                className="p-4 border border-foreground/10 hover:bg-foreground hover:text-background transition-all"
               >
                <X className="w-6 h-6" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12">
               {/* Creator Section */}
               <section className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest border-b border-foreground pb-2 text-foreground/40">Establish_New_Path</h4>
                  <div className="space-y-4">
                     <Select value={sourceId} onValueChange={setSourceId}>
                        <SelectTrigger className="h-14 rounded-none border-foreground/20 focus:ring-0 bg-foreground/[0.02]">
                           <SelectValue placeholder="SOURCE_NODE" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-foreground/20">
                           {allNodes.map((node) => (
                             <SelectItem key={node.id} value={String(node.id)} className="rounded-none">
                               <span className="text-[10px] font-bold uppercase tracking-widest">{node.title}</span>
                             </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>

                     <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger className="h-14 rounded-none border-foreground/20 focus:ring-0 bg-foreground/[0.02]">
                           <SelectValue placeholder="TARGET_NODE" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-foreground/20">
                           {allNodes.filter(n => String(n.id) !== sourceId).map((node) => (
                             <SelectItem key={node.id} value={String(node.id)} className="rounded-none">
                               <span className="text-[10px] font-bold uppercase tracking-widest">{node.title}</span>
                             </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>

                     <Input 
                        placeholder="RELATION_LOG (OPTIONAL)" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-14 rounded-none border-foreground/20 focus:border-foreground bg-foreground/[0.02] text-xs font-medium"
                     />

                     <button
                        onClick={() => createMutation.mutate()}
                        disabled={!sourceId || !targetId || createMutation.isPending}
                        className="w-full py-4 bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-20"
                     >
                        {createMutation.isPending ? "Syncing..." : "COMMENCE_MAPPING"}
                     </button>
                  </div>
               </section>

               {/* List Section */}
               <section className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest border-b border-foreground pb-2 text-foreground/40">Active_Connections ({connections.length})</h4>
                  <div className="space-y-4">
                     {connections.length === 0 ? (
                       <div className="py-12 border border-dashed border-foreground/10 text-center">
                          <span className="text-[9px] font-mono uppercase opacity-30">No_Active_Topologies</span>
                       </div>
                     ) : (
                       connections.map((conn) => {
                          const source = allNodes.find(n => n.id === conn.sourceId);
                          const target = allNodes.find(n => n.id === conn.targetId);
                          if (!source || !target) return null;
                          return (
                            <div key={conn.id} className="p-6 border border-foreground/10 hover:border-foreground/30 transition-colors group">
                               <div className="flex items-center justify-between">
                                  <div className="flex flex-col gap-1">
                                     <span className="text-[10px] font-black uppercase tracking-tighter text-foreground">{source.title}</span>
                                     <ArrowRight className="w-3 h-3 opacity-20 my-1" />
                                     <span className="text-[10px] font-black uppercase tracking-tighter text-foreground">{target.title}</span>
                                  </div>
                                  <button onClick={() => deleteMutation.mutate(conn.id)} className="p-3 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                               {conn.description && <p className="mt-4 text-[10px] font-medium text-foreground/40 leading-relaxed uppercase">{conn.description}</p>}
                            </div>
                          );
                       })
                     )}
                  </div>
               </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
