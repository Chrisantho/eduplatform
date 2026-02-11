import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // login username
  email: text("email"), // for password reset
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["ADMIN", "STUDENT"] }).notNull().default("STUDENT"),
  bio: text("bio"),
  profilePicUrl: text("profile_pic_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  createdById: integer("created_by_id").notNull(), // admin who created it
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  text: text("text").notNull(),
  type: text("type", { enum: ["MCQ", "SHORT_ANSWER"] }).notNull(),
  points: integer("points").notNull().default(1),
});

export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").default(false),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  studentId: integer("student_id").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  score: integer("score"),
  status: text("status", { enum: ["IN_PROGRESS", "COMPLETED"] }).default("IN_PROGRESS"),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedOptionId: integer("selected_option_id"), // for MCQ
  textAnswer: text("text_answer"), // for SHORT_ANSWER
  isCorrect: boolean("is_correct"), // populated after grading
  pointsAwarded: integer("points_awarded").default(0),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["WELCOME", "NEW_EXAM", "RESULT", "SYSTEM"] }).notNull().default("SYSTEM"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  createdExams: many(exams),
  submissions: many(submissions),
  notifications: many(notifications),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [exams.createdById],
    references: [users.id],
  }),
  questions: many(questions),
  submissions: many(submissions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
  options: many(options),
}));

export const optionsRelations = relations(options, ({ one }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
  exam: one(exams, {
    fields: [submissions.examId],
    references: [exams.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  submission: one(submissions, {
    fields: [answers.submissionId],
    references: [submissions.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true, createdById: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, examId: true });
export const insertOptionSchema = createInsertSchema(options).omit({ id: true, questionId: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, startTime: true, endTime: true, score: true, status: true });
export const insertAnswerSchema = createInsertSchema(answers).omit({ id: true, isCorrect: true, pointsAwarded: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });

// Shared schemas for routes
export const submitExamRequestSchema = z.object({
  answers: z.array(z.object({
    questionId: z.number(),
    selectedOptionId: z.number().optional(),
    textAnswer: z.string().optional(),
  }))
});

// Define runtime schema for complex CreateExamRequest
export const createExamRequestSchema = insertExamSchema.extend({
  questions: z.array(
    insertQuestionSchema.extend({
      options: z.array(insertOptionSchema)
    })
  )
});

// === EXPLICIT API TYPES ===

export type User = typeof users.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Option = typeof options.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;

export type QuestionWithOptions = Question & { options: Option[] };
export type ExamWithQuestions = Exam & { questions: QuestionWithOptions[] };
export type SubmissionWithDetails = Submission & { exam: Exam };

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CreateExamRequest = z.infer<typeof createExamRequestSchema>;
export type SubmitExamRequest = z.infer<typeof submitExamRequestSchema>;
