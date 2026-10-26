import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { POLL_INTERVAL } from "../lib/fields";
import { useWorkspace } from "./useWorkspace";
export function useHealth() {
  const { connection, revision } = useWorkspace();
  return useQuery({
    queryKey: ["health", revision],
    queryFn: ({ signal }) => api.health(connection, signal),
    refetchInterval: POLL_INTERVAL,
    retry: false,
  });
}
export function useDrift() {
  const { connection, revision } = useWorkspace();
  return useQuery({
    queryKey: ["drift", revision],
    queryFn: ({ signal }) => api.drift(connection, signal),
    refetchInterval: POLL_INTERVAL,
    retry: false,
  });
}
export function useModelInfo() {
  const { connection, revision } = useWorkspace();
  return useQuery({
    queryKey: ["model-info", revision],
    queryFn: ({ signal }) => api.modelInfo(connection, signal),
    retry: false,
    staleTime: POLL_INTERVAL,
  });
}
