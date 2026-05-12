import { storage } from "./storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";

export const TOP_CATEGORIES = [
  { title: "철학", description: "존재, 인식, 가치, 논리 등 근본적 질문을 탐구하는 학문", icon: "🧠" },
  { title: "종교", description: "초월적 존재, 신앙, 영성 및 도덕적 가치를 다루는 체계", icon: "🛐" },
  { title: "사회과학", description: "사회 구조, 인간 관계, 정치, 경제 등을 연구하는 학문", icon: "👥" },
  { title: "자연과학", description: "물질 세계와 자연 현상의 원리를 탐구하는 학문", icon: "🔬" },
  { title: "기술과학", description: "과학적 지식을 실용적으로 응용하는 공학 및 기술", icon: "🛠️" },
  { title: "예술", description: "인간의 창의적 표현, 미적 가치 및 시각/공연 예술", icon: "🎨" },
  { title: "언어", description: "의사소통의 도구로서의 언어, 문법 및 기호 체계", icon: "🗣️" },
  { title: "문학", description: "언어를 매체로 한 예술 작품, 소설, 시, 비평 등", icon: "📚" },
  { title: "역사", description: "인류 과거의 사건, 변천 및 문명의 발전 기록", icon: "📜" },
];

export async function seedDatabase() {
  const existing = await storage.getAllNodes();
  if (existing.length > 0) return;

  // Create Root "나" Node (Level 1)
  const rootNode = await storage.createNode({
    parentId: null,
    level: 1, // Cogito
    title: "나 (Cogito)",
    description: "지식의 근원이자 목적. 창의적 동기 부여. 개인의 철학, 가치관, 장기적 비전.",
    color: LEVEL_COLORS[0],
    icon: LEVEL_ICONS[0],
    sortOrder: 0,
  });

  // Create Domain Nodes (Level 2) under "나"
  for (let i = 0; i < TOP_CATEGORIES.length; i++) {
    const cat = TOP_CATEGORIES[i];
    await storage.createNode({
      parentId: rootNode.id,
      level: 2, // Category
      title: cat.title,
      description: cat.description,
      color: LEVEL_COLORS[1],
      icon: LEVEL_ICONS[1],
      sortOrder: i,
    });
  }

  console.log("Database seeded with '나' root and 9 categories.");
}
