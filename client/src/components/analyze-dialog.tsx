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
import { Brain, Sparkles, Loader2, FolderTree, CheckCircle2 } from "lucide-react";

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
        title: "분석 완료",
        description: `[${data.category}] "${data.subjectTitle}"에서 ${data.createdNodes}개 노드를 만들었습니다.`,
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
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto" data-testid="analyze-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">AI 텍스트 분석</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                문서나 메모를 붙여넣으면 카테고리 분류와 계층형 노드 생성을 한 번에 처리합니다.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
              <FolderTree className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">자동 분류:</span>{" "}
                9개 지식 분야 중 가장 적합한 카테고리를 선택합니다.
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
              <Brain className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">계층 구조:</span>{" "}
                {LEVEL_LABELS_KO[2]} → {LEVEL_LABELS_KO[3]} → {LEVEL_LABELS_KO[4]} → {LEVEL_LABELS_KO[5]}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              더 좋은 결과를 위한 팁
            </div>
            <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
              <li>제목, 날짜, 작성자 정보가 있으면 요약 품질이 더 좋아집니다.</li>
              <li>서로 다른 주제가 섞인 긴 문서는 단락별로 나눠 입력하는 편이 좋습니다.</li>
              <li>강의 노트, 기사, 논문 초록, 회의 메모처럼 구조가 있는 텍스트에 특히 잘 맞습니다.</li>
            </ul>
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
              placeholder={"예시)\n제목: 양자역학 입문 정리\n날짜: 2026-03-19\n본문: 양자역학은 미시 세계를 설명하기 위한 물리학의 핵심 이론이다...\n\n붙여넣은 내용은 카테고리 분류, 요약, DIKW 노드 생성에 사용됩니다."}
              className="resize-none font-mono text-sm min-h-[220px]"
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
