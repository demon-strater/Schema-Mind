import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LEVEL_NAMES, LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";
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

const nodeFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
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
        title: `${levelName} created`,
        description: "Your knowledge node has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
      <DialogContent className="sm:max-w-[480px]" data-testid="add-node-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `${levelColor}15`,
                border: `1px solid ${levelColor}25`,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: levelColor }}
              />
            </div>
            <DialogTitle className="text-lg">
              New {levelName}
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Add a new {levelName.toLowerCase()} node to your knowledge tree at level {clampedLevel}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`Enter ${levelName.toLowerCase()} title...`}
                      {...field}
                      data-testid="input-node-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="input-node-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed content, notes, or raw data..."
                      className="resize-none font-mono text-sm"
                      rows={5}
                      {...field}
                      data-testid="input-node-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                data-testid="button-create-node"
              >
                {createMutation.isPending ? "Creating..." : `Create ${levelName}`}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
