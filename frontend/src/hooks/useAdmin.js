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
    mutationFn: ({ applicantId, status, reason }) =>
      apiClient
        .patch(`/admin/jobs/${jobId}/applicants/${applicantId}`, { status, reason })
        .then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "applicants", jobId] });
    },
  });
}

export function useAuditLogs({ entityType, entityId } = {}) {
  return useQuery({
    queryKey: ["audit-logs", entityType, entityId],
    queryFn: () =>
      apiClient.get("/admin/audit-logs", { params: { entityType, entityId } }).then((r) => r.data),
    enabled: Boolean(entityType),
  });
}

export function useValidateJD() {
  return useMutation({
    mutationFn: (payload) =>
      apiClient.post("/admin/jobs/validate", payload).then((r) => r.data),
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

// ── Export Templates ───────────────────────────────────────────────────────────

export function useExportTemplate(companyId) {
  return useQuery({
    queryKey: ["admin", "export-template", companyId],
    queryFn: () =>
      apiClient.get(`/admin/companies/${companyId}/export-template`).then((r) => r.data),
    enabled: Boolean(companyId),
  });
}

export function useSaveExportTemplate(companyId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiClient.put(`/admin/companies/${companyId}/export-template`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "export-template", companyId] });
    },
  });
}

// ── Bulk Import ────────────────────────────────────────────────────────────────

export function useBulkUpload() {
  return useMutation({
    mutationFn: (formData) =>
      apiClient
        .post("/admin/students/bulk-upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data),
  });
}

export function useBulkConfirm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows) =>
      apiClient.post("/admin/students/bulk-confirm", { rows }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
  });
}

export function useImportFieldDefs() {
  return useQuery({
    queryKey: ["admin", "import-fields"],
    queryFn: () =>
      apiClient.get("/admin/students/import/fields").then((r) => r.data),
    staleTime: Infinity,
  });
}

// ── Bulk Actions ───────────────────────────────────────────────────────────────

export function useBulkActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-students"] });

  const activate = useMutation({
    mutationFn: (ids) =>
      apiClient.post("/admin/students/bulk-activate", { ids }).then((r) => r.data),
    onSuccess: invalidate,
  });

  const deactivate = useMutation({
    mutationFn: (ids) =>
      apiClient.post("/admin/students/bulk-deactivate", { ids }).then((r) => r.data),
    onSuccess: invalidate,
  });

  const assignBranch = useMutation({
    mutationFn: ({ ids, branch, graduationYear }) =>
      apiClient
        .post("/admin/students/bulk-assign-branch", { ids, branch, graduationYear })
        .then((r) => r.data),
    onSuccess: invalidate,
  });

  return { activate, deactivate, assignBranch };
}
