import { createRoot } from "react-dom/client";
import { setDefaultHeaders } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

function getOrCreateSessionId(): string {
  const key = "darck-arana-session-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

setDefaultHeaders({ "x-session-id": getOrCreateSessionId() });

createRoot(document.getElementById("root")!).render(<App />);
