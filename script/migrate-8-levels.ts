import { storage } from "../server/storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";

async function migrate() {
  const allNodes = await storage.getAllNodes();
  if (allNodes.length === 0) {
    console.log("No nodes to migrate.");
    return;
  }

  console.log("Starting migration to 8-level structure...");

  // 1. Find or create root Cogito node
  let cogitoNode = allNodes.find(n => n.level === 1 && n.title.includes("Cogito"));
  if (!cogitoNode) {
    console.log("Creating root Cogito node...");
    cogitoNode = await storage.createNode({
      parentId: null,
      level: 1,
      title: "Cogito (자아)",
      description: "지식의 근원이자 목적. 창의적 동기 부여. 개인의 철학, 가치관, 장기적 비전.",
      color: LEVEL_COLORS[0],
      icon: LEVEL_ICONS[0],
      sortOrder: 0,
    });
  }

  // 2. Update existing Category nodes (old L1) to Domain nodes (L2) under Cogito
  const oldCategories = allNodes.filter(n => n.level === 1 && n.id !== cogitoNode?.id);
  for (const cat of oldCategories) {
    await storage.updateNode(cat.id, {
      parentId: cogitoNode.id,
      level: 2,
      color: LEVEL_COLORS[1],
      icon: LEVEL_ICONS[1],
    });
    console.log(`Migrated Category -> Domain: ${cat.title}`);
  }

  // 3. Update existing Article nodes (old L2) to Thesis nodes (L3)
  const oldArticles = allNodes.filter(n => n.level === 2);
  for (const art of oldArticles) {
    await storage.updateNode(art.id, {
      level: 3,
      color: LEVEL_COLORS[2],
      icon: LEVEL_ICONS[2],
    });
    console.log(`Migrated Article -> Thesis: ${art.title.split('\n')[0]}`);
  }

  // 4. Update DIKW nodes (old L3-L6) to new levels (L4-L7)
  const dict: Record<number, number> = { 3: 4, 4: 5, 5: 6, 6: 7 };
  const dikwNodes = allNodes.filter(n => n.level >= 3 && n.level <= 6);
  for (const node of dikwNodes) {
    const newLevel = dict[node.level];
    await storage.updateNode(node.id, {
      level: newLevel,
      color: LEVEL_COLORS[newLevel - 1],
      icon: LEVEL_ICONS[newLevel - 1],
    });
  }
  console.log(`Migrated ${dikwNodes.length} DIKW nodes to new levels.`);

  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
