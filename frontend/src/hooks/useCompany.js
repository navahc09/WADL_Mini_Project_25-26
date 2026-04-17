import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/apiClient";

export function useCompanies(filters = {}) {
  return useQuery({
    queryKey: ["companies", filters],
    queryFn: () =>
      apiClient.get("/companies", { params: filters }).then((r) => r.data),
  });
}

export function useCompany(id) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: () => apiClient.get(`/companies/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("/companies", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useUpdateCompany(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.patch(`/companies/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company", id] });
    },
  });
}

export function useAddTimelineEvent(companyId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiClient.post(`/companies/${companyId}/timeline`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company", companyId] }),
  });
}

export function useAddContactLog(companyId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiClient.post(`/companies/${companyId}/contacts`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company", companyId] }),
  });
}
