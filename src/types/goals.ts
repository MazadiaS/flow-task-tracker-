// Hierarchical Goal Planning Types

export type GoalLevel = 'year' | 'quarter' | 'month' | 'week' | 'day';

export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'abandoned';

export interface Goal {
  id: string;
  title: string;
  description: string;
  level: GoalLevel;

  // Hierarchy
  parentId?: string;  // Link to parent goal
  childIds: string[];  // Links to child goals
  linkedTaskIds: string[];  // Links to daily tasks supporting this goal
  customConnectionIds?: string[];  // Custom visual connections (doesn't affect hierarchy)

  // Time boundaries
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD

  // AI metadata
  aiGenerated: boolean;
  aiContext?: string;  // JSON string of original interview context or generation params

  // Progress tracking
  status: GoalStatus;
  completionPercentage: number;  // 0-100, calculated from children or linked tasks

  // User customization
  order: number;  // For ordering siblings
  customFields?: Record<string, any>;  // Extensibility for future features

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface InterviewResponse {
  questionId: string;
  question: string;
  answer: string;
  timestamp: number;
}

export interface GoalPlan {
  id: string;
  title: string;  // e.g., "2025 Goals"
  yearGoalId: string;  // Primary/first root goal ID (for backward compatibility)
  yearGoalIds: string[];  // All root goal IDs (supports multiple year goals)

  // All goals in hierarchy (denormalized for efficient loading)
  goals: Goal[];

  // Interview metadata
  interviewDate: number;
  interviewResponses: InterviewResponse[];

  // Plan-level settings
  isActive: boolean;  // Only one plan can be active at a time
  aiModel: string;  // Track which AI model generated it (e.g., "claude-opus-4-5", "manual")

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface GoalPlanIndex {
  id: string;
  title: string;
  yearGoalTitle: string;
  isActive: boolean;
  createdAt: number;
  storageKey: string;  // localStorage key for this plan
}

// Helper type for goal tree traversal
export interface GoalNode extends Goal {
  children: GoalNode[];
  parent?: GoalNode;
  depth: number;  // 0 for year, 1 for quarter, etc.
}

// Type for goal templates (future enhancement)
export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;  // e.g., "career", "fitness", "learning"
  samplePlan: {
    year: string;
    quarters: string[];
    estimatedTimePerWeek: number;
  };
}
