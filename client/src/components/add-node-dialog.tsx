import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LEVEL_NAMES, LEVEL_COLORS, LEVEL_ICONS, LEVEL_LABELS_KO } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

const nodeFormSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요.").max(200),
  description: z.string().max(500).optional(),
  content: z.string().optional(),
});

type NodeFormValues = z.infer<typeof nodeFormSchema>;

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: number | null;
  level: number;
}

export function AddNodeDialog({ open, onOpenChange, parentId, level }: AddNodeDialogProps) {
  const { toast } = useToast();
  const clampedLevel = Math.min(level, 7);
  const levelName = LEVEL_NAMES[clampedLevel] || "Node";
  const levelLabel = LEVEL_LABELS_KO[clampedLevel] || levelName;
  const levelColor = LEVEL_COLORS[clampedLevel] || LEVEL_COLORS[0];

  const form = useForm<NodeFormValues>({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: NodeFormValues) => {
      await apiRequest("POST", "/api/nodes", {
        ...data,
        parentId,
        level: clampedLevel,
        color: levelColor,
        icon: LEVEL_ICONS[clampedLevel],
        sortOrder: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nodes/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
      onOpenChange(false);
      toast({
        title: `${levelLabel} 노드를 만들었습니다.`,
        description: "새 지식 노드가 현재 브랜치에 추가되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "노드 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NodeFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-[32px] border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-2xl shadow-2xl p-8" data-testid="add-node-dialog">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${levelColor}22 0%, ${levelColor}11 100%)`,
                border: `1px solid ${levelColor}33`,
              }}
            >
              <div className="h-4 w-4 rounded-full animate-pulse" style={{ background: levelColor, boxShadow: `0 0 10px ${levelColor}` }} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">{levelName} Architecture</div>
              <DialogTitle className="text-2xl font-black tracking-tight dark:text-white">
                {levelLabel} 노드 추가
              </DialogTitle>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            현재 지식 브랜치에 새로운 {levelLabel.toLowerCase()} 레이어를 설계합니다. <br/>
            구체적인 정보를 입력하여 마인드맵의 해상도를 높여보세요.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Node Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`${levelLabel}의 핵심 주제를 입력하세요`}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-primary/20 transition-all font-semibold"
                      {...field}
                      data-testid="input-node-title"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Executive Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="이 지식의 핵심 내용을 한 문장으로 정의하세요."
                      className="resize-none rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-primary/20 transition-all min-h-[100px]"
                      {...field}
                      data-testid="input-node-description"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Detailed Specification (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="데이터, 출처, 심층적인 메모를 기록하세요."
                      className="resize-none rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-primary/20 transition-all font-mono text-sm min-h-[160px]"
                      {...field}
                      data-testid="input-node-content"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                data-testid="button-cancel"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="group relative px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl overflow-hidden"
                data-testid="button-create-node"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-2">
                  {createMutation.isPending ? "Designing..." : `${levelLabel} 설계 완료`}
                </span>
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
