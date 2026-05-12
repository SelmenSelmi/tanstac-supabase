import { desc } from "drizzle-orm";
import { db } from "./db";
import { todos } from "./schema";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });

const server = Bun.serve({
  port: 3001,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/todos") {
      if (request.method === "GET") {
        const rows = await db.select().from(todos).orderBy(desc(todos.createdAt));
        return json(rows);
      }

      if (request.method === "POST") {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        if (!payload || typeof payload !== "object" || !("text" in payload)) {
          return json({ error: "Text is required" }, 400);
        }

        const text = String((payload as { text: unknown }).text).trim();
        if (!text) {
          return json({ error: "Text is required" }, 400);
        }

        const [row] = await db.insert(todos).values({ text }).returning();
        return json(row, 201);
      }

      return json({ error: "Method not allowed" }, 405);
    }

    return json({ error: "Not found" }, 404);
  }
});

console.log(`API running at http://localhost:${server.port}`);
