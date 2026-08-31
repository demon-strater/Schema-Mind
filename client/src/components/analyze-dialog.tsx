import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LEVEL_LABELS_KO } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Sparkles, Loader2, FolderTree, CheckCircle2, X } from "lucide-react";

interface AnalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyzeDialog({ open, onOpenChange }: AnalyzeDialogProps) {
  const { toast } = useToast();
  const [text, setText] = useState("");

  const analyzeMutation = useMutation({
    mutationFn: async (payload: { text: string }) => {
      const res = await apiRequest("POST", "/api/analyze", payload);
      return res.json();
    },
    onSuccess: (data: { createdNodes: number; subjectTitle: string; category: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nodes/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      setText("");
      onOpenChange(false);
      toast({
        title: "ANALYSIS_COMPLETE",
        description: `[${data.category}] ${data.createdNodes} NODES EXTRACTED.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ANALYSIS_FAILED",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!text.trim()) return;
    analyzeMutation.mutate({ text: text.trim() });
  };

  const charCount = text.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-background border-foreground p-0 gap-0 rounded-none overflow-hidden" data-testid="analyze-dialog">
        <div className="relative flex flex-col h-full max-h-[90vh]">
          {/* Sutera Header */}
          <div className="flex items-start justify-between p-8 border-b border-foreground/10">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">
                Module // AI_NEURAL_PROCESSOR
              </div>
              <DialogTitle className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Text Analysis
              </DialogTitle>
              <p className="text-sm font-medium text-foreground/60 max-w-md leading-relaxed">
                Upload raw data to initialize neural mapping. Our processor categorizes and structures hierarchical knowledge nodes instantly.
              </p>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-4 border border-foreground/10 hover:bg-foreground hover:text-background transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
             {/* Info Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-foreground pb-2">Protocols</h3>
                   <ul className="space-y-3">
                      <li className="flex items-start gap-3 text-xs font-medium text-foreground/70">
                         <span className="w-1.5 h-1.5 bg-foreground mt-1.5 flex-shrink-0" />
                         Auto-categorization across 9 major knowledge domains.
                      </li>
                      <li className="flex items-start gap-3 text-xs font-medium text-foreground/70">
                         <span className="w-1.5 h-1.5 bg-foreground mt-1.5 flex-shrink-0" />
                         Hierarchical depth mapping from {LEVEL_LABELS_KO[2]} to {LEVEL_LABELS_KO[5]}.
                      </li>
                   </ul>
                </div>
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-foreground pb-2">Optimal Results</h3>
                   <ul className="space-y-3">
                      <li className="flex items-start gap-3 text-xs font-medium text-foreground/70">
                         <span className="w-1.5 h-1.5 bg-foreground mt-1.5 flex-shrink-0" />
                         Include titles and dates for enhanced structural accuracy.
                      </li>
                      <li className="flex items-start gap-3 text-xs font-medium text-foreground/70">
                         <span className="w-1.5 h-1.5 bg-foreground mt-1.5 flex-shrink-0" />
                         Best suited for academic abstracts, lecture notes, and logs.
                      </li>
                   </ul>
                </div>
             </div>

             {/* Input Area */}
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Input_Stream</h3>
                  <span className={`text-[10px] font-mono ${charCount > 45000 ? "text-red-500" : "text-foreground/40"}`}>
                    {charCount.toLocaleString()} / 50,000 BYTES
                  </span>
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste raw text data here..."
                  className="min-h-[300px] rounded-none border-foreground/20 focus:border-foreground bg-foreground/[0.02] text-lg font-medium leading-relaxed resize-none p-6"
                  data-testid="input-analyze-text"
                />
             </div>
          </div>

          {/* Sutera Footer */}
          <div className="p-8 border-t border-foreground/10 flex justify-between items-center bg-foreground/[0.01]">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Ready_To_Inject</span>
             </div>
             <div className="flex gap-4">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-8 py-3 text-[10px] font-black uppercase tracking-widest border border-foreground/10 hover:border-foreground transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={analyzeMutation.isPending || !text.trim() || charCount > 50000}
                  className="px-10 py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  {analyzeMutation.isPending ? "Processing..." : "Commence_Sync"}
                </button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
