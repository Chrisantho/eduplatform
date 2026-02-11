import { z } from 'zod';
import { 
  insertUserSchema, 
  insertExamSchema, 
  users, 
  exams, 
  questions, 
  options, 
  submissions,
  CreateExamRequest, // Note: This is a type, so we need a Zod schema for it if we want runtime validation
  insertQuestionSchema,
  insertOptionSchema
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

// Define runtime schema for complex CreateExamRequest
export const createExamRequestSchema = insertExamSchema.extend({
  questions: z.array(
    insertQuestionSchema.extend({
      options: z.array(insertOptionSchema)
    })
  )
});

export const submitExamRequestSchema = z.object({
  answers: z.array(z.object({
    questionId: z.number(),
    selectedOptionId: z.number().optional(),
    textAnswer: z.string().optional(),
  }))
});

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
        200: z.custom<typeof submissions.$inferSelect & { answers: typeof submissions.$inferSelect[] }>(),
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
  }
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
