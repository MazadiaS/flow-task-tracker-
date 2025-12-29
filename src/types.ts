import type { GoalPlan, GoalPlanIndex } from './types/goals';

export type TaskType = 'duration' | 'count' | 'completion' | 'homework';

export interface TaskSession {
  date: number;
  duration: number; // in seconds
  estimatedDuration?: number; // in seconds
  wentOvertime?: boolean;
  notes?: string;
}

export interface CountLog {
  date: number;
  count: number;
  notes?: string;
}

export type CompletionStatus = 'done' | 'skipped' | 'partial';

export interface CompletionLog {
  date: number;
  completed: boolean;
  status?: CompletionStatus; // New flexible completion state
  completionPercentage?: number; // For partial completions (0-100)
  notes?: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface HomeworkData {
  subject: string;
  dueDate: string;
  assignmentType: 'reading' | 'writing' | 'problem-set' | 'project' | 'exam-prep' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  grade?: string;
  submitted: boolean;
  submittedAt?: number;
  resources?: string[]; // URLs or file paths
}

export interface MediaAttachment {
  id: string;
  type: 'link' | 'image' | 'file';
  url: string;
  displayName?: string;
  caption?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  addedAt: number;
}

export interface Link extends MediaAttachment {
  type: 'link';
  openInNewTab: boolean;
  favicon?: string;
  preview?: {
    title: string;
    description: string;
    image: string;
  };
}

export interface Image extends MediaAttachment {
  type: 'image';
  width: number;
  height: number;
  thumbnailUrl: string;
  fullUrl: string;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  endAfterOccurrences?: number;
  lastGenerated?: string;
}

export interface SubtaskData {
  id: string;
  parentTaskId: string;
  title: string;
  completed: boolean;
  notes: string;
  media: MediaAttachment[];
  estimatedTime?: number;
  actualTime?: number;
  order: number;
  createdAt: number;
}

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  icon?: string;
  target?: {
    value: number;
    unit: 'minutes' | 'reps' | 'times';
  };
  notes: string;

  // Priority & importance
  priority: TaskPriority;
  importance: number;

  // Estimated time
  estimatedTime?: number;

  // Ordering
  order: number;

  // Scheduling
  scheduledFor?: string;
  isRecurring: boolean;
  recurrence?: RecurrencePattern;

  // Media attachments
  media: MediaAttachment[];

  // Sessions & logs
  sessions?: TaskSession[];
  countLogs?: CountLog[];
  completions?: CompletionLog[];

  // Subtasks
  parentId?: string;
  subtasks?: Task[];
  isCollapsed?: boolean;

  // Timestamps
  createdAt: number;

  // Homework-specific data (for student mode)
  homework?: HomeworkData;

  // Goal linking (optional)
  linkedGoalId?: string;  // Link to a goal this task supports
  goalContext?: string;   // Auto-populated description from goal
}

export interface DaySession {
  date: number;
  startTime: number;
  endTime?: number;
  totalDayDuration?: number; // in seconds
  taskSessions: Array<{
    taskId: string;
    taskName: string;
    taskType: TaskType;
    duration?: number; // for duration tasks
    count?: number; // for count tasks
    completed?: boolean; // for completion tasks
    startTime: number;
    endTime: number;
  }>;
  totalActiveTime: number; // sum of all task sessions
  totalInactiveTime?: number; // totalDayDuration - totalActiveTime
}

export interface ArchivedTask {
  taskId: string;
  taskName: string;
  taskType: TaskType;
  target?: {
    value: number;
    unit: 'minutes' | 'reps' | 'times';
  };
  actual: {
    value: number;
    unit: 'minutes' | 'reps' | 'times';
  };
  sessions: TaskSession[] | CountLog[] | CompletionLog[];
  notes: string;
  completed: boolean;
  icon?: string;
  linkedGoalId?: string;  // Link to goal for progress tracking
}

export interface DayArchive {
  date: string;
  dateTimestamp: number;
  daySession: {
    startTime: number;
    endTime: number;
    totalDuration: number;
    activeDuration: number;
    inactiveDuration: number;
  };
  tasks: ArchivedTask[];
}

export interface CurrentDay {
  date: string;
  isActive: boolean;
  startTime?: number;
  tasks: Task[];
  dismissedRecommendations: string[];
}

export interface Recommendation {
  task: Task;
  frequency: string;
  lastDone: string;
  streak?: number;
  score: number;
}

export interface AppState {
  currentDay: CurrentDay;
  taskLibrary: Task[];
  archive: DayArchive[];
  activeDaySession?: DaySession;
  activeTaskTimer?: {
    taskId: string;
    startTime: number;
  };

  // Goal planning (Phase 1 addition)
  activeGoalPlan?: GoalPlan;  // Only one plan can be active at a time
  goalPlanIndex: GoalPlanIndex[];  // Index of all goal plans
}
