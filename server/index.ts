import { createClient } from "@supabase/supabase-js";

type TodoRow = {
  id: number;
  text: string;
  done: boolean;
  created_at: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const toApiTodo = (row: TodoRow) => ({
  id: row.id,
  text: row.text,
  done: row.done,
  createdAt: row.created_at
});

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
        const { data, error } = await supabase
          .from("todos")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          return json({ error: error.message }, 500);
        }

        return json((data ?? []).map(toApiTodo));
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

        const { data, error } = await supabase
          .from("todos")
          .insert({ text })
          .select("*")
          .single();

        if (error || !data) {
          return json({ error: error?.message ?? "Failed to create todo" }, 500);
        }

        return json(toApiTodo(data), 201);
      }

      return json({ error: "Method not allowed" }, 405);
    }

    return json({ error: "Not found" }, 404);
  }
});

console.log(`API running at http://localhost:${server.port}`);
