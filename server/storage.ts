import { db } from "./db";
import {
  users,
  exams,
  questions,
  options,
  submissions,
  answers,
  type User,
  type Exam,
  type CreateExamRequest,
  type Submission,
  type Answer
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Exam
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<(Exam & { questions: any[] }) | undefined>;
  createExam(adminId: number, exam: CreateExamRequest): Promise<Exam>;
  deleteExam(id: number): Promise<void>;

  // Submission
  createSubmission(studentId: number, examId: number): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getUserSubmissions(userId: number): Promise<(Submission & { exam: Exam })[]>;
  updateSubmissionStatus(id: number, status: "COMPLETED", score: number): Promise<Submission>;
  
  // Answers
  saveAnswers(submissionId: number, answerData: { questionId: number, selectedOptionId?: number, textAnswer?: string }[]): Promise<void>;
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

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
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

  async deleteExam(id: number): Promise<void> {
    // Cascade delete manually if not set in DB, but for now simple delete
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
    
    // In a real app, we would calculate 'isCorrect' and 'pointsAwarded' here by fetching the questions/options
    // For MVP, we'll store them raw. Grading logic will be in the route handler or service.
    
    await db.insert(answers).values(
      answerData.map(a => ({
        submissionId,
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        textAnswer: a.textAnswer,
      }))
    );
  }
}

export const storage = new DatabaseStorage();
