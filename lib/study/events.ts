import { z } from "zod";
import { CONDITIONS } from "@/lib/condition";

export const EVENT_TYPES = ["query_submit", "scope_card_open", "neighbor_view", "neighbor_expand", "contradict_view", "first_click_latency", "breadcrumb_back", "slot_fill", "slot_accept", "slot_edit", "slot_reject", "slot_dwell", "anchor_suggest_shown", "anchor_accept", "anchor_manual", "anchor_defer", "unanchored_resolve", "task_start", "task_end", "read_time_tick", "operation_time_tick", "friction_bypass"] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export interface StudyEvent { id: string; participantId: string; condition: (typeof CONDITIONS)[number]; sessionDay: 1 | 8; type: EventType; payload: Record<string, unknown>; clientTs: number; serverTs: Date }
export const eventInputSchema = z.object({ id: z.string().min(1), participantId: z.string().min(1), condition: z.enum(CONDITIONS), sessionDay: z.union([z.literal(1), z.literal(8)]), type: z.enum(EVENT_TYPES), payload: z.record(z.string(), z.unknown()), clientTs: z.number().finite().nonnegative() });
