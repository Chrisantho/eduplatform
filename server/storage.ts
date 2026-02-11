import { db } from "./db";
import {
  users,
  exams,
  questions,
  options,
  submissions,
  answers,
  notifications,
  passwordResets,
  type User,
  type InsertUser,
  type Exam,
  type CreateExamRequest,
  type Submission,
  type Answer,
  type Notification,
  type InsertNotification,
  type PasswordReset
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, data: { fullName?: string; email?: string; bio?: string; profilePicUrl?: string }): Promise<User>;

  // Exam
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<(Exam & { questions: any[] }) | undefined>;
  createExam(adminId: number, exam: CreateExamRequest): Promise<Exam>;
  deleteExam(id: number): Promise<void>;
  updateExam(id: number, examData: CreateExamRequest): Promise<Exam | undefined>;

  // Submission
  createSubmission(studentId: number, examId: number): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getUserSubmissions(userId: number): Promise<(Submission & { exam: Exam })[]>;
  updateSubmissionStatus(id: number, status: "COMPLETED", score: number): Promise<Submission>;
  
  // Answers
  saveAnswers(submissionId: number, answerData: { questionId: number, selectedOptionId?: number, textAnswer?: string }[]): Promise<void>;

  // Notifications
  createNotification(data: InsertNotification): Promise<Notification>;
  createNotificationsForAllStudents(title: string, message: string, type: "WELCOME" | "NEW_EXAM" | "RESULT" | "SYSTEM"): Promise<void>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification>;
  markAllNotificationsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;

  // Password Reset
  createPasswordReset(userId: number, code: string, expiresAt: Date): Promise<PasswordReset>;
  getPasswordReset(userId: number, code: string): Promise<PasswordReset | undefined>;
  getPasswordResetByToken(token: string): Promise<PasswordReset | undefined>;
  markPasswordResetUsed(id: number): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: number, data: { fullName?: string; email?: string; bio?: string; profilePicUrl?: string }): Promise<User> {
    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.profilePicUrl !== undefined) updateData.profilePicUrl = data.profilePicUrl;
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async getExams(): Promise<Exam[]> {
    return await db.select().from(exams).orderBy(exams.createdAt);
  }

  async getExam(id: number): Promise<(Exam & { questions: any[] }) | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    if (!exam) return undefined;

    const examQuestions = await db.select().from(questions).where(eq(questions.examId, id));
    const questionsWithOptions = await Promise.all(
      examQuestions.map(async (q) => {
        const qOptions = await db.select().from(options).where(eq(options.questionId, q.id));
        return { ...q, options: qOptions };
      })
    );

    return { ...exam, questions: questionsWithOptions };
  }

  async createExam(adminId: number, examData: CreateExamRequest): Promise<Exam> {
    const [exam] = await db.insert(exams).values({
      title: examData.title,
      description: examData.description,
      duration: examData.duration,
      isActive: examData.isActive,
      createdById: adminId,
    }).returning();

    for (const q of examData.questions) {
      const [question] = await db.insert(questions).values({
        examId: exam.id,
        text: q.text,
        type: q.type,
        points: q.points,
      }).returning();

      if (q.options && q.options.length > 0) {
        await db.insert(options).values(
          q.options.map(o => ({
            questionId: question.id,
            text: o.text,
            isCorrect: o.isCorrect
          }))
        );
      }
    }

    return exam;
  }

  async updateExam(id: number, examData: CreateExamRequest): Promise<Exam | undefined> {
    const existing = await db.select().from(exams).where(eq(exams.id, id));
    if (existing.length === 0) return undefined;

    const existingSubs = await db.select().from(submissions).where(eq(submissions.examId, id));
    if (existingSubs.length > 0) {
      throw new Error("Cannot edit an exam that already has student submissions");
    }

    const [exam] = await db.update(exams)
      .set({
        title: examData.title,
        description: examData.description,
        duration: examData.duration,
        isActive: examData.isActive,
      })
      .where(eq(exams.id, id))
      .returning();

    const oldQuestions = await db.select().from(questions).where(eq(questions.examId, id));
    for (const oq of oldQuestions) {
      await db.delete(options).where(eq(options.questionId, oq.id));
    }
    await db.delete(questions).where(eq(questions.examId, id));

    for (const q of examData.questions) {
      const [question] = await db.insert(questions).values({
        examId: id,
        text: q.text,
        type: q.type,
        points: q.points,
      }).returning();

      if (q.options && q.options.length > 0) {
        await db.insert(options).values(
          q.options.map(o => ({
            questionId: question.id,
            text: o.text,
            isCorrect: o.isCorrect
          }))
        );
      }
    }

    return exam;
  }

  async deleteExam(id: number): Promise<void> {
    const examQuestions = await db.select().from(questions).where(eq(questions.examId, id));
    for (const q of examQuestions) {
      await db.delete(options).where(eq(options.questionId, q.id));
    }
    await db.delete(questions).where(eq(questions.examId, id));
    await db.delete(exams).where(eq(exams.id, id));
  }

  async createSubmission(studentId: number, examId: number): Promise<Submission> {
    const [submission] = await db.insert(submissions).values({
      studentId,
      examId,
      startTime: new Date(),
      status: "IN_PROGRESS"
    }).returning();
    return submission;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    const [sub] = await db.select().from(submissions).where(eq(submissions.id, id));
    return sub;
  }

  async getUserSubmissions(userId: number): Promise<(Submission & { exam: Exam })[]> {
    const user = await this.getUser(userId);
    const query = db.select().from(submissions);
    const subs = user?.role === "ADMIN" 
      ? await query.orderBy(submissions.startTime)
      : await query.where(eq(submissions.studentId, userId)).orderBy(submissions.startTime);
    
    const result = [];
    for (const sub of subs) {
      const [exam] = await db.select().from(exams).where(eq(exams.id, sub.examId));
      result.push({ ...sub, exam });
    }
    return result;
  }

  async updateSubmissionStatus(id: number, status: "COMPLETED", score: number): Promise<Submission> {
    const [sub] = await db.update(submissions)
      .set({ status, score, endTime: new Date() })
      .where(eq(submissions.id, id))
      .returning();
    return sub;
  }

  async saveAnswers(submissionId: number, answerData: { questionId: number, selectedOptionId?: number, textAnswer?: string }[]): Promise<void> {
    if (answerData.length === 0) return;
    
    await db.insert(answers).values(
      answerData.map(a => ({
        submissionId,
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        textAnswer: a.textAnswer,
      }))
    );
  }

  // === Notifications ===

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async createNotificationsForAllStudents(title: string, message: string, type: "WELCOME" | "NEW_EXAM" | "RESULT" | "SYSTEM"): Promise<void> {
    const allStudents = await db.select().from(users).where(eq(users.role, "STUDENT"));
    for (const student of allStudents) {
      await db.insert(notifications).values({
        userId: student.id,
        title,
        message,
        type,
      });
    }
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [notification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const unread = await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return unread.length;
  }

  // === Password Reset ===

  async createPasswordReset(userId: number, code: string, expiresAt: Date): Promise<PasswordReset> {
    const [reset] = await db.insert(passwordResets).values({
      userId,
      code,
      expiresAt,
    }).returning();
    return reset;
  }

  async getPasswordReset(userId: number, code: string): Promise<PasswordReset | undefined> {
    const [reset] = await db.select().from(passwordResets)
      .where(and(
        eq(passwordResets.userId, userId),
        eq(passwordResets.code, code),
        eq(passwordResets.used, false)
      ));
    return reset;
  }

  async getPasswordResetByToken(token: string): Promise<PasswordReset | undefined> {
    const [reset] = await db.select().from(passwordResets)
      .where(and(eq(passwordResets.code, token), eq(passwordResets.used, false)));
    return reset;
  }

  async markPasswordResetUsed(id: number): Promise<void> {
    await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, id));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
