import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
};

export const Route = createFileRoute("/")({
  component: IndexRoute
});

function IndexRoute() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const todosQuery = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos
  });

  const createTodo = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    }
  });

  return (
    <section className="card">
      <form
        className="todo-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) {
            return;
          }
          createTodo.mutate(text);
        }}
      >
        <input
          className="todo-input"
          placeholder="Add a todo"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button className="todo-button" type="submit" disabled={createTodo.isPending}>
          Add
        </button>
      </form>

      {todosQuery.isLoading ? (
        <div>Loading todos...</div>
      ) : todosQuery.error ? (
        <div className="status">Failed to load todos.</div>
      ) : (
        <ul className="todo-list">
          {todosQuery.data?.map((todo) => (
            <li key={todo.id} className="todo-item">
              <div>
                <div>{todo.text}</div>
                <div className="todo-meta">{new Date(todo.createdAt).toLocaleString()}</div>
              </div>
              <div>{todo.done ? "Done" : "Open"}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch("/api/todos");
  if (!response.ok) {
    throw new Error("Failed to fetch todos");
  }
  return response.json();
}

async function addTodo(text: string): Promise<Todo> {
  const response = await fetch("/api/todos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error("Failed to create todo");
  }

  return response.json();
}
