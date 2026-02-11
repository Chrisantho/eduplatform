export const API_PATHS = {
  auth: {
    register: "/api/register",
    login: "/api/login",
    logout: "/api/logout",
    me: "/api/user",
    updateProfile: "/api/user/profile",
    uploadProfilePic: "/api/user/profile-pic",
    forgotPassword: "/api/forgot-password",
    verifyResetCode: "/api/verify-reset-code",
    resetPassword: "/api/reset-password",
  },
  exams: {
    list: "/api/exams",
    get: (id: number) => `/api/exams/${id}`,
    create: "/api/exams",
    update: (id: number) => `/api/exams/${id}`,
    delete: (id: number) => `/api/exams/${id}`,
    start: (id: number) => `/api/exams/${id}/start`,
  },
  submissions: {
    list: "/api/submissions",
    get: (id: number) => `/api/submissions/${id}`,
    submit: (id: number) => `/api/submissions/${id}/submit`,
  },
  notifications: {
    list: "/api/notifications",
    unreadCount: "/api/notifications/unread-count",
    markRead: (id: number) => `/api/notifications/${id}/read`,
    markAllRead: "/api/notifications/read-all",
  },
} as const;

export interface User {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  role: "ADMIN" | "STUDENT";
  bio: string | null;
  profilePicUrl: string | null;
  createdAt: string;
}

export interface Exam {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  createdById: number;
  isActive: boolean | null;
  createdAt: string;
}

export interface Question {
  id: number;
  examId: number;
  text: string;
  type: "MCQ" | "SHORT_ANSWER";
  points: number;
  keywords?: string[] | null;
}

export interface Option {
  id: number;
  questionId: number;
  text: string;
  isCorrect?: boolean | null;
}

export interface QuestionWithOptions extends Question {
  options: Option[];
}

export interface ExamWithQuestions extends Exam {
  questions: QuestionWithOptions[];
}

export interface Submission {
  id: number;
  examId: number;
  studentId: number;
  startTime: string;
  endTime: string | null;
  score: number | null;
  status: "IN_PROGRESS" | "COMPLETED";
}

export interface SubmissionWithExam extends Submission {
  exam: Exam;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "WELCOME" | "NEW_EXAM" | "RESULT" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
}

export interface CreateExamRequest {
  title: string;
  description?: string | null;
  duration: number;
  isActive?: boolean | null;
  questions: {
    text: string;
    type: "MCQ" | "SHORT_ANSWER";
    points: number;
    keywords?: string[];
    options: {
      text: string;
      isCorrect?: boolean;
    }[];
  }[];
}

export interface SubmitExamRequest {
  answers: {
    questionId: number;
    selectedOptionId?: number;
    textAnswer?: string;
  }[];
}
