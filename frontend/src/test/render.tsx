import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { ThemeProvider } from "../hooks/useTheme";
import { WorkspaceProvider } from "../hooks/useWorkspace";
import { ToastProvider } from "../components/ui/Toast";
export function renderWorkspace(children: ReactNode, path = "/en/recommend") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <WorkspaceProvider>
        <ThemeProvider>
          <ToastProvider>
            <Tooltip.Provider>
              <MotionConfig reducedMotion="always">
                <MemoryRouter initialEntries={[path]}>
                  <Routes>
                    <Route path="/:locale/*" element={children} />
                  </Routes>
                </MemoryRouter>
              </MotionConfig>
            </Tooltip.Provider>
          </ToastProvider>
        </ThemeProvider>
      </WorkspaceProvider>
    </QueryClientProvider>,
  );
}
