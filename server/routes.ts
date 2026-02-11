import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api, createExamRequestSchema, submitExamRequestSchema } from "@shared/routes";
import { z } from "zod";
import passport from "passport";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up Passport auth
  setupAuth(app);

  // === AUTH ROUTES ===

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
      if (e instanceof z.ZodError) {
        res.status(400).json(e.errors);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
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

  // === EXAMS ROUTES ===

  app.get(api.exams.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const exams = await storage.getExams();
    res.json(exams);
  });

  app.get(api.exams.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const exam = await storage.getExam(Number(req.params.id));
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    
    // If student, filter out correct answers from options!
    if (req.user!.role === "STUDENT") {
      const sanitizedQuestions = exam.questions.map(q => ({
        ...q,
        options: q.options.map(o => ({ ...o, isCorrect: undefined })) // Hide correct answer
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
        res.status(400).json(e.errors);
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
    
    // Check if already started
    const submissions = await storage.getUserSubmissions(req.user!.id);
    const existing = submissions.find(s => s.examId === examId && s.status === "IN_PROGRESS");
    if (existing) {
      return res.json(existing);
    }

    const submission = await storage.createSubmission(req.user!.id, examId);
    res.status(201).json(submission);
  });

  // === SUBMISSION ROUTES ===

  app.get(api.submissions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // If admin, could show all. If student, show only theirs.
    // For now, implementing "My Submissions"
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
      
      // Auto-grading logic (Simple MCQ)
      const exam = await storage.getExam(submission.examId);
      let score = 0;
      
      if (exam) {
        for (const ans of input.answers) {
          const question = exam.questions.find(q => q.id === ans.questionId);
          if (question && question.type === "MCQ" && ans.selectedOptionId) {
            const selectedOpt = question.options.find((o: any) => o.id === ans.selectedOptionId);
            if (selectedOpt && selectedOpt.isCorrect) {
              score += question.points || 1;
            }
          }
          // Short answer grading would require manual review or complex logic
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
    if (!submission) return res.sendStatus(404);
    if (req.user!.role !== "ADMIN" && submission.studentId !== req.user!.id) return res.sendStatus(403);
    
    res.json(submission);
  });

  // === WEBSOCKETS (Optional for this MVP, but setup for future) ===
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      // Handle timer sync or heartbeat
    });
  });

  // Seed Admin User and Initial Exam
  const adminUser = await storage.getUserByUsername("admin@example.com");
  if (!adminUser) {
    const hashedPassword = await hashPassword("adminpassword");
    const admin = await storage.createUser({
      username: "admin@example.com",
      password: hashedPassword,
      fullName: "System Admin",
      role: "ADMIN"
    });

    // Seed an initial exam
    await storage.createExam(admin.id, {
      title: "General Knowledge Assessment",
      description: "A comprehensive test covering science, history, and literature.",
      duration: 30,
      isActive: true,
      questions: [
        {
          text: "What is the capital of France?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "London", isCorrect: false },
            { text: "Paris", isCorrect: true },
            { text: "Berlin", isCorrect: false },
            { text: "Madrid", isCorrect: false }
          ]
        },
        {
          text: "Which planet is known as the Red Planet?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "Venus", isCorrect: false },
            { text: "Mars", isCorrect: true },
            { text: "Jupiter", isCorrect: false },
            { text: "Saturn", isCorrect: false }
          ]
        },
        {
          text: "Who wrote 'Romeo and Juliet'?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "Charles Dickens", isCorrect: false },
            { text: "William Shakespeare", isCorrect: true },
            { text: "Mark Twain", isCorrect: false },
            { text: "Jane Austen", isCorrect: false }
          ]
        },
        {
          text: "What is the largest ocean on Earth?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "Atlantic Ocean", isCorrect: false },
            { text: "Indian Ocean", isCorrect: false },
            { text: "Arctic Ocean", isCorrect: false },
            { text: "Pacific Ocean", isCorrect: true }
          ]
        },
        {
          text: "In which year did the Titanic sink?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "1910", isCorrect: false },
            { text: "1912", isCorrect: true },
            { text: "1915", isCorrect: false },
            { text: "1920", isCorrect: false }
          ]
        },
        {
          text: "Which element has the chemical symbol 'O'?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "Gold", isCorrect: false },
            { text: "Oxygen", isCorrect: true },
            { text: "Silver", isCorrect: false },
            { text: "Iron", isCorrect: false }
          ]
        },
        {
          text: "How many continents are there on Earth?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "5", isCorrect: false },
            { text: "6", isCorrect: false },
            { text: "7", isCorrect: true },
            { text: "8", isCorrect: false }
          ]
        },
        {
          text: "What is the fastest land animal?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "Lion", isCorrect: false },
            { text: "Cheetah", isCorrect: true },
            { text: "Eagle", isCorrect: false },
            { text: "Horse", isCorrect: false }
          ]
        },
        {
          text: "Which country is home to the Kangaroo?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "India", isCorrect: false },
            { text: "Australia", isCorrect: true },
            { text: "South Africa", isCorrect: false },
            { text: "Brazil", isCorrect: false }
          ]
        },
        {
          text: "What is the boiling point of water in Celsius?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "90°C", isCorrect: false },
            { text: "100°C", isCorrect: true },
            { text: "110°C", isCorrect: false },
            { text: "120°C", isCorrect: false }
          ]
        },
        {
          text: "Who painted the Mona Lisa?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "Pablo Picasso", isCorrect: false },
            { text: "Leonardo da Vinci", isCorrect: true },
            { text: "Vincent van Gogh", isCorrect: false },
            { text: "Claude Monet", isCorrect: false }
          ]
        },
        {
          text: "What is the smallest prime number?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "1", isCorrect: false },
            { text: "2", isCorrect: true },
            { text: "3", isCorrect: false },
            { text: "5", isCorrect: false }
          ]
        },
        {
          text: "Which is the tallest mountain in the world?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "K2", isCorrect: false },
            { text: "Mount Everest", isCorrect: true },
            { text: "Kangchenjunga", isCorrect: false },
            { text: "Lhotse", isCorrect: false }
          ]
        },
        {
          text: "What is the currency of Japan?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "Yuan", isCorrect: false },
            { text: "Won", isCorrect: false },
            { text: "Yen", isCorrect: true },
            { text: "Ringgit", isCorrect: false }
          ]
        },
        {
          text: "How many colors are there in a rainbow?",
          type: "MCQ",
          points: 10,
          options: [
            { text: "6", isCorrect: false },
            { text: "7", isCorrect: true },
            { text: "8", isCorrect: false },
            { text: "9", isCorrect: false }
          ]
        }
      ]
    });
  }

  return httpServer;
}
