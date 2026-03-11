import OpenAI from "openai";
import { z } from "zod";
import { storage } from "./storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";
import { TOP_CATEGORIES } from "./seed";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const categoryNames = TOP_CATEGORIES.map((c) => c.title);

const analysisItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().optional(),
  tier: z.enum(["wisdom", "knowledge", "information", "data"]),
});

const analysisResultSchema = z.object({
  category: z.string().min(1),
  articleTitle: z.string().min(1),
  articleDescription: z.string().min(1),
  items: z.array(analysisItemSchema).min(1),
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    reason: z.string(),
  })).default([]),
});

export async function analyzeText(text: string): Promise<{ createdNodes: number; subjectTitle: string; category: string; subjectId: number }> {
  const allNodes = await storage.getAllNodes();
  const categoryNodes = allNodes.filter((n) => n.level === 1 && n.parentId === null);

  const prompt = `You are a knowledge architect. Analyze the following text and:

1. Determine which ONE of these 9 categories it belongs to (you MUST pick one):
${categoryNames.map((name, i) => `   ${i + 1}. ${name}`).join("\n")}

2. Create a concise article title (제목) that summarizes the text.

3. Classify every piece of information into exactly one of these 4 tiers:
- **wisdom** (지혜): Core principles, deep insights, universal truths, philosophical takeaways.
- **knowledge** (지식): Organized understanding, theories, frameworks, structured concepts.
- **information** (정보): Contextual facts, specific explanations, definitions.
- **data** (데이터): Raw facts, numbers, quotes, specific examples, dates, names.

4. Identify meaningful connections between items across tiers.

Return ONLY valid JSON:
{
  "category": "EXACT category name from the list above - must be one of: ${categoryNames.join(", ")}",
  "articleTitle": "concise title for this text",
  "articleDescription": "one-line summary",
  "items": [
    {
      "title": "item title",
      "description": "brief summary",
      "content": "detailed content or text excerpt",
      "tier": "wisdom|knowledge|information|data"
    }
  ],
  "connections": [
    { "from": "item title", "to": "item title", "reason": "connection reason" }
  ]
}

CRITICAL RULES:
- "category" MUST be exactly one of: ${categoryNames.join(", ")}
- Do NOT invent new categories. Choose the closest match.
- Aim for 4-8 items distributed across all 4 tiers.

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

  let categoryNode = categoryNodes.find((n) => n.title === result.category);
  if (!categoryNode) {
    categoryNode = categoryNodes.find(
      (n) => result.category.includes(n.title) || n.title.includes(result.category)
    );
  }
  if (!categoryNode) {
    categoryNode = categoryNodes[0];
  }

  const articleNode = await storage.createNode({
    parentId: categoryNode.id,
    level: 2,
    title: result.articleTitle,
    description: result.articleDescription,
    content: text,
    color: LEVEL_COLORS[2],
    icon: LEVEL_ICONS[2],
    sortOrder: 0,
  });

  const createdNodeMap = new Map<string, number>();
  createdNodeMap.set(result.articleTitle, articleNode.id);

  const tierLabels: Record<string, string> = {
    wisdom: "💡 지혜",
    knowledge: "📖 지식",
    information: "ℹ️ 정보",
    data: "📊 데이터",
  };

  const tierOrder = ["wisdom", "knowledge", "information", "data"] as const;
  let sortOrder = 0;

  for (const tier of tierOrder) {
    const tierItems = result.items.filter((item) => item.tier === tier);
    if (tierItems.length === 0) continue;

    for (const item of tierItems) {
      const node = await storage.createNode({
        parentId: articleNode.id,
        level: 3,
        title: `${tierLabels[tier]} ${item.title}`,
        description: item.description,
        content: item.content || null,
        color: LEVEL_COLORS[3],
        icon: LEVEL_ICONS[3],
        sortOrder: sortOrder++,
      });
      createdNodeMap.set(item.title, node.id);
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
    createdNodes: result.items.length + 1,
    subjectTitle: result.articleTitle,
    category: categoryNode.title,
    subjectId: articleNode.id,
  };
}
