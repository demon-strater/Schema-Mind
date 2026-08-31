import { type KnowledgeNode } from "@shared/schema";

export const TEAM_MEMBERS = [
  { name: "A", color: "#06B6D4", label: "CYAN" },
  { name: "B", color: "#F59E0B", label: "AMBER" },
  { name: "C", color: "#EC4899", label: "PINK" },
] as const;

const TEAM_COLORS = new Set(TEAM_MEMBERS.map((member) => member.color.toLowerCase()));

export function getTeamMemberIndex(node: Pick<KnowledgeNode, "id" | "color">) {
  const colorIndex = node.color
    ? TEAM_MEMBERS.findIndex((member) => member.color.toLowerCase() === node.color?.toLowerCase())
    : -1;

  return colorIndex >= 0 ? colorIndex : node.id % TEAM_MEMBERS.length;
}

export function getTeamNodeColor(node: Pick<KnowledgeNode, "id" | "color">) {
  return TEAM_MEMBERS[getTeamMemberIndex(node)].color;
}

export function isTeamColor(color: string | null | undefined) {
  return color ? TEAM_COLORS.has(color.toLowerCase()) : false;
}
