import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// List my submissions (student view or admin view depending on backend logic)
export function useSubmissions() {
  return useQuery({
    queryKey: [api.submissions.list.path],
    queryFn: async () => {
      const res = await fetch(api.submissions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return api.submissions.list.responses[200].parse(await res.json());
    },
  });
}

// Get single submission details
export function useSubmission(id: number) {
  return useQuery({
    queryKey: [api.submissions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.submissions.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submission details");
      return api.submissions.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
