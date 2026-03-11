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
import { Brain, Sparkles, Loader2, FolderTree } from "lucide-react";

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
        title: "분석 완료!",
        description: `[${data.category}] "${data.subjectTitle}" — ${data.createdNodes}개 노드 생성`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "분석 실패",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="analyze-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">AI 텍스트 분석</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                텍스트를 붙여넣으면 AI가 자동 분류하여 마인드맵에 배치합니다
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
              <FolderTree className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">자동 분류:</span>{" "}
                철학 · 종교 · 사회과학 · 자연과학 · 기술과학 · 예술 · 언어 · 문학 · 역사
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
              <Brain className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">DIKW 위계:</span>{" "}
                {LEVEL_LABELS_KO[2]} → {LEVEL_LABELS_KO[3]} → {LEVEL_LABELS_KO[4]} → {LEVEL_LABELS_KO[5]}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                분석할 텍스트
              </label>
              <span className={`text-xs ${charCount > 45000 ? "text-destructive" : "text-muted-foreground"}`}>
                {charCount.toLocaleString()} / 50,000
              </span>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="학습 내용, 문서, 논문, 메모 등을 붙여넣으세요...&#10;&#10;AI가 자동으로 9개 분류 중 적합한 카테고리를 찾아 배치합니다."
              className="resize-none font-mono text-sm min-h-[200px]"
              rows={10}
              data-testid="input-analyze-text"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-analyze-cancel"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={analyzeMutation.isPending || !text.trim() || charCount > 50000}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="button-analyze-submit"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  분석 시작
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
