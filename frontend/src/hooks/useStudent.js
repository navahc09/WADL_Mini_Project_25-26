import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/apiClient";

export function useStudentDashboard() {
  return useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => apiClient.get("/students/me/dashboard").then((response) => response.data),
  });
}

export function useStudentProfile() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => apiClient.get("/students/me/profile").then((response) => response.data),
  });

  const mutation = useMutation({
    mutationFn: (payload) =>
      apiClient.put("/students/me/profile", payload).then((response) => response.data),
    onSuccess: (data) => {
      queryClient.setQueryData(["student", "profile"], data);
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });

  return { ...query, saveProfile: mutation.mutateAsync, isSaving: mutation.isPending };
}

export function useDocuments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["student", "documents"],
    queryFn: () => apiClient.get("/documents").then((response) => response.data),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, docType, primary }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);
      formData.append("primary", String(primary));

      return apiClient
        .post("/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "documents"] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });

  return {
    ...query,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    accessDocument: (documentId, action = "view") =>
      apiClient
        .get(`/documents/${documentId}/access`, {
          params: { action },
        })
        .then((response) => response.data),
  };
}

export function useUpdateSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skills) =>
      apiClient.put("/students/me/profile/skills", { skills }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });
}

export function useWorkExperiences() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (payload) =>
      apiClient.post("/students/me/work-experiences", payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "profile"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) =>
      apiClient.put(`/students/me/work-experiences/${id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "profile"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      apiClient.delete(`/students/me/work-experiences/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "profile"] }),
  });

  return {
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: deleteMutation.isPending,
  };
}

export function useCertifications() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (payload) =>
      apiClient.post("/students/me/certifications", payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "profile"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) =>
      apiClient.put(`/students/me/certifications/${id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "profile"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      apiClient.delete(`/students/me/certifications/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "profile"] }),
  });

  return {
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: deleteMutation.isPending,
  };
}
