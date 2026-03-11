import { storage } from "./storage";
import { LEVEL_COLORS, LEVEL_ICONS } from "@shared/schema";

const TOP_CATEGORIES = [
  { title: "철학", description: "존재, 인식, 가치, 논리 등 근본적 질문을 탐구하는 학문", icon: "🧠" },
  { title: "종교", description: "신앙, 영성, 종교적 사상과 의례에 관한 학문", icon: "🕊️" },
  { title: "사회과학", description: "인간 사회의 구조, 제도, 행동을 연구하는 학문", icon: "🏛️" },
  { title: "자연과학", description: "자연 현상을 관찰, 실험, 체계적으로 연구하는 학문", icon: "🔬" },
  { title: "기술과학", description: "과학적 지식을 실용적으로 응용하는 학문과 기술", icon: "⚙️" },
  { title: "예술", description: "미적 표현과 창작 활동에 관한 학문", icon: "🎨" },
  { title: "언어", description: "언어의 구조, 사용, 습득에 관한 학문", icon: "📝" },
  { title: "문학", description: "문학 작품의 창작, 비평, 연구에 관한 학문", icon: "📚" },
  { title: "역사", description: "과거의 사건, 인물, 문화를 기록하고 해석하는 학문", icon: "📜" },
];

export { TOP_CATEGORIES };

export async function seedDatabase() {
  const existing = await storage.getAllNodes();
  if (existing.length > 0) return;

  for (let i = 0; i < TOP_CATEGORIES.length; i++) {
    const cat = TOP_CATEGORIES[i];
    await storage.createNode({
      parentId: null,
      level: 1,
      title: cat.title,
      description: cat.description,
      color: LEVEL_COLORS[1],
      icon: LEVEL_ICONS[1],
      sortOrder: i,
    });
  }

  console.log("Database seeded with 9 top-level categories.");
}
