import OpenAI from "openai";
import { z } from "zod";
import { storage } from "./storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";
import { TOP_CATEGORIES } from "./seed";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY must be set.");
}

const baseURL = process.env.OPENAI_BASE_URL;
const openai = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
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
  articleAuthor: z.string().default("알 수 없음"),
  articleDate: z.string().default(new Date().toLocaleDateString("ko-KR")),
  articleSummary: z.string().min(1),
  items: z.array(analysisItemSchema).min(1),
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    reason: z.string(),
  })).default([]),
});

const TIER_LEVEL: Record<string, number> = {
  wisdom: 3,
  knowledge: 4,
  information: 5,
  data: 6,
};

const tierLabels: Record<string, string> = {
  wisdom: "💡 지혜",
  knowledge: "📖 지식",
  information: "ℹ️ 정보",
  data: "📊 데이터",
};

const tierOrder = ["wisdom", "knowledge", "information", "data"] as const;

export async function analyzeText(text: string): Promise<{ createdNodes: number; subjectTitle: string; category: string; subjectId: number }> {
  const allNodes = await storage.getAllNodes();
  const categoryNodes = allNodes.filter((n) => n.level === 2); // Category nodes under Cogito

  if (categoryNodes.length === 0) {
    throw new Error("분석을 위한 분류(Category) 노드가 존재하지 않습니다. 데이터베이스 초기화가 필요합니다.");
  }

  const prompt = `You are a knowledge architect. Analyze the following text and:

1. Determine which ONE of these 9 categories it belongs to (you MUST pick one):
${categoryNames.map((name, i) => `   ${i + 1}. ${name}`).join("\n")}

2. Extract metadata:
   - articleTitle: A concise title for the text.
   - articleAuthor: The author if mentioned, otherwise "알 수 없음".
   - articleDate: The date mentioned or today's date if not found.
   - articleSummary: A detailed 3-4 sentence paragraph summarizing the text.

3. Classify information into exactly one of these 4 tiers. EXTRACT AS MUCH DETAIL AS POSSIBLE (Aim for 15-25 items total):
- **wisdom** (지혜): Core principles, deep insights, universal truths, philosophical takeaways, and creative synthesis/outcomes.
- **knowledge** (지식): Organized understanding, theories, frameworks, structured concepts.
- **information** (정보): Contextual facts, specific explanations, definitions.
- **data** (데이터): Raw facts, numbers, quotes, specific examples, dates, names.

4. Identify meaningful connections between items across tiers.

Return ONLY valid JSON:
{
  "category": "EXACT category name from the list above",
  "articleTitle": "concise title",
  "articleAuthor": "author name",
  "articleDate": "YYYY-MM-DD",
  "articleSummary": "detailed paragraph summary",
  "items": [
    {
      "title": "very specific and descriptive item title",
      "description": "a thorough 2-3 sentence summary of this specific item",
      "content": "detailed explanation, supporting evidence, or relevant text excerpt (at least 200-300 characters)",
      "tier": "wisdom|knowledge|information|data"
    }
  ],
  "connections": [
    { "from": "item title", "to": "item title", "reason": "detailed connection reason" }
  ]
}

CRITICAL RULES:
- "category" MUST be exactly one of: ${categoryNames.join(", ")}
- Extract a LARGE number of items (15-25) to provide a rich, detailed mind map.
- The first 'wisdom' item should represent the core thesis of the article.

TEXT TO ANALYZE:
${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI로부터 응답을 받지 못했습니다.");

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI가 유효한 JSON을 반환하지 않았습니다.");
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

  const createdNodeMap = new Map<string, number>();

  const itemsByTier: Record<string, typeof result.items> = {
    wisdom: [],
    knowledge: [],
    information: [],
    data: [],
  };
  for (const item of result.items) {
    itemsByTier[item.tier].push(item);
  }

  let lastTierFirstNodeId = categoryNode.id;

  for (const tier of tierOrder) {
    const items = itemsByTier[tier];
    if (items.length === 0) continue;

    const level = TIER_LEVEL[tier];
    const parentId = lastTierFirstNodeId;
    let firstNodeId: number | null = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isFirstWisdom = tier === "wisdom" && i === 0;
      
      const node = await storage.createNode({
        parentId,
        level,
        title: `${tierLabels[tier]} ${item.title}`,
        description: item.description,
        content: isFirstWisdom ? text : (item.content || null),
        color: LEVEL_COLORS[level - 1],
        icon: LEVEL_ICONS[level - 1],
        sortOrder: i,
      });
      createdNodeMap.set(item.title, node.id);
      if (firstNodeId === null) {
        firstNodeId = node.id;
      }
    }

    if (firstNodeId !== null) {
      lastTierFirstNodeId = firstNodeId;
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
    createdNodes: result.items.length,
    subjectTitle: result.articleTitle,
    category: categoryNode.title,
    subjectId: lastTierFirstNodeId,
  };
}
