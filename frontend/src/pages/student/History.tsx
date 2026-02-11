import { useSubmission } from "@/hooks/use-submissions";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Award, Calendar, Clock, ArrowLeft, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ExamHistory() {
  const [match, params] = useRoute("/student/history/:id");
  const submissionId = params?.id ? parseInt(params.id) : 0;
  const { data: submission, isLoading } = useSubmission(submissionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Submission not found</h2>
        <Link href="/student">
          <Button variant="ghost" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", label: "EXCELLENT", color: "text-green-600" };
    if (score >= 80) return { grade: "A", label: "VERY GOOD", color: "text-green-600" };
    if (score >= 70) return { grade: "B", label: "GOOD", color: "text-blue-600" };
    if (score >= 60) return { grade: "C", label: "FAIR", color: "text-yellow-600" };
    return { grade: "F", label: "FAILED", color: "text-destructive" };
  };

  const gradeInfo = getGrade(submission.score || 0);
  const isPassed = (submission.score || 0) >= 60;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4">
        <Link href="/student">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold">Exam Results</h1>
          <p className="text-muted-foreground">{submission.exam.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className={`md:col-span-1 border-2 ${isPassed ? "border-green-500/20" : "border-destructive/20"}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-60">Result Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className={`text-6xl font-black ${gradeInfo.color}`}>
              {submission.score}%
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-2xl font-bold ${gradeInfo.color}`}>Grade: {gradeInfo.grade}</span>
              <div className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold ${
                isPassed ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-destructive/10 text-destructive"
              }`}>
                {isPassed ? <Award className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                {gradeInfo.label}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Completion Date</p>
                <p className="text-sm text-muted-foreground">
                  {submission.endTime ? format(new Date(submission.endTime), "PPP p") : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground capitalize">{(submission.status || "").toLowerCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Summary</CardTitle>
          <CardDescription>Review your performance in "{submission.exam.title}"</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>{submission.exam.description || "No description available for this exam."}</p>
          <div className="flex items-center gap-2 mt-4 text-green-600 font-medium">
            <CheckCircle2 className="h-5 w-5" />
            <span>Submission successfully recorded and graded.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
