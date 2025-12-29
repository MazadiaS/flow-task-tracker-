import type { Goal, GoalPlan, InterviewResponse } from '../types/goals';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const API_URL = 'https://api.openai.com/v1/chat/completions';

interface GenerationCallbacks {
  onProgress: (stage: string, item: string) => void;
  onError: (error: Error) => void;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Extract JSON from AI response (handles markdown code blocks)
 */
function extractJSON(text: string): any {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('No valid JSON found in AI response');
}

/**
 * Call OpenAI API with timeout and error handling
 */
async function callOpenAI(prompt: string, maxTokens: number = 2000): Promise<string> {
  if (!API_KEY) {
    throw new Error('No API key configured. Please set VITE_OPENAI_API_KEY in .env file.');
  }

  // Check if online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. AI features require network access.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{
          role: 'system',
          content: 'You are an expert goal-setting coach and learning plan architect. Always respond with valid JSON in the exact format requested.'
        }, {
          role: 'user',
          content: prompt
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.statusText} - ${errorText}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
    }
    throw error;
  }
}

/**
 * Generate year goal from interview responses
 */
async function generateYearGoal(
  responses: InterviewResponse[],
  callbacks: GenerationCallbacks
): Promise<Goal> {
  callbacks.onProgress('year', 'Analyzing your responses...');

  const answersText = responses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n');

  const prompt = `You are an expert goal-setting coach and learning plan architect.

Based on this interview with a user, create a comprehensive year-long goal.

Interview Responses:
${answersText}

Create a year goal with:
1. A clear, inspiring title (max 60 characters)
2. A detailed description (2-3 paragraphs) covering:
   - What success looks like at the end of the year
   - Key milestones and outcomes
   - How this fits the user's constraints and preferences

Return ONLY valid JSON in this exact format:
{
  "title": "Goal title here",
  "description": "Detailed description here",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}`;

  try {
    const responseText = await callOpenAI(prompt, 1000);
    const data = extractJSON(responseText);

    const yearGoal: Goal = {
      id: `goal-year-${Date.now()}`,
      title: data.title,
      description: data.description,
      level: 'year',
      parentId: undefined,
      childIds: [],
      linkedTaskIds: [],
      startDate: data.startDate,
      endDate: data.endDate,
      aiGenerated: true,
      aiContext: JSON.stringify(responses),
      status: 'not-started',
      completionPercentage: 0,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return yearGoal;
  } catch (error) {
    callbacks.onError(error as Error);
    throw error;
  }
}

/**
 * Generate quarter goals from year goal
 */
async function generateQuarterGoals(
  yearGoal: Goal,
  responses: InterviewResponse[],
  callbacks: GenerationCallbacks
): Promise<Goal[]> {
  callbacks.onProgress('quarters', 'Planning quarters...');

  const timeCommitment = responses.find(r => r.question.toLowerCase().includes('time'))?.answer || 'not specified';
  const constraints = responses.find(r => r.question.toLowerCase().includes('constraint'))?.answer || 'none specified';

  const prompt = `You are breaking down a year-long goal into 4 quarterly goals.

Year Goal:
Title: ${yearGoal.title}
Description: ${yearGoal.description}

User Context:
- Time Commitment: ${timeCommitment}
- Constraints: ${constraints}

Create 4 quarter goals (Q1-Q4) that:
1. Build progressively toward the year goal
2. Each has clear, measurable outcomes
3. Respect the user's time constraints
4. Account for mentioned constraints

Return ONLY valid JSON array in this exact format:
[
  {
    "quarter": 1,
    "title": "Q1 goal title",
    "description": "What will be accomplished in Q1",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31"
  },
  {
    "quarter": 2,
    "title": "Q2 goal title",
    "description": "What will be accomplished in Q2",
    "startDate": "2025-04-01",
    "endDate": "2025-06-30"
  },
  {
    "quarter": 3,
    "title": "Q3 goal title",
    "description": "What will be accomplished in Q3",
    "startDate": "2025-07-01",
    "endDate": "2025-09-30"
  },
  {
    "quarter": 4,
    "title": "Q4 goal title",
    "description": "What will be accomplished in Q4",
    "startDate": "2025-10-01",
    "endDate": "2025-12-31"
  }
]`;

  try {
    const responseText = await callOpenAI(prompt, 2000);
    const data = extractJSON(responseText);

    const quarterGoals: Goal[] = data.map((q: any, index: number) => {
      const goal: Goal = {
        id: `goal-q${q.quarter}-${Date.now()}-${index}`,
        title: q.title,
        description: q.description,
        level: 'quarter',
        parentId: yearGoal.id,
        childIds: [],
        linkedTaskIds: [],
        startDate: q.startDate,
        endDate: q.endDate,
        aiGenerated: true,
        aiContext: JSON.stringify({ yearGoal, responses }),
        status: 'not-started',
        completionPercentage: 0,
        order: index,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      yearGoal.childIds.push(goal.id);
      return goal;
    });

    return quarterGoals;
  } catch (error) {
    callbacks.onError(error as Error);
    throw error;
  }
}

/**
 * Generate month goals for first quarter only
 */
async function generateMonthGoals(
  quarterGoal: Goal,
  responses: InterviewResponse[],
  callbacks: GenerationCallbacks
): Promise<Goal[]> {
  callbacks.onProgress('months', 'Planning first quarter months...');

  const prompt = `You are breaking down a quarterly goal into 3 monthly goals.

Quarter Goal:
Title: ${quarterGoal.title}
Description: ${quarterGoal.description}
Period: ${quarterGoal.startDate} to ${quarterGoal.endDate}

Create 3 month goals that:
1. Progress logically through the quarter
2. Each has specific, actionable outcomes
3. Build on each other sequentially

Return ONLY valid JSON array in this exact format:
[
  {
    "month": 1,
    "title": "Month 1 goal title",
    "description": "What will be accomplished",
    "startDate": "${quarterGoal.startDate}",
    "endDate": "2025-01-31"
  },
  {
    "month": 2,
    "title": "Month 2 goal title",
    "description": "What will be accomplished",
    "startDate": "2025-02-01",
    "endDate": "2025-02-28"
  },
  {
    "month": 3,
    "title": "Month 3 goal title",
    "description": "What will be accomplished",
    "startDate": "2025-03-01",
    "endDate": "${quarterGoal.endDate}"
  }
]`;

  try {
    const responseText = await callOpenAI(prompt, 2000);
    const data = extractJSON(responseText);

    const monthGoals: Goal[] = data.map((m: any, index: number) => {
      const goal: Goal = {
        id: `goal-month-${Date.now()}-${index}`,
        title: m.title,
        description: m.description,
        level: 'month',
        parentId: quarterGoal.id,
        childIds: [],
        linkedTaskIds: [],
        startDate: m.startDate,
        endDate: m.endDate,
        aiGenerated: true,
        aiContext: JSON.stringify({ quarterGoal, responses }),
        status: 'not-started',
        completionPercentage: 0,
        order: index,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      quarterGoal.childIds.push(goal.id);
      return goal;
    });

    return monthGoals;
  } catch (error) {
    callbacks.onError(error as Error);
    throw error;
  }
}

/**
 * Generate week goals for first month only
 */
async function generateWeekGoals(
  monthGoal: Goal,
  responses: InterviewResponse[],
  callbacks: GenerationCallbacks
): Promise<Goal[]> {
  callbacks.onProgress('weeks', 'Planning first month weeks...');

  const prompt = `You are breaking down a monthly goal into weekly goals.

Month Goal:
Title: ${monthGoal.title}
Description: ${monthGoal.description}
Period: ${monthGoal.startDate} to ${monthGoal.endDate}

Create approximately 4 week goals that:
1. Break down the month into manageable weekly milestones
2. Each has clear, achievable outcomes
3. Progress logically week by week

Return ONLY valid JSON array in this exact format:
[
  {
    "week": 1,
    "title": "Week 1 goal title",
    "description": "What will be accomplished this week",
    "startDate": "${monthGoal.startDate}",
    "endDate": "2025-01-07"
  },
  {
    "week": 2,
    "title": "Week 2 goal title",
    "description": "What will be accomplished this week",
    "startDate": "2025-01-08",
    "endDate": "2025-01-14"
  },
  {
    "week": 3,
    "title": "Week 3 goal title",
    "description": "What will be accomplished this week",
    "startDate": "2025-01-15",
    "endDate": "2025-01-21"
  },
  {
    "week": 4,
    "title": "Week 4 goal title",
    "description": "What will be accomplished this week",
    "startDate": "2025-01-22",
    "endDate": "${monthGoal.endDate}"
  }
]`;

  try {
    const responseText = await callOpenAI(prompt, 1500);
    const data = extractJSON(responseText);

    const weekGoals: Goal[] = data.map((w: any, index: number) => {
      const goal: Goal = {
        id: `goal-week-${Date.now()}-${index}`,
        title: w.title,
        description: w.description,
        level: 'week',
        parentId: monthGoal.id,
        childIds: [],
        linkedTaskIds: [],
        startDate: w.startDate,
        endDate: w.endDate,
        aiGenerated: true,
        aiContext: JSON.stringify({ monthGoal, responses }),
        status: 'not-started',
        completionPercentage: 0,
        order: index,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      monthGoal.childIds.push(goal.id);
      return goal;
    });

    return weekGoals;
  } catch (error) {
    callbacks.onError(error as Error);
    throw error;
  }
}

/**
 * Main function to generate complete goal plan from interview
 */
export async function generateGoalPlanFromInterview(
  responses: InterviewResponse[],
  callbacks: GenerationCallbacks
): Promise<GoalPlan> {

  // Step 1: Generate year goal
  const yearGoal = await generateYearGoal(responses, callbacks);

  // Step 2: Generate quarter goals
  const quarterGoals = await generateQuarterGoals(yearGoal, responses, callbacks);

  // Step 3: Generate month goals (for Q1 only)
  const monthGoals = await generateMonthGoals(quarterGoals[0], responses, callbacks);

  // Step 4: Generate week goals (for first month only)
  const weekGoals = await generateWeekGoals(monthGoals[0], responses, callbacks);

  callbacks.onProgress('complete', 'Finalizing your plan...');

  // Combine all goals
  const allGoals = [
    yearGoal,
    ...quarterGoals,
    ...monthGoals,
    ...weekGoals
  ];

  const plan: GoalPlan = {
    id: Date.now().toString(),
    title: yearGoal.title,
    yearGoalId: yearGoal.id,
    yearGoalIds: [yearGoal.id],
    goals: allGoals,
    interviewDate: Date.now(),
    interviewResponses: responses,
    isActive: true,
    aiModel: 'gpt-4o',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  return plan;
}
