import OpenAI from "openai";
import { z } from "zod";
import { storage } from "./storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const analysisItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().optional(),
  tier: z.enum(["wisdom", "knowledge", "information", "data"]),
});

const analysisResultSchema = z.object({
  subject: z.string().min(1),
  subjectDescription: z.string().min(1),
  items: z.array(analysisItemSchema).min(1),
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    reason: z.string(),
  })).default([]),
});

const TIER_TO_LEVEL: Record<string, number> = {
  wisdom: 2,
  knowledge: 3,
  information: 4,
  data: 5,
};

export async function analyzeText(text: string, existingSubjectId?: number): Promise<{ createdNodes: number; subjectTitle: string }> {
  if (existingSubjectId !== undefined) {
    const existingNode = await storage.getNode(existingSubjectId);
    if (!existingNode) throw new Error("Subject node not found");
    if (existingNode.level !== 1) throw new Error("Selected node is not a subject-level node");
  }

  const prompt = `You are a knowledge architect. Analyze the following study text and organize it into a hierarchical knowledge structure.

Classify every piece of information into exactly one of these 4 tiers (from most abstract to most concrete):
- **wisdom** (지혜): Core principles, deep insights, universal truths, philosophical takeaways. These are the most abstract, highest-value insights.
- **knowledge** (지식): Organized understanding, theories, frameworks, structured concepts that explain how things work.
- **information** (정보): Contextual facts, specific explanations, definitions, descriptions with context.
- **data** (데이터): Raw facts, numbers, quotes, specific examples, dates, names, concrete details.

Also identify a main subject (대주제) that encompasses all the content.

Also identify meaningful connections between items across different tiers.

Return ONLY valid JSON in this exact format:
{
  "subject": "Main Subject Title",
  "subjectDescription": "Brief description of the main subject",
  "items": [
    {
      "title": "Item title",
      "description": "Brief summary",
      "content": "Detailed content or original text excerpt",
      "tier": "wisdom|knowledge|information|data"
    }
  ],
  "connections": [
    {
      "from": "exact item title",
      "to": "exact item title",
      "reason": "why these are connected"
    }
  ]
}

Aim for 3-8 items total, distributed across the tiers. Every tier should have at least 1 item if the text has enough content.

TEXT TO ANALYZE:
${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const result = analysisResultSchema.parse(parsed);

  let subjectNode;
  if (existingSubjectId) {
    subjectNode = (await storage.getNode(existingSubjectId))!;
    if (!subjectNode.content) {
      await storage.updateNode(existingSubjectId, { content: text });
    } else {
      await storage.updateNode(existingSubjectId, {
        content: subjectNode.content + "\n\n---\n\n" + text,
      });
    }
  } else {
    subjectNode = await storage.createNode({
      parentId: null,
      level: 1,
      title: result.subject,
      description: result.subjectDescription,
      content: text,
      color: LEVEL_COLORS[1],
      icon: LEVEL_ICONS[1],
      sortOrder: 0,
    });
  }

  const itemsByTier: Record<string, typeof result.items> = {
    wisdom: [],
    knowledge: [],
    information: [],
    data: [],
  };
  for (const item of result.items) {
    itemsByTier[item.tier].push(item);
  }

  const createdNodeMap = new Map<string, number>();
  createdNodeMap.set(result.subject, subjectNode.id);

  const tiers = ["wisdom", "knowledge", "information", "data"] as const;
  let parentIdForTier = subjectNode.id;

  for (const tier of tiers) {
    const items = itemsByTier[tier];
    if (items.length === 0) continue;

    const level = TIER_TO_LEVEL[tier];
    let firstNodeId: number | null = null;

    for (const item of items) {
      const node = await storage.createNode({
        parentId: parentIdForTier,
        level,
        title: item.title,
        description: item.description,
        content: item.content || null,
        color: LEVEL_COLORS[level],
        icon: LEVEL_ICONS[level],
        sortOrder: 0,
      });
      createdNodeMap.set(item.title, node.id);
      if (firstNodeId === null) firstNodeId = node.id;
    }

    if (firstNodeId !== null) {
      parentIdForTier = firstNodeId;
    }
  }

  for (const conn of result.connections) {
    const fromId = createdNodeMap.get(conn.from);
    const toId = createdNodeMap.get(conn.to);
    if (fromId && toId && fromId !== toId) {
      await storage.createConnection({
        sourceId: fromId,
        targetId: toId,
        description: conn.reason,
      });
    }
  }

  return {
    createdNodes: result.items.length + (existingSubjectId ? 0 : 1),
    subjectTitle: result.subject,
    subjectId: subjectNode.id,
  };
}
