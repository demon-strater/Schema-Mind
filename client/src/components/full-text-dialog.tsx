import { type KnowledgeNode } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, X } from "lucide-react";

interface FullTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: KnowledgeNode | null;
}

export function FullTextDialog({ open, onOpenChange, node }: FullTextDialogProps) {
  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col" data-testid="full-text-dialog">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg truncate">{node.title}</DialogTitle>
              {node.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {node.description}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-3 -mx-6 px-6">
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed m-0 bg-transparent border-0 p-0" data-testid="text-full-content">
                {node.content}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end pt-3 border-t border-border/50 mt-3">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-close-full-text"
          >
            닫기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
