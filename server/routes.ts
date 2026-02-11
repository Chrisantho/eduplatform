import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { createExamRequestSchema, submitExamRequestSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { randomBytes } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `profile-${Date.now()}-${randomBytes(4).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.use("/uploads", (await import("express")).default.static(uploadDir));

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

      await storage.createNotification({
        userId: user.id,
        title: "Welcome to EduPlatform!",
        message: `Hi ${user.fullName}, welcome to our learning platform! Start by browsing available exams from your dashboard.`,
        type: "WELCOME",
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

  // === PROFILE ROUTES ===

  app.put(api.auth.updateProfile.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const profileSchema = z.object({
        fullName: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        bio: z.string().max(500).optional(),
      });
      const data = profileSchema.parse(req.body);
      const user = await storage.updateUserProfile((req.user as any).id, data);
      res.json(user);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: e.errors });
      } else {
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  });

  app.post(api.auth.uploadProfilePic.path, upload.single("profilePic"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    await storage.updateUserProfile((req.user as any).id, { profilePicUrl: url });
    res.json({ url });
  });

  // === FORGOT PASSWORD ROUTES ===

  app.post(api.auth.forgotPassword.path, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If an account with that email exists, a reset code has been sent" });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await storage.createPasswordReset(user.id, code, expiresAt);

      try {
        const { Resend } = await import("resend");
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          const resend = new Resend(resendKey);
          await resend.emails.send({
            from: "EduPlatform <onboarding@resend.dev>",
            to: email,
            subject: "Password Reset Code - EduPlatform",
            html: `<h2>Password Reset</h2><p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
          });
        }
      } catch (emailErr) {
        console.log("Email sending not configured, code stored in database. Code:", code);
      }

      res.json({ message: "If an account with that email exists, a reset code has been sent" });
    } catch (e) {
      res.status(500).json({ message: "Failed to process password reset" });
    }
  });

  app.post(api.auth.verifyResetCode.path, async (req, res) => {
    try {
      const { email, code } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(400).json({ message: "Invalid email" });

      const reset = await storage.getPasswordReset(user.id, code);
      if (!reset) return res.status(400).json({ message: "Invalid or expired code" });
      if (new Date() > reset.expiresAt) return res.status(400).json({ message: "Code has expired" });

      const token = randomBytes(32).toString("hex");
      await storage.markPasswordResetUsed(reset.id);
      await storage.createPasswordReset(user.id, token, new Date(Date.now() + 10 * 60 * 1000));

      res.json({ message: "Code verified successfully", token });
    } catch (e) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post(api.auth.resetPassword.path, async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const reset = await storage.getPasswordResetByToken(token);
      
      if (!reset || new Date() > reset.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(reset.userId, hashedPassword);
      await storage.markPasswordResetUsed(reset.id);

      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (e) {
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // === EXAM ROUTES ===

  app.get(api.exams.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const exams = await storage.getExams();
    res.json(exams);
  });

  app.get(api.exams.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const exam = await storage.getExam(Number(req.params.id));
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if ((req.user as any).role === "STUDENT") {
      const sanitizedQuestions = exam.questions.map(q => ({
        ...q,
        keywords: undefined,
        options: q.options.map((o: any) => ({ ...o, isCorrect: undefined }))
      }));
      return res.json({ ...exam, questions: sanitizedQuestions });
    }
    res.json(exam);
  });

  app.post(api.exams.create.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "ADMIN") return res.sendStatus(401);
    try {
      const input = createExamRequestSchema.parse(req.body);
      const exam = await storage.createExam((req.user as any).id, input);

      await storage.createNotificationsForAllStudents(
        "New Exam Available",
        `A new exam "${exam.title}" has been published. Check your dashboard to take it!`,
        "NEW_EXAM"
      );

      res.status(201).json(exam);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: e.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put(api.exams.update.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "ADMIN") return res.sendStatus(401);
    try {
      const input = createExamRequestSchema.parse(req.body);
      const exam = await storage.updateExam(Number(req.params.id), input);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      res.json(exam);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: e.errors });
      } else if (e.message?.includes("Cannot edit")) {
        res.status(400).json({ message: e.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.exams.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "ADMIN") return res.sendStatus(401);
    await storage.deleteExam(Number(req.params.id));
    res.sendStatus(200);
  });

  app.post(api.exams.start.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "STUDENT") return res.sendStatus(401);
    const examId = Number(req.params.id);
    const userSubmissions = await storage.getUserSubmissions((req.user as any).id);
    const existing = userSubmissions.find(s => s.examId === examId && s.status === "IN_PROGRESS");
    if (existing) return res.json(existing);
    const submission = await storage.createSubmission((req.user as any).id, examId);
    res.status(201).json(submission);
  });

  // === SUBMISSION ROUTES ===

  app.get(api.submissions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const subs = await storage.getUserSubmissions((req.user as any).id);
    res.json(subs);
  });

  app.post(api.submissions.submit.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const submissionId = Number(req.params.id);
    const submission = await storage.getSubmission(submissionId);
    if (!submission) return res.sendStatus(404);
    if (submission.studentId !== (req.user as any).id) return res.sendStatus(403);
    if (submission.status === "COMPLETED") return res.status(400).json({ message: "Already submitted" });
    try {
      const input = submitExamRequestSchema.parse(req.body);
      const exam = await storage.getExam(submission.examId);
      let score = 0;
      let totalPossiblePoints = 0;

      if (exam) {
        for (const question of exam.questions) {
          totalPossiblePoints += question.points || 0;
          const studentAnswer = input.answers.find(a => a.questionId === question.id);
          
          if (!studentAnswer) continue;

          if (question.type === "MCQ" && studentAnswer.selectedOptionId) {
            const selectedOpt = question.options.find((o: any) => o.id === studentAnswer.selectedOptionId);
            if (selectedOpt && selectedOpt.isCorrect) {
              score += question.points || 0;
            }
          } else if (question.type === "SHORT_ANSWER" && studentAnswer.textAnswer) {
            const questionKeywords = (question as any).keywords as string[] | null;
            if (questionKeywords && questionKeywords.length > 0) {
              const answerLower = studentAnswer.textAnswer.toLowerCase();
              const matchedCount = questionKeywords.filter(kw => 
                answerLower.includes(kw.toLowerCase())
              ).length;
              const ratio = matchedCount / questionKeywords.length;
              score += Math.round((question.points || 0) * ratio);
            } else {
              score += question.points || 0;
            }
          }
        }
      }

      const finalPercentage = totalPossiblePoints > 0 
        ? Math.round((score / totalPossiblePoints) * 100) 
        : 0;

      await storage.saveAnswers(submissionId, input.answers);
      const updated = await storage.updateSubmissionStatus(submissionId, "COMPLETED", finalPercentage);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "Invalid submission data" });
    }
  });

  app.get(api.submissions.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const submission = await storage.getSubmission(Number(req.params.id));
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if ((req.user as any).role !== "ADMIN" && submission.studentId !== (req.user as any).id) return res.sendStatus(403);
    const exam = await storage.getExam(submission.examId);
    res.json({ ...submission, exam, answers: [] });
  });

  // === NOTIFICATION ROUTES ===

  app.get(api.notifications.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notifs = await storage.getUserNotifications((req.user as any).id);
    res.json(notifs);
  });

  app.get(api.notifications.unreadCount.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const count = await storage.getUnreadNotificationCount((req.user as any).id);
    res.json({ count });
  });

  app.put(api.notifications.markAllRead.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.markAllNotificationsRead((req.user as any).id);
    res.json({ message: "All notifications marked as read" });
  });

  app.put(api.notifications.markRead.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notification = await storage.markNotificationRead(Number(req.params.id));
    res.json(notification);
  });

  // === WS + SEED ===

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
