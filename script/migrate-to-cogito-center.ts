import { storage } from "../server/storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";

async function migrate() {
  const allNodes = await storage.getAllNodes();
  if (allNodes.length === 0) {
    console.log("No nodes to migrate.");
    return;
  }

  console.log("Migrating to '나' center 6-level structure...");

  // 1. Find or create root "나" node
  let cogitoNode = allNodes.find(n => n.level === 1 && (n.title.includes("Cogito") || n.title.includes("나")));
  if (!cogitoNode) {
    console.log("Creating root '나' node...");
    cogitoNode = await storage.createNode({
      parentId: null,
      level: 1,
      title: "나 (Cogito)",
      description: "지식의 근원이자 목적.",
      color: LEVEL_COLORS[0],
      icon: LEVEL_ICONS[0],
      sortOrder: 0,
    });
  } else {
    await storage.updateNode(cogitoNode.id, { parentId: null, level: 1 });
  }

  // 2. Categories (분류 - L2) under "나"
  // These are nodes that were previously roots (L1)
  const categoryNodes = allNodes.filter(n => n.level === 1 && n.id !== cogitoNode?.id);
  for (const node of categoryNodes) {
    await storage.updateNode(node.id, {
      parentId: cogitoNode.id,
      level: 2,
      color: LEVEL_COLORS[1],
      icon: LEVEL_ICONS[1],
    });
    console.log(`Migrated Category -> L2: ${node.title}`);
  }

  // 3. Articles/Wisdom (L3) under Categories
  // Previous L2 nodes (Articles)
  const articleNodes = allNodes.filter(n => n.level === 2 && n.id !== cogitoNode?.id);
  for (const node of articleNodes) {
    await storage.updateNode(node.id, {
      level: 3,
      color: LEVEL_COLORS[2],
      icon: LEVEL_ICONS[2],
    });
    console.log(`Migrated Article/Wisdom -> L3: ${node.title.split('\n')[0]}`);
  }

  // 4. DIKW (L4-L6)
  const dict: Record<number, number> = { 3: 4, 4: 5, 5: 6, 6: 6 };
  const otherNodes = allNodes.filter(n => n.level >= 3);
  for (const node of otherNodes) {
    const newLevel = dict[node.level] || 6;
    await storage.updateNode(node.id, {
      level: newLevel,
      color: LEVEL_COLORS[newLevel - 1],
      icon: LEVEL_ICONS[newLevel - 1],
    });
  }

  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
