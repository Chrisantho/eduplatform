import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useExam, useStartExam } from "@/hooks/use-exams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Timer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SubmitExamRequest, api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

export default function TakeExam() {
  const [, params] = useRoute("/exam/:id");
  const [, setLocation] = useLocation();
  const examId = parseInt(params?.id || "0");
  
  const { data: exam, isLoading } = useExam(examId);
  const { mutate: startExam, isPending: starting } = useStartExam();
  const { toast } = useToast();

  const [hasStarted, setHasStarted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [answers, setAnswers] = useState<Record<number, { selectedOptionId?: number, textAnswer?: string }>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);

  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  const handleStart = () => {
    startExam(examId, {
      onSuccess: (data) => {
        setHasStarted(true);
        setSubmissionId(data.id);
        setTimeLeft(exam!.duration * 60);
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error starting exam", description: err.message });
      }
    });
  };

  const handleSubmit = () => {
    if (!submissionId) return;
    if (Object.keys(answers).length < (exam?.questions.length || 0)) {
       if (!confirm("You haven't answered all questions. Are you sure you want to submit?")) return;
    }
    const payload: SubmitExamRequest = {
      answers: Object.entries(answers).map(([qId, data]) => ({
        questionId: parseInt(qId),
        ...data
      }))
    };
    callSubmitApi(submissionId, payload);
  };

  const handleAutoSubmit = () => {
    toast({ title: "Time's up!", description: "Submitting your answers automatically..." });
    if (submissionId) {
      const payload: SubmitExamRequest = {
        answers: Object.entries(answers).map(([qId, data]) => ({
          questionId: parseInt(qId),
          ...data
        }))
      };
      callSubmitApi(submissionId, payload);
    }
  };

  const callSubmitApi = async (id: number, data: SubmitExamRequest) => {
    try {
      const res = await fetch(`/api/submissions/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updatedSubmission = await res.json();
        queryClient.invalidateQueries({ queryKey: [api.submissions.list.path] });
        queryClient.invalidateQueries({ queryKey: [api.exams.list.path] });
        toast({ title: "Submitted!", description: "Your exam has been submitted successfully." });
        setLocation(`/student/history/${updatedSubmission.id}`);
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Submission Failed", description: "Please try again." });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  if (!exam) return <div className="p-8 text-center">Exam not found</div>;

  if (!hasStarted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20">
        <Card className="border-t-4 border-t-primary shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-display">{exam.title}</CardTitle>
            <p className="text-muted-foreground mt-2">{exam.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-bold">{exam.duration} Minutes</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-xl font-bold">{exam.questions.length}</p>
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important Instructions</AlertTitle>
              <AlertDescription>
                Once you start, the timer will begin. You cannot pause the exam. 
                Ensure you have a stable internet connection.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button size="lg" className="w-full h-12 text-lg" onClick={handleStart} disabled={starting}>
              {starting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Start Exam Now
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQIndex];
  const progress = ((Object.keys(answers).length) / exam.questions.length) * 100;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 bg-card p-4 rounded-xl border shadow-sm sticky top-4 z-10">
        <div className="flex flex-col">
          <h2 className="font-bold text-lg">{exam.title}</h2>
          <span className="text-xs text-muted-foreground">Question {currentQIndex + 1} of {exam.questions.length}</span>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-primary/10 text-primary'}`}>
          <Timer className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-8" />

      <div className="flex-1">
        <Card className="min-h-[400px] flex flex-col shadow-md">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {currentQuestion.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            {currentQuestion.type === "MCQ" ? (
              <RadioGroup 
                value={answers[currentQuestion.id]?.selectedOptionId?.toString()} 
                onValueChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: { selectedOptionId: parseInt(val) } }))}
                className="space-y-4"
              >
                {currentQuestion.options.map((opt) => (
                  <div key={opt.id} className={`flex items-center space-x-3 border p-4 rounded-lg transition-all ${answers[currentQuestion.id]?.selectedOptionId === opt.id ? 'border-primary bg-primary/5 shadow-inner' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value={opt.id.toString()} id={opt.id.toString()} />
                    <Label htmlFor={opt.id.toString()} className="flex-1 cursor-pointer font-normal text-base">
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Your Explanation</Label>
                <Textarea 
                  value={answers[currentQuestion.id]?.textAnswer || ""}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: { textAnswer: e.target.value } }))}
                  placeholder="Type your explanation here..."
                  className="min-h-[200px] text-lg leading-relaxed focus-visible:ring-primary"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
            <Button 
              variant="outline" 
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
            >
              Previous
            </Button>
            {currentQIndex === exam.questions.length - 1 ? (
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                Submit Exam
              </Button>
            ) : (
              <Button onClick={() => setCurrentQIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}>
                Next Question
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 flex gap-2 flex-wrap justify-center">
        {exam.questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQIndex(idx)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
              currentQIndex === idx 
                ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary' 
                : answers[q.id] 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
