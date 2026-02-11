import { useQuery } from "@tanstack/react-query";
import { API_PATHS, type SubmissionWithExam } from "@/lib/api";

export function useSubmissions() {
  return useQuery<SubmissionWithExam[]>({
    queryKey: [API_PATHS.submissions.list],
    queryFn: async () => {
      const res = await fetch(API_PATHS.submissions.list, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
    staleTime: 0,
  });
}

export function useSubmission(id: number) {
  return useQuery({
    queryKey: ["/api/submissions", id],
    queryFn: async () => {
      const res = await fetch(API_PATHS.submissions.get(id), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submission details");
      return res.json();
    },
    enabled: !!id,
  });
}
