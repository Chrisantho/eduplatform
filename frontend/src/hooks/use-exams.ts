import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_PATHS, type CreateExamRequest, type SubmitExamRequest, type Exam, type ExamWithQuestions, type Submission } from "@/lib/api";

export function useExams() {
  return useQuery<Exam[]>({
    queryKey: [API_PATHS.exams.list],
    queryFn: async () => {
      const res = await fetch(API_PATHS.exams.list, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });
}

export function useExam(id: number) {
  return useQuery<ExamWithQuestions | null>({
    queryKey: ["/api/exams", id],
    queryFn: async () => {
      const res = await fetch(API_PATHS.exams.get(id), { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExamRequest) => {
      const res = await fetch(API_PATHS.exams.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error("Failed to create exam");
      }
      return (await res.json()) as Exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.exams.list] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(API_PATHS.exams.delete(id), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete exam");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.exams.list] });
    },
  });
}

export function useStartExam() {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(API_PATHS.exams.start(id), {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to start exam");
      }
      return (await res.json()) as Submission;
    },
  });
}

export function useSubmitExam(submissionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitExamRequest) => {
      const res = await fetch(API_PATHS.submissions.submit(submissionId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to submit exam");
      return (await res.json()) as Submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.submissions.list] });
    },
  });
}

export function useUpdateExam(examId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExamRequest) => {
      const res = await fetch(API_PATHS.exams.update(examId), {
        method: "PUT",
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
      queryClient.invalidateQueries({ queryKey: [API_PATHS.exams.list] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams", examId] });
    },
  });
}
