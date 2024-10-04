import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Router } from "./router";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Router />
        </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
