import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateExamRequest, type SubmitExamRequest } from "@shared/routes";

// List all exams
export function useExams() {
  return useQuery({
    queryKey: [api.exams.list.path],
    queryFn: async () => {
      const res = await fetch(api.exams.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return api.exams.list.responses[200].parse(await res.json());
    },
  });
}

// Get single exam details (with questions for taking it)
export function useExam(id: number) {
  return useQuery({
    queryKey: [api.exams.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.exams.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch exam");
      return api.exams.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create new exam
export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExamRequest) => {
      const validated = api.exams.create.input.parse(data);
      const res = await fetch(api.exams.create.path, {
        method: api.exams.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.exams.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create exam");
      }
      return api.exams.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exams.list.path] });
    },
  });
}

// Delete exam
export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.exams.delete.path, { id });
      const res = await fetch(url, {
        method: api.exams.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete exam");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exams.list.path] });
    },
  });
}

// Start exam session
export function useStartExam() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.exams.start.path, { id });
      const res = await fetch(url, {
        method: api.exams.start.method,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to start exam");
      }
      return api.exams.start.responses[201].parse(await res.json());
    },
  });
}

// Submit exam answers
export function useSubmitExam(submissionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitExamRequest) => {
      const url = buildUrl(api.submissions.submit.path, { id: submissionId });
      const validated = api.submissions.submit.input.parse(data);
      
      const res = await fetch(url, {
        method: api.submissions.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to submit exam");
      return api.submissions.submit.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.submissions.list.path] });
    },
  });
}

// Update existing exam
export function useUpdateExam(examId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExamRequest) => {
      const url = buildUrl(api.exams.update.path, { id: examId });
      const res = await fetch(url, {
        method: api.exams.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update exam");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exams.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.exams.get.path, examId] });
    },
  });
}
