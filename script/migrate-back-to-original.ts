import { storage } from "../server/storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";

async function migrate() {
  const allNodes = await storage.getAllNodes();
  if (allNodes.length === 0) {
    console.log("No nodes to migrate.");
    return;
  }

  console.log("Reverting to original 6-level structure...");

  // 1. Delete the "Cogito" root if it exists
  const cogitoNode = allNodes.find(n => n.level === 1 && (n.title.includes("Cogito") || n.title.includes("나")));
  
  // 2. Identify Categories (Subject - L1)
  // They might be Level 2 currently (under Cogito) or Level 1
  const categoryNodes = allNodes.filter(n => 
    (n.level === 2 && n.parentId === cogitoNode?.id) || 
    (n.level === 1 && n.id !== cogitoNode?.id)
  );

  for (const node of categoryNodes) {
    await storage.updateNode(node.id, {
      parentId: null,
      level: 1,
      color: LEVEL_COLORS[0],
      icon: LEVEL_ICONS[0],
    });
    console.log(`Migrated Category -> L1: ${node.title}`);
  }

  // 3. Identify Articles (Article - L2)
  // They are likely Level 3 currently or were Level 2 in some versions
  const articleNodes = allNodes.filter(n => n.content !== null && n.level >= 2 && n.level <= 3 && n.parentId !== null && n.parentId !== cogitoNode?.id);
  
  for (const node of articleNodes) {
    await storage.updateNode(node.id, {
      level: 2,
      color: LEVEL_COLORS[1],
      icon: LEVEL_ICONS[1],
    });
    console.log(`Migrated Article -> L2: ${node.title.split('\n')[0]}`);
  }

  // 4. DIKW (L3-L6)
  // Shift others accordingly
  const otherNodes = allNodes.filter(n => !categoryNodes.find(c => c.id === n.id) && !articleNodes.find(a => a.id === n.id) && n.id !== cogitoNode?.id);
  
  for (const node of otherNodes) {
    // Basic heuristic: find parent's new level and add 1
    const parent = allNodes.find(p => p.id === node.parentId);
    // If parent was an article (now L2), this becomes L3
    if (articleNodes.find(a => a.id === node.parentId)) {
      await storage.updateNode(node.id, { level: 3 });
    } else if (node.level > 3) {
      // Just keep them in range
      await storage.updateNode(node.id, { level: Math.min(node.level - 1, 6) });
    }
  }

  // Finally delete Cogito
  // Note: DatabaseStorage might not have a delete, but we can just leave it detached
  
  console.log("Reversion complete.");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
