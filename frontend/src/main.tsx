import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import "./lib/i18n";
import "./styles/index.css";
import App from "./App";
import { ThemeProvider } from "./hooks/useTheme";
import { WorkspaceProvider } from "./hooks/useWorkspace";
import { ToastProvider } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={client}>
          <WorkspaceProvider>
            <ToastProvider>
              <Tooltip.Provider delayDuration={250}>
                <MotionConfig reducedMotion="user">
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </MotionConfig>
              </Tooltip.Provider>
            </ToastProvider>
          </WorkspaceProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
