import { Link } from "wouter";
import { useExams } from "@/hooks/use-exams";
import { useSubmissions } from "@/hooks/use-submissions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle2, ArrowRight, PlayCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { data: exams, isLoading: loadingExams } = useExams();
  const { data: submissions, isLoading: loadingHistory } = useSubmissions();

  // Helper to check if exam is already taken
  const isExamTaken = (examId: number) => {
    return submissions?.some(s => s.examId === examId && s.status === "COMPLETED");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Available exams and your learning progress</p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Available Assessments</h2>
        </div>
        
        {loadingExams ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams?.filter(exam => !isExamTaken(exam.id)).map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/10">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {exam.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{exam.duration} mins</span>
                    </div>
                    <div className="w-px h-4 bg-border"></div>
                    <div>Active</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/exam/${exam.id}`} className="w-full">
                    <Button className="w-full group">
                      Start Exam 
                      <PlayCircle className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
            {exams?.filter(exam => !isExamTaken(exam.id)).length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No new exams available at the moment.
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4 mt-8">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Completed History</h2>
        </div>

        {loadingHistory ? (
           <div className="flex justify-center py-8">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
           </div>
        ) : (
          <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
            {submissions?.filter(s => s.status === "COMPLETED").length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                You haven't completed any exams yet.
              </div>
            ) : (
              <div className="divide-y">
                {submissions?.filter(s => s.status === "COMPLETED").map((sub) => (
                  <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <h4 className="font-semibold">{sub.exam.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {sub.endTime ? format(new Date(sub.endTime), "PPP 'at' p") : "Unknown date"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-xs text-muted-foreground uppercase tracking-wider">Score</span>
                        <span className={`text-lg font-bold ${
                          (sub.score || 0) >= 70 ? "text-green-600" : "text-yellow-600"
                        }`}>
                          {sub.score}%
                        </span>
                      </div>
                      <Link href={`/student/history/${sub.id}`}>
                        <Button variant="outline" size="sm">
                          View Details <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
