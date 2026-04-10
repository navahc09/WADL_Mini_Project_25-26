import { useQuery } from "@tanstack/react-query";
import apiClient from "../lib/apiClient";

export function useJobs(filters = {}) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: () =>
      apiClient.get("/jobs", { params: filters }).then((response) => response.data),
  });
}

export function useJob(id) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => apiClient.get(`/jobs/${id}`).then((response) => response.data),
    enabled: Boolean(id),
  });
}
