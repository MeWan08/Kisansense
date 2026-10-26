import { createContext, useContext, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Connection } from "../lib/api/schemas";
import { readStorage, writeStorage } from "../lib/storage";
import { MAX_OBSERVATIONS } from "../lib/fields";
export interface Observation {
  at: number;
  latency: number;
  confidence: number;
}
interface Workspace {
  connection: Connection;
  setConnection: (c: Connection) => void;
  observations: Observation[];
  record: (o: Observation) => void;
  revision: number;
}
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const query = useQueryClient();
  const [revision, setRevision] = useState(0);
  const [connection, set] = useState<Connection>(() => ({
    baseUrl:
      readStorage("ks-url") ||
      import.meta.env.VITE_API_URL ||
      "http://127.0.0.1:8000",
    apiKey: import.meta.env.VITE_API_KEY || "",
    mock: import.meta.env.VITE_USE_MOCK === "true",
  }));
  const [observations, setObservations] = useState<Observation[]>([]);
  function setConnection(next: Connection) {
    void query.cancelQueries();
    query.clear();
    set(next);
    setRevision((n) => n + 1);
    setObservations([]);
    writeStorage("ks-url", next.baseUrl);
  }
  return (
    <Context.Provider
      value={{
        connection,
        setConnection,
        observations,
        revision,
        record: (o) =>
          setObservations((prev) => [...prev, o].slice(-MAX_OBSERVATIONS)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("WorkspaceProvider required");
  return context;
}
