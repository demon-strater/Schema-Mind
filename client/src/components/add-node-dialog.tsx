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
import { X } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/team-mode";

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
  teamMode?: boolean;
  teamMemberIndex?: number;
}

export function AddNodeDialog({ open, onOpenChange, parentId, level, teamMode = false, teamMemberIndex = 0 }: AddNodeDialogProps) {
  const { toast } = useToast();
  const clampedLevel = Math.min(level, 7);
  const levelName = LEVEL_NAMES[clampedLevel] || "Node";
  const levelLabel = LEVEL_LABELS_KO[clampedLevel] || levelName;
  const activeTeamMember = TEAM_MEMBERS[teamMemberIndex % TEAM_MEMBERS.length];
  const levelColor = teamMode ? activeTeamMember.color : LEVEL_COLORS[clampedLevel] || LEVEL_COLORS[0];

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
        title: "NODE_CREATED",
        description: `New ${levelLabel} unit initialized.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "INITIALIZATION_FAILED",
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
      <DialogContent className="sm:max-w-[700px] bg-background border-foreground p-0 gap-0 rounded-none overflow-hidden" data-testid="add-node-dialog">
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between p-8 border-b border-foreground/10">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">
                {teamMode ? `Team // MEMBER_${activeTeamMember.name}_${activeTeamMember.label}` : `Design // ${levelName.toUpperCase()}_UNIT_v2.0`}
              </div>
              <DialogTitle className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Append Data
              </DialogTitle>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-4 border border-foreground/10 hover:bg-foreground hover:text-background transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">01. Node_Identity (Title)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ENTER UNIT IDENTIFIER"
                          className="h-14 rounded-none border-foreground/20 focus:border-foreground bg-foreground/[0.02] text-xl font-bold uppercase tracking-tight px-6"
                          {...field}
                          data-testid="input-node-title"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">02. Abstract (Summary)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="DESCRIBE UNIT PURPOSE"
                          className="resize-none rounded-none border-foreground/20 focus:border-foreground bg-foreground/[0.02] text-md font-medium p-6 min-h-[100px]"
                          {...field}
                          data-testid="input-node-description"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">03. Full_Data_Stream (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="INJECT DETAILED SPECIFICATIONS"
                          className="resize-none rounded-none border-foreground/20 focus:border-foreground bg-foreground/[0.02] text-sm font-mono p-6 min-h-[150px]"
                          {...field}
                          data-testid="input-node-content"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-4 border-t border-foreground/5">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-8 py-3 text-[10px] font-black uppercase tracking-widest border border-foreground/10 hover:border-foreground transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-10 py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 disabled:opacity-30"
                    data-testid="button-create-node"
                  >
                    {createMutation.isPending ? "Designing..." : "Confirm_Append"}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
