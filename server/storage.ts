import { eq, isNull, asc } from "drizzle-orm";
import { db } from "./db";
import {
  knowledgeNodes,
  connections,
  type KnowledgeNode,
  type InsertNode,
  type Connection,
  type InsertConnection,
  type User,
  type InsertUser,
  users,
} from "@shared/schema";

export interface IStorage {
  getNodesByParent(parentId: number | null): Promise<KnowledgeNode[]>;
  getAllNodes(): Promise<KnowledgeNode[]>;
  getNode(id: number): Promise<KnowledgeNode | undefined>;
  createNode(node: InsertNode): Promise<KnowledgeNode>;
  updateNode(id: number, data: Partial<InsertNode>): Promise<KnowledgeNode>;
  deleteNode(id: number): Promise<void>;
  getConnections(): Promise<Connection[]>;
  createConnection(conn: InsertConnection): Promise<Connection>;
  deleteConnection(id: number): Promise<void>;
  getStats(): Promise<{ totalNodes: number; levelCounts: Record<number, number>; connectionCount: number }>;
}

export class DatabaseStorage implements IStorage {
  async getNodesByParent(parentId: number | null): Promise<KnowledgeNode[]> {
    if (parentId === null) {
      return db.select().from(knowledgeNodes).where(isNull(knowledgeNodes.parentId)).orderBy(asc(knowledgeNodes.sortOrder));
    }
    return db.select().from(knowledgeNodes).where(eq(knowledgeNodes.parentId, parentId)).orderBy(asc(knowledgeNodes.sortOrder));
  }

  async getAllNodes(): Promise<KnowledgeNode[]> {
    return db.select().from(knowledgeNodes);
  }

  async getNode(id: number): Promise<KnowledgeNode | undefined> {
    const [node] = await db.select().from(knowledgeNodes).where(eq(knowledgeNodes.id, id));
    return node;
  }

  async createNode(node: InsertNode): Promise<KnowledgeNode> {
    const [created] = await db.insert(knowledgeNodes).values(node).returning();
    return created;
  }

  async updateNode(id: number, data: Partial<InsertNode>): Promise<KnowledgeNode> {
    const [updated] = await db.update(knowledgeNodes).set(data).where(eq(knowledgeNodes.id, id)).returning();
    return updated;
  }

  async deleteNode(id: number): Promise<void> {
    const children = await db.select().from(knowledgeNodes).where(eq(knowledgeNodes.parentId, id));
    for (const child of children) {
      await this.deleteNode(child.id);
    }
    await db.delete(connections).where(
      eq(connections.sourceId, id)
    );
    await db.delete(connections).where(
      eq(connections.targetId, id)
    );
    await db.delete(knowledgeNodes).where(eq(knowledgeNodes.id, id));
  }

  async getConnections(): Promise<Connection[]> {
    return db.select().from(connections);
  }

  async createConnection(conn: InsertConnection): Promise<Connection> {
    const [created] = await db.insert(connections).values(conn).returning();
    return created;
  }

  async deleteConnection(id: number): Promise<void> {
    await db.delete(connections).where(eq(connections.id, id));
  }

  async getStats(): Promise<{ totalNodes: number; levelCounts: Record<number, number>; connectionCount: number }> {
    const allNodes = await this.getAllNodes();
    const allConns = await this.getConnections();
    const levelCounts: Record<number, number> = {};
    allNodes.forEach((n) => {
      levelCounts[n.level] = (levelCounts[n.level] || 0) + 1;
    });
    return {
      totalNodes: allNodes.length,
      levelCounts,
      connectionCount: allConns.length,
    };
  }
}

export const storage = new DatabaseStorage();
