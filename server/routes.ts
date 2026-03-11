import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNodeSchema, insertConnectionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { analyzeText } from "./ai";

function parseId(value: string): number | null {
  const num = parseInt(value, 10);
  return Number.isNaN(num) || num <= 0 ? null : num;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/nodes", async (req, res) => {
    try {
      const parentId = req.query.parentId;
      if (parentId === undefined || parentId === "root" || parentId === "null") {
        const nodes = await storage.getNodesByParent(null);
        return res.json(nodes);
      }
      const id = parseId(parentId as string);
      if (id === null) {
        return res.status(400).json({ message: "Invalid parentId" });
      }
      const nodes = await storage.getNodesByParent(id);
      return res.json(nodes);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      return res.status(500).json({ message: "Failed to fetch nodes" });
    }
  });

  app.get("/api/nodes/all", async (_req, res) => {
    try {
      const nodes = await storage.getAllNodes();
      return res.json(nodes);
    } catch (error) {
      console.error("Error fetching all nodes:", error);
      return res.status(500).json({ message: "Failed to fetch nodes" });
    }
  });

  app.post("/api/nodes", async (req, res) => {
    try {
      const data = insertNodeSchema.parse(req.body);
      if (data.parentId !== null && data.parentId !== undefined) {
        const parent = await storage.getNode(data.parentId);
        if (!parent) {
          return res.status(400).json({ message: "Parent node does not exist" });
        }
      }
      const node = await storage.createNode(data);
      return res.status(201).json(node);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating node:", error);
      return res.status(500).json({ message: "Failed to create node" });
    }
  });

  app.delete("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "Invalid node id" });
      }
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      await storage.deleteNode(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting node:", error);
      return res.status(500).json({ message: "Failed to delete node" });
    }
  });

  app.get("/api/connections", async (_req, res) => {
    try {
      const conns = await storage.getConnections();
      return res.json(conns);
    } catch (error) {
      console.error("Error fetching connections:", error);
      return res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      const data = insertConnectionSchema.parse(req.body);
      if (data.sourceId === data.targetId) {
        return res.status(400).json({ message: "Cannot create a self-link" });
      }
      const source = await storage.getNode(data.sourceId);
      const target = await storage.getNode(data.targetId);
      if (!source || !target) {
        return res.status(400).json({ message: "Source or target node does not exist" });
      }
      const conn = await storage.createConnection(data);
      return res.status(201).json(conn);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating connection:", error);
      return res.status(500).json({ message: "Failed to create connection" });
    }
  });

  app.delete("/api/connections/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "Invalid connection id" });
      }
      await storage.deleteConnection(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting connection:", error);
      return res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { text, subjectId } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ message: "Text is required" });
      }
      if (text.length > 50000) {
        return res.status(400).json({ message: "Text is too long (max 50,000 characters)" });
      }
      let parsedSubjectId: number | undefined;
      if (subjectId) {
        const id = parseId(String(subjectId));
        if (id === null) {
          return res.status(400).json({ message: "Invalid subjectId" });
        }
        parsedSubjectId = id;
      }
      const result = await analyzeText(text.trim(), parsedSubjectId);
      return res.json(result);
    } catch (error: any) {
      console.error("Error analyzing text:", error);
      const status = error.message?.includes("not found") || error.message?.includes("not a subject") ? 400 : 500;
      return res.status(status).json({ message: error.message || "Failed to analyze text" });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
