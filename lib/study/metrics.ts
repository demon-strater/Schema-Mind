import type { StudyEvent } from "./events";
export interface StudyMetrics { neighborViews: number; maxDepth: number | null; contradictViewRatio: number | null; confirmedLinks: number; bypassRate: number | null; unanchoredRatio: number | null; firstClickLatency: number | null; taskDurationMs: number | null; readTimeMs: number; operationTimeMs: number }
const sumDuration = (events: readonly StudyEvent[], type: StudyEvent["type"]) => events.filter((event) => event.type === type).reduce((sum, event) => sum + (typeof event.payload.durationMs === "number" ? event.payload.durationMs : 0), 0);
export function calculateMetrics(events: readonly StudyEvent[]): StudyMetrics {
  const neighbor = events.filter((event) => event.type === "neighbor_view");
  const contradict = events.filter((event) => event.type === "contradict_view").length;
  const decisions = events.filter((event) => ["anchor_accept", "anchor_manual", "anchor_defer"].includes(event.type));
  const defers = events.filter((event) => event.type === "anchor_defer").length;
  const bypass = events.filter((event) => event.type === "friction_bypass").length;
  const depths = events.flatMap((event) => typeof event.payload.depth === "number" ? [event.payload.depth] : []);
  const start = events.find((event) => event.type === "task_start");
  const end = [...events].reverse().find((event) => event.type === "task_end");
  const first = events.find((event) => event.type === "first_click_latency");
  return { neighborViews: new Set(neighbor.map((event) => event.payload.nodeId)).size, maxDepth: depths.length ? Math.max(...depths) : null, contradictViewRatio: neighbor.length ? contradict / neighbor.length : null, confirmedLinks: decisions.filter((event) => event.type !== "anchor_defer").length, bypassRate: decisions.length ? bypass / decisions.length : null, unanchoredRatio: decisions.length ? defers / decisions.length : null, firstClickLatency: first && typeof first.payload.durationMs === "number" ? first.payload.durationMs : null, taskDurationMs: start && end ? end.serverTs.getTime() - start.serverTs.getTime() : null, readTimeMs: sumDuration(events, "read_time_tick"), operationTimeMs: sumDuration(events, "operation_time_tick") };
}
