import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/apiClient";

export function useInterviewRounds(appId) {
  return useQuery({
    queryKey: ["interview", "rounds", appId],
    queryFn: () =>
      apiClient.get(`/admin/applications/${appId}/rounds`).then((r) => r.data),
    enabled: Boolean(appId),
  });
}

export function useScheduleRound(appId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiClient.post(`/admin/applications/${appId}/rounds`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview", "rounds", appId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "applicants"] });
    },
  });
}

export function useUpdateRoundResult(appId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roundId, result, notes }) =>
      apiClient
        .patch(`/admin/applications/${appId}/rounds/${roundId}`, { result, notes })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview", "rounds", appId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "applicants"] });
    },
  });
}
