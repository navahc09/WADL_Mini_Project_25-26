import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/apiClient";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.get("/admin/dashboard").then((response) => response.data),
  });
}

export function useAdminJobs() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: () => apiClient.get("/admin/jobs").then((response) => response.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload) =>
      apiClient.post("/admin/jobs", payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  return {
    ...query,
    createJob: createMutation.mutateAsync,
    isCreatingJob: createMutation.isPending,
  };
}

export function useAdminJob(jobId) {
  const { data: jobs = [] } = useAdminJobs();
  return jobs.find((j) => j.id === jobId) || null;
}

export function useUpdateJob(jobId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiClient.put(`/admin/jobs/${jobId}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useCloseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId) =>
      apiClient.post(`/admin/jobs/${jobId}/close`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
  });
}

export function useReopenJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId) =>
      apiClient.post(`/admin/jobs/${jobId}/reopen`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId) =>
      apiClient.delete(`/admin/jobs/${jobId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useAdminApplicants(jobId) {
  return useQuery({
    queryKey: ["admin", "applicants", jobId],
    queryFn: () =>
      apiClient.get(`/admin/jobs/${jobId}/applicants`).then((response) => response.data),
    enabled: Boolean(jobId),
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => apiClient.get("/admin/analytics").then((response) => response.data),
  });
}

export function useUpdateApplicantStatus(jobId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicantId, status }) =>
      apiClient
        .patch(`/admin/jobs/${jobId}/applicants/${applicantId}`, { status })
        .then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "applicants", jobId] });
    },
  });
}

export function useExportApplicants() {
  return useMutation({
    mutationFn: async (jobId) => {
      const response = await apiClient.get(`/admin/jobs/${jobId}/export`, {
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"] || "";
      const fileNameMatch = disposition.match(/filename="(.+?)"/);
      const fileName = fileNameMatch?.[1] || "applicants.xlsx";
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return fileName;
    },
  });
}
