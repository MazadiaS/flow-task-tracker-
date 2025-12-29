/**
 * Data validation schemas using Zod
 * Protects against corrupted or malicious localStorage data
 */

import { z } from 'zod';

// Task validation schemas
export const TaskSessionSchema = z.object({
  date: z.number(),
  duration: z.number().min(0),
  estimatedDuration: z.number().min(0).optional(),
  wentOvertime: z.boolean().optional(),
  notes: z.string().max(1000).optional()
});

export const CountLogSchema = z.object({
  date: z.number(),
  count: z.number().min(0),
  notes: z.string().max(1000).optional()
});

export const CompletionLogSchema = z.object({
  date: z.number(),
  completed: z.boolean(),
  status: z.enum(['done', 'skipped', 'partial']).optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional()
});

export const HomeworkDataSchema = z.object({
  subject: z.string().max(200),
  dueDate: z.string(),
  assignmentType: z.enum(['reading', 'writing', 'problem-set', 'project', 'exam-prep', 'other']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedTime: z.number().min(0).max(1440).optional(),
  actualTime: z.number().min(0).max(1440).optional(),
  grade: z.string().max(10).optional(),
  submitted: z.boolean(),
  submittedAt: z.number().optional(),
  resources: z.array(z.string().max(2000)).max(20).optional()
});

export const MediaAttachmentSchema = z.object({
  id: z.string(),
  type: z.enum(['link', 'image', 'file']),
  url: z.string().max(2000),
  displayName: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  thumbnailUrl: z.string().max(2000).optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().max(100).optional(),
  addedAt: z.number()
});

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  type: z.enum(['duration', 'count', 'completion', 'homework']),
  icon: z.string().max(10).optional(),
  target: z.object({
    value: z.number().min(0).max(10000),
    unit: z.enum(['minutes', 'reps', 'times'])
  }).optional(),
  notes: z.string().max(5000),
  priority: z.enum(['high', 'medium', 'low']),
  importance: z.number().min(0).max(10),
  estimatedTime: z.number().min(0).max(1440).optional(),
  order: z.number().min(0),
  scheduledFor: z.string().optional(),
  isRecurring: z.boolean(),
  recurrence: z.any().optional(), // Complex type - skip for now
  media: z.array(MediaAttachmentSchema).max(50),
  sessions: z.array(TaskSessionSchema).max(1000).optional(),
  countLogs: z.array(CountLogSchema).max(1000).optional(),
  completions: z.array(CompletionLogSchema).max(1000).optional(),
  parentId: z.string().optional(),
  subtasks: z.array(z.any()).max(50).optional(), // Recursive - use any
  isCollapsed: z.boolean().optional(),
  createdAt: z.number(),
  homework: HomeworkDataSchema.optional(),
  linkedGoalId: z.string().optional(),
  goalContext: z.string().max(500).optional()
});

export const CurrentDaySchema = z.object({
  date: z.string(),
  isActive: z.boolean(),
  startTime: z.number().optional(),
  tasks: z.array(TaskSchema).max(500),
  dismissedRecommendations: z.array(z.string()).max(100)
});

export const DayArchiveSchema = z.object({
  date: z.string(),
  dateTimestamp: z.number(),
  daySession: z.object({
    startTime: z.number(),
    endTime: z.number(),
    totalDuration: z.number().min(0),
    activeDuration: z.number().min(0),
    inactiveDuration: z.number().min(0)
  }),
  tasks: z.array(z.any()).max(500) // ArchivedTask - complex type
});

export const AppStateSchema = z.object({
  currentDay: CurrentDaySchema,
  taskLibrary: z.array(TaskSchema).max(1000),
  archive: z.array(DayArchiveSchema).max(3650), // ~10 years max
  activeDaySession: z.any().optional(),
  activeTaskTimer: z.object({
    taskId: z.string(),
    startTime: z.number()
  }).optional(),
  activeGoalPlan: z.any().optional(), // Goal types - complex
  goalPlanIndex: z.array(z.any()).max(100).default([])
});

/**
 * Validate and sanitize data loaded from localStorage
 * Returns validated data or default state if invalid
 */
export const validateAppState = (data: unknown): z.infer<typeof AppStateSchema> | null => {
  try {
    return AppStateSchema.parse(data);
  } catch (error) {
    console.error('Invalid app state data detected:', error);
    return null;
  }
};

/**
 * Validate task data before adding/updating
 */
export const validateTask = (task: unknown): z.infer<typeof TaskSchema> | null => {
  try {
    return TaskSchema.parse(task);
  } catch (error) {
    console.error('Invalid task data:', error);
    return null;
  }
};

/**
 * Safe JSON parse with validation
 */
export const safeJSONParse = <T>(
  json: string,
  schema: z.ZodType<T>,
  fallback: T
): T => {
  try {
    const parsed = JSON.parse(json);
    return schema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse/validate JSON:', error);
    return fallback;
  }
};
