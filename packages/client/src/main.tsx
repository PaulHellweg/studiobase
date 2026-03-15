import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, createTrpcClient } from "./lib/trpc";
import { AuthProvider } from "./context/AuthContext";
import { keycloak } from "./lib/keycloak";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import "./index.css";
import "./lib/i18n";

// Token getter that reads live from the Keycloak instance — always fresh
function getToken(): string | undefined {
  return keycloak.token;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const trpcClient = createTrpcClient(getToken);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </trpc.Provider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
