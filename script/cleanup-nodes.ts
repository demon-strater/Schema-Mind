import { storage } from "../server/storage";

async function cleanup() {
  const allNodes = await storage.getAllNodes();
  const articleNodes = allNodes.filter(n => n.level === 2 && n.content);

  console.log(`Cleaning up ${articleNodes.length} article nodes...`);

  for (const node of articleNodes) {
    // Extract title from "[Title]\n..." format if possible
    let title = node.title;
    const titleMatch = node.title.match(/^\[(.*?)\]/);
    if (titleMatch) {
      title = titleMatch[1];
    }

    // Extract date if possible, otherwise use created_at
    let dateStr = new Date(node.createdAt || new Date()).toLocaleDateString("ko-KR");
    const dateMatch = node.title.match(/📅 날짜: (.*?)(\n|$)/);
    if (dateMatch) {
      dateStr = dateMatch[1].trim();
    }

    const newTitle = `[${title}]\n📅 날짜: ${dateStr}`;
    
    await storage.updateNode(node.id, {
      title: newTitle
    });
    console.log(`Updated node ${node.id}: ${title}`);
  }

  console.log("Cleanup complete.");
  process.exit(0);
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
