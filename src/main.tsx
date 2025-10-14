import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./lib/queryClient";
import "./styles/global.css";
import App from "./App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
(async () => {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
})();
