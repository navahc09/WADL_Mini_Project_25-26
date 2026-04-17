import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/apiClient";

export function useApplications(status = "all") {
  return useQuery({
    queryKey: ["applications", status],
    queryFn: () =>
      apiClient
        .get("/applications", {
          params: status === "all" ? {} : { status },
      })
      .then((response) => response.data),
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, documentId }) =>
      apiClient
        .post("/applications", { jobId, documentId: documentId || undefined })
        .then((response) => response.data),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });
}

export function useApplication(id) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: () =>
      apiClient.get(`/applications/${id}`).then((response) => response.data),
    enabled: Boolean(id),
  });
}

export function useChangeApplicationResume(applicationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId) =>
      apiClient
        .patch(`/applications/${applicationId}/resume`, { documentId })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
