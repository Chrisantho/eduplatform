import { useState, useEffect } from "react";
import { useExams, useDeleteExam, useCreateExam, useExam, useUpdateExam } from "@/hooks/use-exams";
import { useSubmissions } from "@/hooks/use-submissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Users, FileText, Clock, BarChart3, Loader2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CreateExamRequest } from "@shared/routes";

export default function AdminDashboard() {
  const { data: exams, isLoading: loadingExams } = useExams();
  const { data: submissions, isLoading: loadingSubs } = useSubmissions();
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage exams and view student performance</p>
        </div>
        <CreateExamDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingExams ? "-" : exams?.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active assessments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSubs ? "-" : submissions?.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Student completions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingSubs || !submissions?.length 
                ? "-" 
                : Math.round(submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length) + "%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all exams</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="exams" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="students">Recent Submissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="exams" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingExams ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : exams?.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No exams created yet</p>
              </div>
            ) : (
              exams?.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>Recent exam submissions from all students</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : submissions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No submissions found</div>
              ) : (
                <div className="space-y-4">
                  {submissions?.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                      <div>
                        <p className="font-medium">{sub.exam.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Completed {sub.endTime ? format(new Date(sub.endTime), "PP p") : "In Progress"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sub.score && sub.score >= 70 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          Score: {sub.score ?? 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExamCard({ exam }: { exam: any }) {
  const { mutate: deleteExam, isPending } = useDeleteExam();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this exam?")) {
      deleteExam(exam.id, {
        onSuccess: () => {
          toast({ title: "Exam deleted", description: "The exam has been removed successfully." });
        },
      });
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow" data-testid={`card-exam-${exam.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">
            <FileText className="h-4 w-4 text-primary" />
          </div>
        </div>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {exam.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="h-4 w-4" />
          <span>{exam.duration} minutes</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Created {format(new Date(exam.createdAt), "MMM d, yyyy")}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t gap-2">
        <CreateExamDialog 
          editingExamId={exam.id} 
          externalOpen={editOpen} 
          setExternalOpen={setEditOpen} 
        />
        <Button 
          variant="destructive" 
          size="sm" 
          className="flex-1"
          onClick={handleDelete}
          disabled={isPending}
          data-testid={`button-delete-exam-${exam.id}`}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" /> Delete</>}
        </Button>
      </CardFooter>
    </Card>
  );
}

function CreateExamDialog({ 
  editingExamId, 
  externalOpen, 
  setExternalOpen 
}: { 
  editingExamId?: number;
  externalOpen?: boolean;
  setExternalOpen?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const { data: existingExam, isLoading: loadingExam } = useExam(editingExamId || 0);
  const { mutate: createExam, isPending: isCreating } = useCreateExam();
  const { mutate: updateExam, isPending: isUpdating } = useUpdateExam(editingExamId || 0);
  const isPending = isCreating || isUpdating;
  const { toast } = useToast();

  useEffect(() => {
    if (editingExamId && existingExam && open && !loaded) {
      setTitle(existingExam.title);
      setDescription(existingExam.description || "");
      setDuration(existingExam.duration);
      setQuestions(
        (existingExam.questions || []).map((q: any) => ({
          text: q.text,
          type: q.type,
          points: q.points,
          options: (q.options || []).map((o: any) => ({
            text: o.text,
            isCorrect: o.isCorrect
          })),
          keywords: q.keywords || [],
          keywordsText: (q.keywords || []).join(", "),
        }))
      );
      setStep(2);
      setLoaded(true);
    }
  }, [editingExamId, existingExam, open, loaded]);

  useEffect(() => {
    if (!open) {
      setLoaded(false);
      if (!editingExamId) {
        setStep(1);
        setTitle("");
        setDescription("");
        setDuration(60);
        setQuestions([]);
      }
    }
  }, [open, editingExamId]);

  const addQuestion = (type: "MCQ" | "SHORT_ANSWER" = "MCQ") => {
    setQuestions([
      ...questions, 
      { 
        text: "", 
        type, 
        points: 5, 
        options: type === "MCQ" ? [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false }
        ] : [],
        keywords: type === "SHORT_ANSWER" ? [] : undefined,
        keywordsText: "",
      }
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], [field]: value };
    setQuestions(newQs);
  };

  const updateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
    const newQs = [...questions];
    const newOpts = [...newQs[qIndex].options];
    newOpts[oIndex] = { ...newOpts[oIndex], [field]: value };
    
    if (field === "isCorrect" && value === true) {
       newOpts.forEach((opt, idx) => {
         if (idx !== oIndex) opt.isCorrect = false;
       });
    }
    
    newQs[qIndex].options = newOpts;
    setQuestions(newQs);
  };

  const addOption = (qIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQs);
  };

  const handleSubmit = () => {
    const payload: CreateExamRequest = {
      title,
      description,
      duration,
      isActive: true,
      questions: questions.map(q => ({
        text: q.text,
        type: q.type,
        points: q.points,
        options: q.options.map((opt: any) => ({
          text: opt.text,
          isCorrect: opt.isCorrect
        })),
        keywords: q.type === "SHORT_ANSWER" && q.keywordsText
          ? q.keywordsText.split(",").map((k: string) => k.trim()).filter((k: string) => k.length > 0)
          : undefined,
      }))
    };

    const onSuccess = () => {
      toast({ title: "Success", description: `Exam ${editingExamId ? "updated" : "created"} successfully!` });
      setOpen(false);
    };
    const onError = (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    };

    if (editingExamId) {
      updateExam(payload, { onSuccess, onError });
    } else {
      createExam(payload, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editingExamId ? (
          <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-exam-${editingExamId}`}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        ) : (
          <Button className="shadow-lg shadow-primary/20" data-testid="button-create-exam">
            <Plus className="mr-2 h-4 w-4" /> Create New Exam
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingExamId ? "Edit Assessment" : "Create New Assessment"}</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Set up basic exam details" : "Add questions to your exam"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Exam Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Introduction to Biology" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief overview of what this exam covers..." />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} min={5} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            {questions.map((q, idx) => (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Question {idx + 1}</Label>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const newQs = [...questions];
                      newQs.splice(idx, 1);
                      setQuestions(newQs);
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    value={q.text} 
                    onChange={e => updateQuestion(idx, 'text', e.target.value)} 
                    placeholder="Enter question text..." 
                  />
                  
                  {q.type === "MCQ" ? (
                    <div className="space-y-2 pl-4 border-l">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Options</Label>
                      {q.options.map((opt: any, oIdx: number) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <input 
                            type="radio" 
                            name={`q-${idx}`}
                            checked={opt.isCorrect} 
                            onChange={() => updateOption(idx, oIdx, 'isCorrect', true)}
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                          <Input 
                            value={opt.text} 
                            onChange={e => updateOption(idx, oIdx, 'text', e.target.value)} 
                            placeholder={`Option ${oIdx + 1}`}
                            className="h-9"
                          />
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addOption(idx)} className="h-auto p-0 text-xs">
                        + Add Option
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Short Answer Response</Label>
                      <Textarea 
                        disabled 
                        placeholder="Students will type their answer here..." 
                        className="min-h-[80px] bg-muted/50"
                      />
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Grading Keywords (comma-separated)</Label>
                        <Input
                          value={q.keywordsText || ""}
                          onChange={e => updateQuestion(idx, 'keywordsText', e.target.value)}
                          placeholder="e.g. atomic, consistency, isolation, durability"
                          data-testid={`input-keywords-${idx}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          Score is based on how many keywords appear in the student's answer. 
                          {q.keywordsText && q.keywordsText.split(",").filter((k: string) => k.trim()).length > 0 && (
                            <span className="ml-1 font-medium">
                              ({q.keywordsText.split(",").filter((k: string) => k.trim()).length} keywords = {q.points} pts, each keyword worth {(q.points / q.keywordsText.split(",").filter((k: string) => k.trim()).length).toFixed(1)} pts)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => addQuestion("MCQ")} className="flex-1 border-dashed">
                <Plus className="mr-2 h-4 w-4" /> Add MCQ
              </Button>
              <Button variant="outline" onClick={() => addQuestion("SHORT_ANSWER")} className="flex-1 border-dashed">
                <Plus className="mr-2 h-4 w-4" /> Add Short Answer
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between w-full">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
          )}
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!title}>Next: Add Questions</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending || questions.length === 0} data-testid="button-submit-exam">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingExamId ? "Update Exam" : "Create Exam"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
