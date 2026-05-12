import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent
});

function RootComponent() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">TanStack + Drizzle + Supabase</div>
        <div className="app-subtitle">Bun + Vite + React demo</div>
      </header>
      <Outlet />
    </div>
  );
}
