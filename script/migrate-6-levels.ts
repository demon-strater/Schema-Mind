import { storage } from "../server/storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";

async function migrate() {
  const allNodes = await storage.getAllNodes();
  if (allNodes.length === 0) {
    console.log("No nodes to migrate.");
    return;
  }

  console.log("Starting migration to 6-level structure...");

  // 1. Root Cogito (나 - L1)
  let cogitoNode = allNodes.find(n => n.level === 1 && (n.title.includes("Cogito") || n.title.includes("나")));
  if (cogitoNode) {
    await storage.updateNode(cogitoNode.id, {
      title: "나 (Cogito)",
      color: LEVEL_COLORS[0],
      icon: LEVEL_ICONS[0],
    });
  }

  // 2. Categories (분류 - L2)
  const categoryNodes = allNodes.filter(n => n.level === 2);
  for (const node of categoryNodes) {
    await storage.updateNode(node.id, {
      color: LEVEL_COLORS[1],
      icon: LEVEL_ICONS[1],
    });
  }

  // 3. Wisdom (지혜 - L3)
  // Mapping: Old L3 (Thesis) -> New L3, Old L4 (Wisdom) -> New L3
  const oldL3 = allNodes.filter(n => n.level === 3);
  const oldL4 = allNodes.filter(n => n.level === 4);
  
  for (const node of oldL3) {
    await storage.updateNode(node.id, {
      level: 3,
      color: LEVEL_COLORS[2],
      icon: LEVEL_ICONS[2],
    });
  }
  for (const node of oldL4) {
    await storage.updateNode(node.id, {
      level: 3,
      color: LEVEL_COLORS[2],
      icon: LEVEL_ICONS[2],
    });
  }

  // 4. Knowledge (지식 - L4)
  const oldL5 = allNodes.filter(n => n.level === 5);
  for (const node of oldL5) {
    await storage.updateNode(node.id, {
      level: 4,
      color: LEVEL_COLORS[3],
      icon: LEVEL_ICONS[3],
    });
  }

  // 5. Information (정보 - L5)
  const oldL6 = allNodes.filter(n => n.level === 6);
  for (const node of oldL6) {
    await storage.updateNode(node.id, {
      level: 5,
      color: LEVEL_COLORS[4],
      icon: LEVEL_ICONS[4],
    });
  }

  // 6. Data (데이터 - L6)
  const oldL7 = allNodes.filter(n => n.level === 7);
  const oldL8 = allNodes.filter(n => n.level === 8);
  for (const node of oldL7) {
    await storage.updateNode(node.id, {
      level: 6,
      color: LEVEL_COLORS[5],
      icon: LEVEL_ICONS[5],
    });
  }
  for (const node of oldL8) {
    await storage.updateNode(node.id, {
      level: 6,
      color: LEVEL_COLORS[5],
      icon: LEVEL_ICONS[5],
    });
  }

  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
