import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { createExamRequestSchema, submitExamRequestSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (e) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.get(api.exams.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const exams = await storage.getExams();
    res.json(exams);
  });

  app.get(api.exams.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const exam = await storage.getExam(Number(req.params.id));
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (req.user!.role === "STUDENT") {
      const sanitizedQuestions = exam.questions.map(q => ({
        ...q,
        options: q.options.map((o: any) => ({ ...o, isCorrect: undefined }))
      }));
      return res.json({ ...exam, questions: sanitizedQuestions });
    }
    res.json(exam);
  });

  app.post(api.exams.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "ADMIN") return res.sendStatus(401);
    try {
      const input = createExamRequestSchema.parse(req.body);
      const exam = await storage.createExam(req.user!.id, input);
      res.status(201).json(exam);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: e.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.exams.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "ADMIN") return res.sendStatus(401);
    await storage.deleteExam(Number(req.params.id));
    res.sendStatus(200);
  });

  app.post(api.exams.start.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "STUDENT") return res.sendStatus(401);
    const examId = Number(req.params.id);
    const submissions = await storage.getUserSubmissions(req.user!.id);
    const existing = submissions.find(s => s.examId === examId && s.status === "IN_PROGRESS");
    if (existing) return res.json(existing);
    const submission = await storage.createSubmission(req.user!.id, examId);
    res.status(201).json(submission);
  });

  app.get(api.submissions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const subs = await storage.getUserSubmissions(req.user!.id);
    res.json(subs);
  });

  app.post(api.submissions.submit.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const submissionId = Number(req.params.id);
    const submission = await storage.getSubmission(submissionId);
    if (!submission) return res.sendStatus(404);
    if (submission.studentId !== req.user!.id) return res.sendStatus(403);
    if (submission.status === "COMPLETED") return res.status(400).json({ message: "Already submitted" });
    try {
      const input = submitExamRequestSchema.parse(req.body);
      const exam = await storage.getExam(submission.examId);
      let score = 0;
      if (exam) {
        for (const ans of input.answers) {
          const question = exam.questions.find(q => q.id === ans.questionId);
          if (question && question.type === "MCQ" && ans.selectedOptionId) {
            const selectedOpt = question.options.find((o: any) => o.id === ans.selectedOptionId);
            if (selectedOpt && selectedOpt.isCorrect) score += question.points || 1;
          }
        }
      }
      await storage.saveAnswers(submissionId, input.answers);
      const updated = await storage.updateSubmissionStatus(submissionId, "COMPLETED", score);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "Invalid submission data" });
    }
  });

  app.get(api.submissions.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const submission = await storage.getSubmission(Number(req.params.id));
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (req.user!.role !== "ADMIN" && submission.studentId !== req.user!.id) return res.sendStatus(403);
    const exam = await storage.getExam(submission.examId);
    res.json({ ...submission, exam, answers: [] });
  });

  new WebSocketServer({ server: httpServer, path: '/ws' });

  const adminUser = await storage.getUserByUsername("admin@example.com");
  if (!adminUser) {
    const hashedPassword = await hashPassword("adminpassword");
    await storage.createUser({
      username: "admin@example.com",
      password: hashedPassword,
      fullName: "System Admin",
      role: "ADMIN"
    });
  }

  return httpServer;
}
