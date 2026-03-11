import { storage } from "./storage";

export async function seedDatabase() {
  const existing = await storage.getAllNodes();
  if (existing.length > 0) return;

  const philosophy = await storage.createNode({
    parentId: null,
    level: 1,
    title: "Philosophy",
    description: "The love of wisdom — exploring fundamental questions about existence, knowledge, values, and reason.",
    color: "#8B5CF6",
    icon: "Globe",
    sortOrder: 0,
  });

  const engineering = await storage.createNode({
    parentId: null,
    level: 1,
    title: "Engineering",
    description: "Applied sciences and mathematics to design, build, and optimize systems and structures.",
    color: "#7C3AED",
    icon: "Globe",
    sortOrder: 1,
  });

  const design = await storage.createNode({
    parentId: null,
    level: 1,
    title: "Design",
    description: "The art and science of creating intentional, beautiful, and functional experiences.",
    color: "#6D28D9",
    icon: "Globe",
    sortOrder: 2,
  });

  const science = await storage.createNode({
    parentId: null,
    level: 1,
    title: "Natural Science",
    description: "Understanding the physical world through observation, experimentation, and systematic study.",
    color: "#5B21B6",
    icon: "Globe",
    sortOrder: 3,
  });

  const existentialism = await storage.createNode({
    parentId: philosophy.id,
    level: 2,
    title: "Existentialism",
    description: "A philosophical movement emphasizing individual freedom, choice, and existence.",
    color: "#6D28D9",
    icon: "Layers",
    sortOrder: 0,
  });

  const ethics = await storage.createNode({
    parentId: philosophy.id,
    level: 2,
    title: "Ethics",
    description: "The branch of philosophy dealing with moral principles and right conduct.",
    color: "#6D28D9",
    icon: "Layers",
    sortOrder: 1,
  });

  const cs = await storage.createNode({
    parentId: engineering.id,
    level: 2,
    title: "Computer Science",
    description: "The study of computation, algorithms, data structures, and information systems.",
    color: "#5B21B6",
    icon: "Layers",
    sortOrder: 0,
  });

  const ux = await storage.createNode({
    parentId: design.id,
    level: 2,
    title: "UX Design",
    description: "User experience design — creating products that provide meaningful experiences.",
    color: "#4C1D95",
    icon: "Layers",
    sortOrder: 0,
  });

  const nietzsche = await storage.createNode({
    parentId: existentialism.id,
    level: 3,
    title: "Nietzsche's Philosophy",
    description: "Friedrich Nietzsche's ideas on will to power, eternal recurrence, and the Übermensch.",
    color: "#4C1D95",
    icon: "BookOpen",
    sortOrder: 0,
  });

  const algorithms = await storage.createNode({
    parentId: cs.id,
    level: 3,
    title: "Algorithms",
    description: "Step-by-step procedures for calculations and problem-solving.",
    color: "#6366F1",
    icon: "BookOpen",
    sortOrder: 0,
  });

  const userResearch = await storage.createNode({
    parentId: ux.id,
    level: 3,
    title: "User Research",
    description: "Methods and techniques for understanding user needs and behaviors.",
    color: "#4F46E5",
    icon: "BookOpen",
    sortOrder: 0,
  });

  const willToPower = await storage.createNode({
    parentId: nietzsche.id,
    level: 4,
    title: "Will to Power",
    description: "The fundamental driving force in humans — achievement, ambition, and the striving to reach the highest possible position in life.",
    content: "Nietzsche posits that the will to power is the main driving force in humans: achievement, ambition, and the striving to reach the highest possible position in life. This concept differs from Schopenhauer's 'will to live' and is not merely about domination over others.",
    color: "#6366F1",
    icon: "Lightbulb",
    sortOrder: 0,
  });

  const graphTheory = await storage.createNode({
    parentId: algorithms.id,
    level: 4,
    title: "Graph Theory",
    description: "Mathematical structures used to model pairwise relations between objects.",
    content: "Graph theory studies graphs — mathematical structures that model relationships. Key concepts include vertices, edges, paths, cycles, trees, and networks. Applications range from social networks to routing algorithms.",
    color: "#4F46E5",
    icon: "Lightbulb",
    sortOrder: 0,
  });

  await storage.createConnection({
    sourceId: willToPower.id,
    targetId: userResearch.id,
    description: "Nietzsche's concept of will to power can inform understanding of user motivation and intrinsic drives in UX research.",
  });

  await storage.createConnection({
    sourceId: graphTheory.id,
    targetId: ux.id,
    description: "Graph structures can model user navigation patterns and information architecture.",
  });

  await storage.createConnection({
    sourceId: ethics.id,
    targetId: userResearch.id,
    description: "Ethical considerations are fundamental to conducting responsible user research.",
  });

  console.log("Database seeded with example knowledge nodes and connections.");
}
