import { z } from 'zod';
import { 
  insertUserSchema, 
  users, 
  exams, 
  submissions,
  createExamRequestSchema,
  submitExamRequestSchema,
  questions,
  options,
  notifications
} from './schema';

// === SHARED ERROR SCHEMAS ===
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// === API CONTRACT ===
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    forgotPassword: {
      method: 'POST' as const,
      path: '/api/forgot-password' as const,
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    verifyResetCode: {
      method: 'POST' as const,
      path: '/api/verify-reset-code' as const,
      input: z.object({ email: z.string().email(), code: z.string() }),
      responses: {
        200: z.object({ message: z.string(), token: z.string() }),
        400: errorSchemas.validation,
      },
    },
    resetPassword: {
      method: 'POST' as const,
      path: '/api/reset-password' as const,
      input: z.object({ token: z.string(), newPassword: z.string().min(6) }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    updateProfile: {
      method: 'PUT' as const,
      path: '/api/user/profile' as const,
      input: z.object({
        fullName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        bio: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    uploadProfilePic: {
      method: 'POST' as const,
      path: '/api/user/profile-pic' as const,
      responses: {
        200: z.object({ url: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  exams: {
    list: {
      method: 'GET' as const,
      path: '/api/exams' as const,
      responses: {
        200: z.array(z.custom<typeof exams.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/exams/:id' as const,
      responses: {
        200: z.custom<typeof exams.$inferSelect & { questions: (typeof questions.$inferSelect & { options: typeof options.$inferSelect[] })[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/exams' as const,
      input: createExamRequestSchema,
      responses: {
        201: z.custom<typeof exams.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/exams/:id' as const,
      responses: {
        200: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/exams/:id' as const,
      input: createExamRequestSchema,
      responses: {
        200: z.custom<typeof exams.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    start: {
      method: 'POST' as const,
      path: '/api/exams/:id/start' as const,
      responses: {
        201: z.custom<typeof submissions.$inferSelect>(),
        400: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  submissions: {
    list: {
      method: 'GET' as const,
      path: '/api/submissions' as const,
      responses: {
        200: z.array(z.custom<typeof submissions.$inferSelect & { exam: typeof exams.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/submissions/:id' as const,
      responses: {
        200: z.custom<typeof submissions.$inferSelect & { exam: typeof exams.$inferSelect, answers: any[] }>(),
        404: errorSchemas.notFound,
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/submissions/:id/submit' as const,
      input: submitExamRequestSchema,
      responses: {
        200: z.custom<typeof submissions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications' as const,
      responses: {
        200: z.array(z.custom<typeof notifications.$inferSelect>()),
      },
    },
    markRead: {
      method: 'PUT' as const,
      path: '/api/notifications/:id/read' as const,
      responses: {
        200: z.custom<typeof notifications.$inferSelect>(),
      },
    },
    markAllRead: {
      method: 'PUT' as const,
      path: '/api/notifications/read-all' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    unreadCount: {
      method: 'GET' as const,
      path: '/api/notifications/unread-count' as const,
      responses: {
        200: z.object({ count: z.number() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type { CreateExamRequest, SubmitExamRequest } from './schema';
