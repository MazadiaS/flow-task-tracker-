import { useCallback, useRef, useState, useEffect, memo, lazy, Suspense } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { GoalPlan, GoalLevel, Goal } from '../../types/goals';
import { useHistory } from '../../hooks/useHistory';
import NodeEditor from './FlowchartEditor/NodeEditor';
import QuickAddGoalMenu from '../Goals/QuickAddGoalMenu';
import './FlowchartEditor.css';

const GoalEditor = lazy(() => import('../Goals/GoalEditor'));

interface Props {
  onBack: () => void;
  onShowGoals?: () => void;
  goalPlan?: GoalPlan;
  onCreateGoal?: (goal: Goal) => void;
  isDeveloperMode?: boolean;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'checkbox' | 'code' | 'quote' | 'divider' | 'table' | 'image' | 'link';
  content: string;
  metadata?: {
    checked?: boolean;
    language?: string;
    rows?: string[][];
    url?: string;
    comment?: string;
    showComment?: boolean;
  };
}

interface NodeData extends Record<string, unknown> {
  label: string;
  blocks?: ContentBlock[];
}

// Simple Architecture diagram nodes (component overview)
const architectureNodes: Node[] = [
  // Core Layer
  { id: 'app', type: 'default', data: { label: 'App.tsx (Root)' }, position: { x: 400, y: 20 } },
  { id: 'context', type: 'default', data: { label: 'AppContext (State)' }, position: { x: 650, y: 20 } },

  // Views Layer
  { id: 'daysession', type: 'default', data: { label: 'DaySession' }, position: { x: 100, y: 120 } },
  { id: 'tasklist', type: 'default', data: { label: 'TaskList' }, position: { x: 280, y: 120 } },
  { id: 'taskdetail', type: 'default', data: { label: 'TaskDetail' }, position: { x: 460, y: 120 } },
  { id: 'goals', type: 'default', data: { label: 'GoalPlanView' }, position: { x: 640, y: 120 } },
  { id: 'flowchart', type: 'default', data: { label: 'FlowchartEditor' }, position: { x: 820, y: 120 } },

  // Secondary Views
  { id: 'stats', type: 'default', data: { label: 'Statistics' }, position: { x: 100, y: 220 } },
  { id: 'archive', type: 'default', data: { label: 'Archive' }, position: { x: 280, y: 220 } },
  { id: 'timeline', type: 'default', data: { label: 'TimelineView' }, position: { x: 460, y: 220 } },

  // Goal Components
  { id: 'goalflow', type: 'default', data: { label: 'GoalFlowGraph' }, position: { x: 580, y: 220 } },
  { id: 'goalmind', type: 'default', data: { label: 'GoalMindMap' }, position: { x: 720, y: 220 } },
  { id: 'goaleditor', type: 'default', data: { label: 'GoalEditor' }, position: { x: 860, y: 220 } },

  // Modals
  { id: 'addtask', type: 'default', data: { label: 'AddTaskModal' }, position: { x: 280, y: 320 } },
  { id: 'edittask', type: 'default', data: { label: 'EditTaskModal' }, position: { x: 460, y: 320 } },
  { id: 'endday', type: 'default', data: { label: 'EndDayModal' }, position: { x: 100, y: 320 } },

  // Utils Layer
  { id: 'storage', type: 'default', data: { label: 'storage.ts' }, position: { x: 150, y: 440 } },
  { id: 'goalstorage', type: 'default', data: { label: 'goalStorage.ts' }, position: { x: 320, y: 440 } },
  { id: 'timeutils', type: 'default', data: { label: 'timeUtils.ts' }, position: { x: 490, y: 440 } },
  { id: 'taskcalc', type: 'default', data: { label: 'taskCalculations' }, position: { x: 660, y: 440 } },
  { id: 'goalcalc', type: 'default', data: { label: 'goalCalculations' }, position: { x: 830, y: 440 } },

  // AI & Security
  { id: 'ai', type: 'default', data: { label: 'AI Generation' }, position: { x: 720, y: 320 } },
  { id: 'security', type: 'default', data: { label: 'security.ts' }, position: { x: 880, y: 320 } },

  // Data Layer
  { id: 'localstorage', type: 'default', data: { label: 'localStorage' }, position: { x: 400, y: 540 } },

  // Types
  { id: 'types', type: 'default', data: { label: 'Types (Task, Goal, AppState)' }, position: { x: 650, y: 540 } },
];

const architectureEdges: Edge[] = [
  // App connections
  { id: 'e1', source: 'app', target: 'context' },
  { id: 'e2', source: 'app', target: 'daysession' },
  { id: 'e3', source: 'app', target: 'tasklist' },
  { id: 'e4', source: 'app', target: 'taskdetail' },
  { id: 'e5', source: 'app', target: 'goals' },
  { id: 'e6', source: 'app', target: 'flowchart' },
  { id: 'e7', source: 'app', target: 'stats' },
  { id: 'e8', source: 'app', target: 'archive' },
  { id: 'e9', source: 'app', target: 'timeline' },

  // TaskList connections
  { id: 'e10', source: 'tasklist', target: 'addtask' },
  { id: 'e11', source: 'tasklist', target: 'edittask' },

  // DaySession connections
  { id: 'e12', source: 'daysession', target: 'endday' },

  // Goal connections
  { id: 'e13', source: 'goals', target: 'goalflow' },
  { id: 'e14', source: 'goals', target: 'goalmind' },
  { id: 'e15', source: 'goals', target: 'goaleditor' },
  { id: 'e16', source: 'goals', target: 'ai' },

  // Context to storage
  { id: 'e17', source: 'context', target: 'storage' },
  { id: 'e18', source: 'context', target: 'goalstorage' },

  // Utils usage
  { id: 'e19', source: 'taskdetail', target: 'timeutils' },
  { id: 'e20', source: 'tasklist', target: 'taskcalc' },
  { id: 'e21', source: 'goals', target: 'goalcalc' },
  { id: 'e22', source: 'addtask', target: 'security' },

  // Storage to localStorage
  { id: 'e23', source: 'storage', target: 'localstorage' },
  { id: 'e24', source: 'goalstorage', target: 'localstorage' },

  // Types connections
  { id: 'e25', source: 'storage', target: 'types' },
  { id: 'e26', source: 'taskcalc', target: 'types' },
  { id: 'e27', source: 'goalcalc', target: 'types' },
];

// Deep Technical Architecture - Full Stack View
const deepArchitectureNodes: Node[] = [
  // ========== USER/CLIENT LAYER ==========
  { id: 'user', type: 'default', data: { label: 'USER' }, position: { x: 500, y: 0 } },

  // ========== DEPLOYMENT LAYER ==========
  { id: 'deploy-header', type: 'default', data: { label: '--- DEPLOYMENT ---' }, position: { x: 500, y: 60 } },
  { id: 'pwa', type: 'default', data: { label: 'PWA (Service Worker)' }, position: { x: 300, y: 100 } },
  { id: 'electron', type: 'default', data: { label: 'Electron Desktop' }, position: { x: 500, y: 100 } },
  { id: 'web', type: 'default', data: { label: 'Web Browser' }, position: { x: 700, y: 100 } },

  // ========== BUILD LAYER ==========
  { id: 'build-header', type: 'default', data: { label: '--- BUILD SYSTEM ---' }, position: { x: 500, y: 170 } },
  { id: 'vite', type: 'default', data: { label: 'Vite 7.3 (Dev Server + Bundler)' }, position: { x: 300, y: 210 } },
  { id: 'typescript', type: 'default', data: { label: 'TypeScript 5.9' }, position: { x: 500, y: 210 } },
  { id: 'esbuild', type: 'default', data: { label: 'esbuild (Minifier)' }, position: { x: 700, y: 210 } },

  // ========== FRAMEWORK LAYER ==========
  { id: 'fw-header', type: 'default', data: { label: '--- FRAMEWORK ---' }, position: { x: 500, y: 280 } },
  { id: 'react', type: 'default', data: { label: 'React 19.2 (UI Library)' }, position: { x: 400, y: 320 } },
  { id: 'reactdom', type: 'default', data: { label: 'ReactDOM (Renderer)' }, position: { x: 600, y: 320 } },

  // ========== APPLICATION LAYER ==========
  { id: 'app-header', type: 'default', data: { label: '--- APPLICATION ---' }, position: { x: 500, y: 390 } },
  { id: 'app-root', type: 'default', data: { label: 'App.tsx (Root Component)' }, position: { x: 500, y: 430 } },

  // State Management
  { id: 'state-header', type: 'default', data: { label: '-- State Management --' }, position: { x: 200, y: 480 } },
  { id: 'usestate', type: 'default', data: { label: 'useState<AppState>' }, position: { x: 100, y: 520 } },
  { id: 'usecallback', type: 'default', data: { label: 'useCallback (Handlers)' }, position: { x: 280, y: 520 } },
  { id: 'usememo', type: 'default', data: { label: 'useMemo (Derived Data)' }, position: { x: 450, y: 520 } },
  { id: 'debounce', type: 'default', data: { label: 'debounce(500ms)' }, position: { x: 620, y: 520 } },

  // Views
  { id: 'views-header', type: 'default', data: { label: '-- Views (Lazy Loaded) --' }, position: { x: 800, y: 480 } },
  { id: 'tasklist-view', type: 'default', data: { label: 'TaskList' }, position: { x: 750, y: 520 } },
  { id: 'goals-view', type: 'default', data: { label: 'GoalPlanView' }, position: { x: 880, y: 520 } },
  { id: 'stats-view', type: 'default', data: { label: 'Statistics' }, position: { x: 1010, y: 520 } },

  // ========== DATA LAYER ==========
  { id: 'data-header', type: 'default', data: { label: '--- DATA LAYER ---' }, position: { x: 500, y: 600 } },

  // Types
  { id: 'types-header', type: 'default', data: { label: '-- TypeScript Types --' }, position: { x: 150, y: 640 } },
  { id: 'task-type', type: 'default', data: { label: 'Task { id, title, status, duration... }' }, position: { x: 50, y: 680 } },
  { id: 'goal-type', type: 'default', data: { label: 'Goal { id, title, level, childIds... }' }, position: { x: 280, y: 680 } },
  { id: 'appstate-type', type: 'default', data: { label: 'AppState { currentDay, taskLibrary, archive... }' }, position: { x: 150, y: 730 } },

  // Storage Utils
  { id: 'storage-header', type: 'default', data: { label: '-- Storage Utils --' }, position: { x: 550, y: 640 } },
  { id: 'storage-ts', type: 'default', data: { label: 'storage.ts (saveState, loadState)' }, position: { x: 480, y: 680 } },
  { id: 'goalstorage-ts', type: 'default', data: { label: 'goalStorage.ts (saveGoalPlan)' }, position: { x: 700, y: 680 } },
  { id: 'validation', type: 'default', data: { label: 'validation.ts (validateAppState)' }, position: { x: 590, y: 730 } },

  // Security
  { id: 'security-header', type: 'default', data: { label: '-- Security --' }, position: { x: 920, y: 640 } },
  { id: 'dompurify', type: 'default', data: { label: 'DOMPurify (XSS Protection)' }, position: { x: 880, y: 680 } },
  { id: 'security-ts', type: 'default', data: { label: 'security.ts (safeLocalStorageSet)' }, position: { x: 880, y: 730 } },

  // ========== PERSISTENCE LAYER ==========
  { id: 'persist-header', type: 'default', data: { label: '--- PERSISTENCE (NO SERVER) ---' }, position: { x: 500, y: 810 } },

  // LocalStorage Keys
  { id: 'ls-main', type: 'default', data: { label: 'localStorage: "task-tracker-data"' }, position: { x: 200, y: 860 } },
  { id: 'ls-goals', type: 'default', data: { label: 'localStorage: "task-tracker-goal-plan-{id}"' }, position: { x: 500, y: 860 } },
  { id: 'ls-flowchart', type: 'default', data: { label: 'localStorage: "task-tracker-flowchart-data"' }, position: { x: 800, y: 860 } },

  // Data Structure
  { id: 'json-header', type: 'default', data: { label: '-- JSON Structure --' }, position: { x: 500, y: 920 } },
  { id: 'json-data', type: 'default', data: { label: 'JSON.stringify({ currentDay, taskLibrary, archive, activeGoalPlan... })' }, position: { x: 500, y: 960 } },

  // ========== BROWSER API ==========
  { id: 'browser-header', type: 'default', data: { label: '--- BROWSER STORAGE API ---' }, position: { x: 500, y: 1030 } },
  { id: 'browser-ls', type: 'default', data: { label: 'window.localStorage (5-10MB limit)' }, position: { x: 500, y: 1070 } },

  // ========== THIRD PARTY LIBS ==========
  { id: 'libs-header', type: 'default', data: { label: '--- THIRD PARTY LIBRARIES ---' }, position: { x: 1100, y: 390 } },
  { id: 'xyflow', type: 'default', data: { label: '@xyflow/react (Flowcharts)' }, position: { x: 1100, y: 430 } },
  { id: 'html2canvas', type: 'default', data: { label: 'html2canvas (Screenshot)' }, position: { x: 1100, y: 480 } },
  { id: 'jspdf', type: 'default', data: { label: 'jsPDF (PDF Export)' }, position: { x: 1100, y: 530 } },
];

const deepArchitectureEdges: Edge[] = [
  // User to deployment
  { id: 'd1', source: 'user', target: 'pwa' },
  { id: 'd2', source: 'user', target: 'electron' },
  { id: 'd3', source: 'user', target: 'web' },

  // Deployment to build
  { id: 'd4', source: 'pwa', target: 'vite' },
  { id: 'd5', source: 'electron', target: 'vite' },
  { id: 'd6', source: 'web', target: 'vite' },

  // Build tools
  { id: 'd7', source: 'vite', target: 'typescript' },
  { id: 'd8', source: 'typescript', target: 'esbuild' },

  // Framework
  { id: 'd9', source: 'vite', target: 'react' },
  { id: 'd10', source: 'react', target: 'reactdom' },

  // App structure
  { id: 'd11', source: 'reactdom', target: 'app-root' },
  { id: 'd12', source: 'app-root', target: 'usestate' },
  { id: 'd13', source: 'app-root', target: 'usecallback' },
  { id: 'd14', source: 'app-root', target: 'usememo' },
  { id: 'd15', source: 'usecallback', target: 'debounce' },

  // Views
  { id: 'd16', source: 'app-root', target: 'tasklist-view' },
  { id: 'd17', source: 'app-root', target: 'goals-view' },
  { id: 'd18', source: 'app-root', target: 'stats-view' },

  // State to Types
  { id: 'd19', source: 'usestate', target: 'appstate-type' },
  { id: 'd20', source: 'appstate-type', target: 'task-type' },
  { id: 'd21', source: 'appstate-type', target: 'goal-type' },

  // State to Storage
  { id: 'd22', source: 'debounce', target: 'storage-ts' },
  { id: 'd23', source: 'goals-view', target: 'goalstorage-ts' },
  { id: 'd24', source: 'storage-ts', target: 'validation' },

  // Security
  { id: 'd25', source: 'storage-ts', target: 'security-ts' },
  { id: 'd26', source: 'security-ts', target: 'dompurify' },

  // Storage to localStorage
  { id: 'd27', source: 'storage-ts', target: 'ls-main' },
  { id: 'd28', source: 'goalstorage-ts', target: 'ls-goals' },
  { id: 'd29', source: 'xyflow', target: 'ls-flowchart' },

  // localStorage to JSON
  { id: 'd30', source: 'ls-main', target: 'json-data' },
  { id: 'd31', source: 'ls-goals', target: 'json-data' },
  { id: 'd32', source: 'ls-flowchart', target: 'json-data' },

  // JSON to Browser
  { id: 'd33', source: 'json-data', target: 'browser-ls' },

  // Third party libs
  { id: 'd34', source: 'app-root', target: 'xyflow' },
  { id: 'd35', source: 'xyflow', target: 'html2canvas' },
  { id: 'd36', source: 'html2canvas', target: 'jspdf' },
];

// Templates for common flowchart structures
const projectPlanTemplate = {
  nodes: [
    { id: '1', type: 'default', data: { label: 'Project Kickoff' }, position: { x: 250, y: 50 } },
    { id: '2', type: 'default', data: { label: 'Requirements Gathering' }, position: { x: 250, y: 150 } },
    { id: '3', type: 'default', data: { label: 'Design Phase' }, position: { x: 100, y: 250 } },
    { id: '4', type: 'default', data: { label: 'Development' }, position: { x: 400, y: 250 } },
    { id: '5', type: 'default', data: { label: 'Testing & QA' }, position: { x: 250, y: 350 } },
    { id: '6', type: 'default', data: { label: 'Deployment' }, position: { x: 250, y: 450 } },
    { id: '7', type: 'default', data: { label: 'Maintenance' }, position: { x: 250, y: 550 } },
  ] as Node[],
  edges: [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e3-5', source: '3', target: '5' },
    { id: 'e4-5', source: '4', target: '5' },
    { id: 'e5-6', source: '5', target: '6' },
    { id: 'e6-7', source: '6', target: '7' },
  ] as Edge[],
};

const mindMapTemplate = {
  nodes: [
    { id: 'center', type: 'default', data: { label: 'Main Idea' }, position: { x: 300, y: 250 } },
    { id: 'branch1', type: 'default', data: { label: 'Concept 1' }, position: { x: 100, y: 100 } },
    { id: 'branch2', type: 'default', data: { label: 'Concept 2' }, position: { x: 500, y: 100 } },
    { id: 'branch3', type: 'default', data: { label: 'Concept 3' }, position: { x: 100, y: 400 } },
    { id: 'branch4', type: 'default', data: { label: 'Concept 4' }, position: { x: 500, y: 400 } },
    { id: 'detail1a', type: 'default', data: { label: 'Detail 1A' }, position: { x: 50, y: 0 } },
    { id: 'detail1b', type: 'default', data: { label: 'Detail 1B' }, position: { x: 150, y: 0 } },
    { id: 'detail2a', type: 'default', data: { label: 'Detail 2A' }, position: { x: 450, y: 0 } },
    { id: 'detail2b', type: 'default', data: { label: 'Detail 2B' }, position: { x: 550, y: 0 } },
  ] as Node[],
  edges: [
    { id: 'ec-b1', source: 'center', target: 'branch1' },
    { id: 'ec-b2', source: 'center', target: 'branch2' },
    { id: 'ec-b3', source: 'center', target: 'branch3' },
    { id: 'ec-b4', source: 'center', target: 'branch4' },
    { id: 'eb1-d1a', source: 'branch1', target: 'detail1a' },
    { id: 'eb1-d1b', source: 'branch1', target: 'detail1b' },
    { id: 'eb2-d2a', source: 'branch2', target: 'detail2a' },
    { id: 'eb2-d2b', source: 'branch2', target: 'detail2b' },
  ] as Edge[],
};

const decisionTreeTemplate = {
  nodes: [
    { id: 'start', type: 'default', data: { label: 'Start Decision' }, position: { x: 300, y: 50 } },
    { id: 'question1', type: 'default', data: { label: 'Question 1?' }, position: { x: 300, y: 150 } },
    { id: 'yes1', type: 'default', data: { label: 'Yes Path' }, position: { x: 150, y: 250 } },
    { id: 'no1', type: 'default', data: { label: 'No Path' }, position: { x: 450, y: 250 } },
    { id: 'question2', type: 'default', data: { label: 'Question 2?' }, position: { x: 150, y: 350 } },
    { id: 'question3', type: 'default', data: { label: 'Question 3?' }, position: { x: 450, y: 350 } },
    { id: 'result1', type: 'default', data: { label: 'Result A' }, position: { x: 50, y: 450 } },
    { id: 'result2', type: 'default', data: { label: 'Result B' }, position: { x: 250, y: 450 } },
    { id: 'result3', type: 'default', data: { label: 'Result C' }, position: { x: 400, y: 450 } },
    { id: 'result4', type: 'default', data: { label: 'Result D' }, position: { x: 550, y: 450 } },
  ] as Node[],
  edges: [
    { id: 'es-q1', source: 'start', target: 'question1' },
    { id: 'eq1-y1', source: 'question1', target: 'yes1', label: 'Yes' },
    { id: 'eq1-n1', source: 'question1', target: 'no1', label: 'No' },
    { id: 'ey1-q2', source: 'yes1', target: 'question2' },
    { id: 'en1-q3', source: 'no1', target: 'question3' },
    { id: 'eq2-r1', source: 'question2', target: 'result1', label: 'Yes' },
    { id: 'eq2-r2', source: 'question2', target: 'result2', label: 'No' },
    { id: 'eq3-r3', source: 'question3', target: 'result3', label: 'Yes' },
    { id: 'eq3-r4', source: 'question3', target: 'result4', label: 'No' },
  ] as Edge[],
};

// Under the Hood - Detailed Runtime Architecture
const underTheHoodNodes: Node[] = [
  // ========== USER INTERACTION ==========
  { id: 'uth-user', type: 'default', data: { label: '👤 USER ACTION (Click, Type, Timer)' }, position: { x: 500, y: 0 }, style: { background: '#667eea', color: '#fff', fontWeight: 'bold' } },

  // ========== EVENT HANDLING ==========
  { id: 'uth-event-header', type: 'default', data: { label: '━━━ EVENT HANDLING ━━━' }, position: { x: 500, y: 70 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-component-handler', type: 'default', data: { label: 'Component Event Handler\n(onClick, onChange, onSubmit)' }, position: { x: 300, y: 120 } },
  { id: 'uth-callback', type: 'default', data: { label: 'useCallback Handler\n(handleAddTask, handleUpdateTask)' }, position: { x: 550, y: 120 } },
  { id: 'uth-validation', type: 'default', data: { label: 'Input Validation\n(DOMPurify XSS check)' }, position: { x: 800, y: 120 } },

  // ========== STATE UPDATE FLOW ==========
  { id: 'uth-state-header', type: 'default', data: { label: '━━━ STATE MANAGEMENT ━━━' }, position: { x: 500, y: 200 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-setstate', type: 'default', data: { label: 'setState(prevState => ...)\nReact State Update' }, position: { x: 500, y: 250 }, style: { background: '#f093fb', color: '#000' } },
  { id: 'uth-appstate', type: 'default', data: { label: 'AppState Object\n{ currentDay, taskLibrary,\narchive, activeGoalPlan }' }, position: { x: 500, y: 330 }, style: { background: '#4facfe', color: '#fff' } },

  // ========== REACT LIFECYCLE ==========
  { id: 'uth-lifecycle-header', type: 'default', data: { label: '━━━ REACT LIFECYCLE ━━━' }, position: { x: 500, y: 410 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-rerender', type: 'default', data: { label: 'React Re-renders Components\n(Virtual DOM Diff)' }, position: { x: 200, y: 460 } },
  { id: 'uth-useeffect', type: 'default', data: { label: 'useEffect Triggers\n(state dependency changed)' }, position: { x: 500, y: 460 }, style: { background: '#fa709a', color: '#fff' } },
  { id: 'uth-usememo', type: 'default', data: { label: 'useMemo Recalculates\n(derived data, selectedTask)' }, position: { x: 800, y: 460 } },

  // ========== PERSISTENCE PIPELINE ==========
  { id: 'uth-persist-header', type: 'default', data: { label: '━━━ PERSISTENCE PIPELINE ━━━' }, position: { x: 500, y: 540 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-debounce-1', type: 'default', data: { label: 'Debounce Queue (500ms)\nPrevents excessive writes' }, position: { x: 500, y: 590 }, style: { background: '#fee140', color: '#000' } },
  { id: 'uth-savestateutil', type: 'default', data: { label: 'saveState(state)\nutils/storage.ts' }, position: { x: 500, y: 670 } },

  // ========== STORAGE LAYER ==========
  { id: 'uth-storage-header', type: 'default', data: { label: '━━━ STORAGE LAYER ━━━' }, position: { x: 500, y: 750 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-migration', type: 'default', data: { label: 'Migration Check\ntaskMigration.ts\n(add missing fields)' }, position: { x: 200, y: 800 } },
  { id: 'uth-validation-storage', type: 'default', data: { label: 'Validation\nvalidateAppState()\n(check schema)' }, position: { x: 400, y: 800 } },
  { id: 'uth-archive-trim', type: 'default', data: { label: 'Archive Trimming\n(keep last 365 days)' }, position: { x: 600, y: 800 } },
  { id: 'uth-json-stringify', type: 'default', data: { label: 'JSON.stringify(state)\n(serialize to string)' }, position: { x: 800, y: 800 } },

  // ========== BROWSER API ==========
  { id: 'uth-browser-header', type: 'default', data: { label: '━━━ BROWSER STORAGE API ━━━' }, position: { x: 500, y: 880 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-quota-check', type: 'default', data: { label: 'Quota Check\nsafeLocalStorageSet()\n(catch QuotaExceededError)' }, position: { x: 300, y: 930 } },
  { id: 'uth-localstorage-write', type: 'default', data: { label: 'localStorage.setItem(\n  "task-tracker-data",\n  json\n)' }, position: { x: 500, y: 930 }, style: { background: '#00f260', color: '#fff', fontWeight: 'bold' } },
  { id: 'uth-disk', type: 'default', data: { label: '💾 DISK PERSISTENCE\n(5-10MB Browser Storage)' }, position: { x: 700, y: 930 }, style: { background: '#0575e6', color: '#fff' } },

  // ========== AUTO-SYNC PIPELINE ==========
  { id: 'uth-sync-header', type: 'default', data: { label: '━━━ AUTO-SYNC (OPTIONAL) ━━━' }, position: { x: 1050, y: 540 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-trigger-sync', type: 'default', data: { label: 'triggerAutoSync()\ngistSync.ts' }, position: { x: 1050, y: 590 } },
  { id: 'uth-debounce-2', type: 'default', data: { label: 'Debounce (10s)\n+ Hash Check\n(detect changes)' }, position: { x: 1050, y: 670 }, style: { background: '#fee140', color: '#000' } },
  { id: 'uth-collect-backup', type: 'default', data: { label: 'collectBackupData()\n{ appState, goalPlans,\nflowchartData }' }, position: { x: 1050, y: 750 } },
  { id: 'uth-github-api', type: 'default', data: { label: 'GitHub Gist API\nPATCH /gists/{id}\n(Bearer token auth)' }, position: { x: 1050, y: 830 }, style: { background: '#f7971e', color: '#fff' } },
  { id: 'uth-cloud', type: 'default', data: { label: '☁️ CLOUD BACKUP\n(GitHub Gist)' }, position: { x: 1050, y: 910 }, style: { background: '#ffd200', color: '#000', fontWeight: 'bold' } },

  // ========== BACKGROUND SERVICES ==========
  { id: 'uth-bg-header', type: 'default', data: { label: '━━━ BACKGROUND SERVICES ━━━' }, position: { x: 100, y: 200 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-timer-service', type: 'default', data: { label: 'Timer Service\nsetInterval(1000ms)\n(day duration, active task)' }, position: { x: 100, y: 250 } },
  { id: 'uth-autosync-service', type: 'default', data: { label: 'Auto-Sync Service\nsetInterval(120000ms)\n(2-minute safety net)' }, position: { x: 100, y: 340 } },
  { id: 'uth-service-worker', type: 'default', data: { label: 'Service Worker\n(PWA caching,\noffline support)' }, position: { x: 100, y: 430 } },

  // ========== GOAL PROGRESS CALCULATION ==========
  { id: 'uth-goal-header', type: 'default', data: { label: '━━━ GOAL PROGRESS (COMPLEX) ━━━' }, position: { x: 1400, y: 200 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-goal-trigger', type: 'default', data: { label: 'Task Completion\nlinked to Goal?' }, position: { x: 1400, y: 250 } },
  { id: 'uth-goal-descendants', type: 'default', data: { label: 'getAllDescendantIds()\n(recursive tree traversal)' }, position: { x: 1400, y: 330 } },
  { id: 'uth-goal-scan', type: 'default', data: { label: 'Scan Archive + Current\n(count completed tasks)' }, position: { x: 1400, y: 410 } },
  { id: 'uth-goal-calc', type: 'default', data: { label: 'Calculate Progress %\nactual vs expected' }, position: { x: 1400, y: 490 } },
  { id: 'uth-goal-recursive', type: 'default', data: { label: 'updateGoalProgressRecursive()\n(update parent goals)' }, position: { x: 1400, y: 570 }, style: { background: '#ff6a00', color: '#fff' } },
  { id: 'uth-goal-save', type: 'default', data: { label: 'saveGoalPlan(plan)\n→ localStorage' }, position: { x: 1400, y: 650 } },

  // ========== AI INTEGRATION ==========
  { id: 'uth-ai-header', type: 'default', data: { label: '━━━ AI INTEGRATION ━━━' }, position: { x: 1400, y: 750 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-ai-trigger', type: 'default', data: { label: 'AI Request Trigger\n(task suggestion, goal gen)' }, position: { x: 1400, y: 800 } },
  { id: 'uth-ai-timeout', type: 'default', data: { label: 'AbortController\n(30s timeout)' }, position: { x: 1250, y: 870 } },
  { id: 'uth-openai-api', type: 'default', data: { label: 'OpenAI API\nGPT-4o / GPT-4o-mini\nstreaming responses' }, position: { x: 1400, y: 870 }, style: { background: '#10b981', color: '#fff', fontWeight: 'bold' } },
  { id: 'uth-ai-parse', type: 'default', data: { label: 'JSON Extraction\n(handle markdown code blocks)' }, position: { x: 1550, y: 870 } },

  // ========== RECOMMENDATION ENGINE ==========
  { id: 'uth-rec-header', type: 'default', data: { label: '━━━ RECOMMENDATION ENGINE ━━━' }, position: { x: 1750, y: 200 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-rec-historical', type: 'default', data: { label: 'Historical Analysis\nLast 7 days archive' }, position: { x: 1650, y: 260 } },
  { id: 'uth-rec-goal', type: 'default', data: { label: 'Goal-Based Analysis\nIdentify behind-schedule goals' }, position: { x: 1850, y: 260 } },
  { id: 'uth-rec-scoring', type: 'default', data: { label: 'Scoring Algorithm\nFrequency(40%) + Recency(40%)\n+ Streak(20%)' }, position: { x: 1750, y: 340 }, style: { background: '#ec38bc', color: '#fff' } },
  { id: 'uth-rec-optimize', type: 'default', data: { label: 'Map-Based Optimization\nO(n) lookup instead of\nnested filters' }, position: { x: 1750, y: 430 } },
  { id: 'uth-rec-output', type: 'default', data: { label: 'Top 5 Recommendations\n+ Dismissal tracking' }, position: { x: 1750, y: 510 } },

  // ========== DATA LOAD FLOW ==========
  { id: 'uth-load-header', type: 'default', data: { label: '━━━ APP INITIALIZATION ━━━' }, position: { x: 1750, y: 600 }, style: { background: '#764ba2', color: '#fff' } },
  { id: 'uth-load-trigger', type: 'default', data: { label: 'App Mount\ngetInitialState()' }, position: { x: 1750, y: 650 } },
  { id: 'uth-load-storage', type: 'default', data: { label: 'localStorage.getItem()\nJSON.parse()' }, position: { x: 1750, y: 720 } },
  { id: 'uth-load-migrate', type: 'default', data: { label: 'migrateTasks()\n(schema updates)' }, position: { x: 1650, y: 790 } },
  { id: 'uth-load-validate', type: 'default', data: { label: 'validateAppState()\n(type checking)' }, position: { x: 1850, y: 790 } },
  { id: 'uth-load-render', type: 'default', data: { label: 'Initial Render\nReact mounts components' }, position: { x: 1750, y: 860 } },
];

const underTheHoodEdges: Edge[] = [
  // User to Event Handling
  { id: 'uth-e1', source: 'uth-user', target: 'uth-component-handler', animated: true },
  { id: 'uth-e2', source: 'uth-component-handler', target: 'uth-callback' },
  { id: 'uth-e3', source: 'uth-callback', target: 'uth-validation' },
  { id: 'uth-e4', source: 'uth-validation', target: 'uth-setstate', animated: true },

  // State Update Flow
  { id: 'uth-e5', source: 'uth-setstate', target: 'uth-appstate', animated: true },
  { id: 'uth-e6', source: 'uth-appstate', target: 'uth-useeffect', animated: true },
  { id: 'uth-e7', source: 'uth-appstate', target: 'uth-rerender' },
  { id: 'uth-e8', source: 'uth-appstate', target: 'uth-usememo' },

  // Persistence Pipeline
  { id: 'uth-e9', source: 'uth-useeffect', target: 'uth-debounce-1', animated: true },
  { id: 'uth-e10', source: 'uth-debounce-1', target: 'uth-savestateutil', label: '500ms later', animated: true },
  { id: 'uth-e11', source: 'uth-savestateutil', target: 'uth-migration' },
  { id: 'uth-e12', source: 'uth-migration', target: 'uth-validation-storage' },
  { id: 'uth-e13', source: 'uth-validation-storage', target: 'uth-archive-trim' },
  { id: 'uth-e14', source: 'uth-archive-trim', target: 'uth-json-stringify' },
  { id: 'uth-e15', source: 'uth-json-stringify', target: 'uth-quota-check' },
  { id: 'uth-e16', source: 'uth-quota-check', target: 'uth-localstorage-write', animated: true },
  { id: 'uth-e17', source: 'uth-localstorage-write', target: 'uth-disk', animated: true },

  // Auto-Sync Pipeline
  { id: 'uth-e18', source: 'uth-useeffect', target: 'uth-trigger-sync' },
  { id: 'uth-e19', source: 'uth-trigger-sync', target: 'uth-debounce-2' },
  { id: 'uth-e20', source: 'uth-debounce-2', target: 'uth-collect-backup', label: '10s + hash match', animated: true },
  { id: 'uth-e21', source: 'uth-collect-backup', target: 'uth-github-api', animated: true },
  { id: 'uth-e22', source: 'uth-github-api', target: 'uth-cloud', animated: true },

  // Background Services (continuous loops)
  { id: 'uth-e23', source: 'uth-timer-service', target: 'uth-setstate', label: 'every 1s' },
  { id: 'uth-e24', source: 'uth-autosync-service', target: 'uth-trigger-sync', label: 'every 2min' },

  // Goal Progress Flow
  { id: 'uth-e25', source: 'uth-setstate', target: 'uth-goal-trigger' },
  { id: 'uth-e26', source: 'uth-goal-trigger', target: 'uth-goal-descendants', label: 'if linked' },
  { id: 'uth-e27', source: 'uth-goal-descendants', target: 'uth-goal-scan' },
  { id: 'uth-e28', source: 'uth-goal-scan', target: 'uth-goal-calc' },
  { id: 'uth-e29', source: 'uth-goal-calc', target: 'uth-goal-recursive', animated: true },
  { id: 'uth-e30', source: 'uth-goal-recursive', target: 'uth-goal-save' },
  { id: 'uth-e31', source: 'uth-goal-save', target: 'uth-localstorage-write' },

  // AI Integration
  { id: 'uth-e32', source: 'uth-callback', target: 'uth-ai-trigger', label: 'AI request' },
  { id: 'uth-e33', source: 'uth-ai-trigger', target: 'uth-ai-timeout' },
  { id: 'uth-e34', source: 'uth-ai-trigger', target: 'uth-openai-api', animated: true },
  { id: 'uth-e35', source: 'uth-openai-api', target: 'uth-ai-parse' },
  { id: 'uth-e36', source: 'uth-ai-parse', target: 'uth-setstate', label: 'update state', animated: true },

  // Recommendation Engine
  { id: 'uth-e37', source: 'uth-appstate', target: 'uth-rec-historical' },
  { id: 'uth-e38', source: 'uth-appstate', target: 'uth-rec-goal' },
  { id: 'uth-e39', source: 'uth-rec-historical', target: 'uth-rec-scoring' },
  { id: 'uth-e40', source: 'uth-rec-goal', target: 'uth-rec-scoring' },
  { id: 'uth-e41', source: 'uth-rec-scoring', target: 'uth-rec-optimize' },
  { id: 'uth-e42', source: 'uth-rec-optimize', target: 'uth-rec-output' },

  // Data Load Flow
  { id: 'uth-e43', source: 'uth-load-trigger', target: 'uth-load-storage' },
  { id: 'uth-e44', source: 'uth-load-storage', target: 'uth-load-migrate' },
  { id: 'uth-e45', source: 'uth-load-storage', target: 'uth-load-validate' },
  { id: 'uth-e46', source: 'uth-load-migrate', target: 'uth-load-render' },
  { id: 'uth-e47', source: 'uth-load-validate', target: 'uth-load-render' },
  { id: 'uth-e48', source: 'uth-load-render', target: 'uth-appstate', label: 'initial state' },
];

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    data: { label: 'Start Here' },
    position: { x: 250, y: 50 },
  },
];

const initialEdges: Edge[] = [];

const STORAGE_KEY = 'task-tracker-flowchart-data';

function FlowchartEditor({ onBack, onShowGoals, goalPlan, onCreateGoal, isDeveloperMode = false }: Props) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isApplyingHistoryRef = useRef(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Node editor state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorPosition, setEditorPosition] = useState<'left' | 'right'>('right');
  const [splitPercentage, setSplitPercentage] = useState(60); // Flowchart takes 60% initially
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showAddGoalMenu, setShowAddGoalMenu] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [newGoalLevel, setNewGoalLevel] = useState<GoalLevel | undefined>();
  const [newGoalParentId, setNewGoalParentId] = useState<string | undefined>();

  // History for undo/redo
  const {
    state: historyState,
    setState: setHistoryState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory({ nodes, edges });

  // Sync history state back to nodes/edges when undo/redo
  useEffect(() => {
    const nodesChanged = JSON.stringify(historyState.nodes) !== JSON.stringify(nodes);
    const edgesChanged = JSON.stringify(historyState.edges) !== JSON.stringify(edges);

    if ((nodesChanged || edgesChanged) && !isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = true;
      setNodes(historyState.nodes);
      setEdges(historyState.edges);
      // Reset flag after state updates
      setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 0);
    }
  }, [historyState, setNodes, setEdges]);

  // Update history when nodes or edges change (but not during history application)
  useEffect(() => {
    if (!isApplyingHistoryRef.current) {
      setHistoryState({ nodes, edges });
    }
  }, [nodes, edges, setHistoryState]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);
        setNodes(savedNodes || initialNodes);
        setEdges(savedEdges || initialEdges);
      } catch (error) {
        console.error('Error loading saved flowchart data:', error);
      }
    }
  }, [setNodes, setEdges]);

  // Auto-save on changes
  useEffect(() => {
    const data = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `${Date.now()}`,
      data: { label: nodeName || 'New Node' },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeName('');
  }, [nodeName, setNodes]);

  const saveToLocalStorage = useCallback(() => {
    const data = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [nodes, edges]);

  const loadArchitectureDiagram = useCallback(() => {
    setNodes(architectureNodes);
    setEdges(architectureEdges);
  }, [setNodes, setEdges]);

  const loadDeepArchitecture = useCallback(() => {
    setNodes(deepArchitectureNodes);
    setEdges(deepArchitectureEdges);
  }, [setNodes, setEdges]);

  const loadUnderTheHood = useCallback(() => {
    setNodes(underTheHoodNodes);
    setEdges(underTheHoodEdges);
  }, [setNodes, setEdges]);

  const loadTemplate = useCallback((templateName: 'project' | 'mindmap' | 'decision') => {
    let template;
    switch (templateName) {
      case 'project':
        template = projectPlanTemplate;
        break;
      case 'mindmap':
        template = mindMapTemplate;
        break;
      case 'decision':
        template = decisionTreeTemplate;
        break;
    }
    setNodes(template.nodes);
    setEdges(template.edges);
  }, [setNodes, setEdges]);

  const clearCanvas = useCallback(() => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [setNodes, setEdges]);

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matchingNodeIds: string[] = [];

    nodes.forEach((node) => {
      const nodeData = node.data as NodeData;
      const labelMatches = nodeData.label.toLowerCase().includes(lowerQuery);

      // Search in blocks content
      const blocksMatch = nodeData.blocks?.some((block) =>
        block.content.toLowerCase().includes(lowerQuery)
      );

      if (labelMatches || blocksMatch) {
        matchingNodeIds.push(node.id);
      }
    });

    setSearchResults(matchingNodeIds);
  }, [nodes]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Handle node click to open editor
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Close editor
  const closeEditor = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Toggle editor position
  const toggleEditorPosition = useCallback(() => {
    setEditorPosition(prev => prev === 'left' ? 'right' : 'left');
  }, []);

  // Update node content blocks
  const updateNodeBlocks = useCallback((nodeId: string, blocks: ContentBlock[]) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              blocks,
            } as NodeData,
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Update node label
  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label,
            } as NodeData,
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Handle wheel event with reduced sensitivity
  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      // Reduce zoom sensitivity by a factor of 3
      const scaledDelta = event.deltaY / 3;
      const newEvent = new WheelEvent('wheel', {
        ...event,
        deltaY: scaledDelta,
      });
      event.target?.dispatchEvent(newEvent);
    }
  }, []);

  // Attach wheel event listener
  useEffect(() => {
    const wrapper = reactFlowWrapper.current;
    if (wrapper) {
      wrapper.addEventListener('wheel', handleWheel as EventListener, { passive: false });
      return () => {
        wrapper.removeEventListener('wheel', handleWheel as EventListener);
      };
    }
  }, [handleWheel]);

  // Handle splitter drag
  const handleSplitterMouseDown = useCallback(() => {
    setIsDraggingSplitter(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSplitter) {
        const percentage = (e.clientX / window.innerWidth) * 100;
        setSplitPercentage(Math.min(Math.max(percentage, 20), 80));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
    };

    if (isDraggingSplitter) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter]);

  // Get selected node
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Apply search highlight styling to nodes
  const nodesWithSearchHighlight = nodes.map((node) => {
    const isSearchResult = searchResults.includes(node.id);
    return {
      ...node,
      className: isSearchResult ? 'search-highlight' : '',
    };
  });

  const exportAsImage = useCallback(async () => {
    if (reactFlowWrapper.current) {
      const canvas = await html2canvas(reactFlowWrapper.current, {
        backgroundColor: '#16213e',
      });
      const link = document.createElement('a');
      link.download = `flowchart-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }, []);

  const exportAsPDF = useCallback(async () => {
    if (reactFlowWrapper.current) {
      const canvas = await html2canvas(reactFlowWrapper.current, {
        backgroundColor: '#16213e',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`flowchart-${Date.now()}.pdf`);
    }
  }, []);

  const exportAsJSON = useCallback(() => {
    const flowchartData = {
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        appName: 'Flow Task Tracker',
      },
    };

    const jsonString = JSON.stringify(flowchartData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowchart-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const importFromJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonString = event.target?.result as string;
            const data = JSON.parse(jsonString);

            // Validate the imported data
            if (data.nodes && Array.isArray(data.nodes) && data.edges && Array.isArray(data.edges)) {
              setNodes(data.nodes);
              setEdges(data.edges);
              alert('Flowchart imported successfully!');
            } else {
              alert('Invalid flowchart file format. Please ensure the JSON contains nodes and edges arrays.');
            }
          } catch (error) {
            alert('Error parsing JSON file. Please ensure it is a valid flowchart export.');
            console.error('Import error:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setNodes, setEdges]);

  return (
    <div className="flowchart-editor">
      <div className="flowchart-header">
        <div className="flowchart-header-left">
          <button className="btn btn-back" onClick={onBack}>
            ← Back
          </button>
          <h1>Flowchart Notes</h1>
          {onShowGoals && (
            <button className="btn btn-secondary" onClick={onShowGoals}>
              🎯 Goals
            </button>
          )}
          {onCreateGoal && goalPlan && (
            <button className="btn btn-secondary" onClick={() => setShowAddGoalMenu(true)}>
              + Add Goal
            </button>
          )}
        </div>
        <div className="flowchart-controls-group">
          <div className="add-node-section">
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="Enter node name"
              onKeyDown={(e) => e.key === 'Enter' && addNode()}
              className="node-input"
            />
            <button onClick={addNode} className="btn btn-add-node">
              + Add Node
            </button>
          </div>
          <div className="search-section">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="🔍 Search nodes..."
              className="search-input"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="btn-clear-search" title="Clear search">
                ✕
              </button>
            )}
            {searchResults.length > 0 && (
              <span className="search-results-count">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flowchart-action-buttons">
            <div className="template-dropdown-container">
              <button
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className="btn btn-templates"
                title="Load Template"
              >
                📋 Templates
              </button>
              {showTemplateMenu && (
                <>
                  <div className="template-dropdown-overlay" onClick={() => setShowTemplateMenu(false)} />
                  <div className="template-dropdown-menu">
                    <button
                      onClick={() => {
                        loadTemplate('project');
                        setShowTemplateMenu(false);
                      }}
                      className="template-menu-item"
                    >
                      <span className="template-icon">🚀</span>
                      <div className="template-info">
                        <div className="template-name">Project Plan</div>
                        <div className="template-desc">Software development lifecycle</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        loadTemplate('mindmap');
                        setShowTemplateMenu(false);
                      }}
                      className="template-menu-item"
                    >
                      <span className="template-icon">🧠</span>
                      <div className="template-info">
                        <div className="template-name">Mind Map</div>
                        <div className="template-desc">Central idea with branches</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        loadTemplate('decision');
                        setShowTemplateMenu(false);
                      }}
                      className="template-menu-item"
                    >
                      <span className="template-icon">🌳</span>
                      <div className="template-info">
                        <div className="template-name">Decision Tree</div>
                        <div className="template-desc">Yes/No decision making flow</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
            {isDeveloperMode && (
              <>
                <button onClick={loadArchitectureDiagram} className="btn btn-architecture">
                  Components
                </button>
                <button onClick={loadDeepArchitecture} className="btn btn-deep">
                  Deep Tech
                </button>
                <button onClick={loadUnderTheHood} className="btn btn-hood">
                  Under the Hood
                </button>
              </>
            )}
            <button
              onClick={undo}
              className="btn btn-undo"
              disabled={!canUndo}
              title="Undo (Cmd/Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              onClick={redo}
              className="btn btn-redo"
              disabled={!canRedo}
              title="Redo (Cmd/Ctrl+Y)"
            >
              ↷ Redo
            </button>
            <button onClick={saveToLocalStorage} className="btn btn-save">
              {isSaved ? '✓ Saved!' : 'Save'}
            </button>
            <button onClick={exportAsImage} className="btn btn-export">
              PNG
            </button>
            <button onClick={exportAsPDF} className="btn btn-export">
              PDF
            </button>
            <button onClick={exportAsJSON} className="btn btn-export-json">
              📥 Export JSON
            </button>
            <button onClick={importFromJSON} className="btn btn-import-json">
              📤 Import JSON
            </button>
            <button onClick={clearCanvas} className="btn btn-clear">
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flowchart-split-container">
        {/* Editor Panel (Left) */}
        {selectedNode && editorPosition === 'left' && (
          <div style={{ width: `${100 - splitPercentage}%` }}>
            <NodeEditor
              nodeId={selectedNode.id}
              nodeLabel={String((selectedNode.data as NodeData).label)}
              content={(selectedNode.data as NodeData).blocks || []}
              onUpdateContent={updateNodeBlocks}
              onUpdateLabel={updateNodeLabel}
              onClose={closeEditor}
              onTogglePosition={toggleEditorPosition}
              position="left"
            />
          </div>
        )}

        {/* Resizable Splitter */}
        {selectedNode && (
          <div
            className="split-resizer"
            onMouseDown={handleSplitterMouseDown}
            style={{ cursor: isDraggingSplitter ? 'col-resize' : 'col-resize' }}
          />
        )}

        {/* Flowchart Canvas */}
        <div
          className="flowchart-canvas"
          ref={reactFlowWrapper}
          style={{
            width: selectedNode ? `${splitPercentage}%` : '100%',
          }}
        >
          <ReactFlow
            nodes={nodesWithSearchHighlight}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            panOnScroll={false}
            panOnDrag={true}
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#667eea" style={{ opacity: 0.3 }} />
            <Panel position="bottom-left" className="flowchart-instructions">
              <p><strong>Tips:</strong></p>
              <ul>
                <li>Click nodes to edit them</li>
                <li>Drag nodes to move them</li>
                <li>Connect nodes by dragging from handles</li>
                <li>Double-click edges to delete</li>
              </ul>
            </Panel>
          </ReactFlow>
        </div>

        {/* Editor Panel (Right) */}
        {selectedNode && editorPosition === 'right' && (
          <div style={{ width: `${100 - splitPercentage}%` }}>
            <NodeEditor
              nodeId={selectedNode.id}
              nodeLabel={String((selectedNode.data as NodeData).label)}
              content={(selectedNode.data as NodeData).blocks || []}
              onUpdateContent={updateNodeBlocks}
              onUpdateLabel={updateNodeLabel}
              onClose={closeEditor}
              onTogglePosition={toggleEditorPosition}
              position="right"
            />
          </div>
        )}
      </div>

      {/* Quick Add Goal Menu */}
      {showAddGoalMenu && onCreateGoal && goalPlan && (
        <QuickAddGoalMenu
          allGoals={goalPlan.goals}
          onSelect={(level, parentId) => {
            setNewGoalLevel(level);
            setNewGoalParentId(parentId);
            setShowAddGoalMenu(false);
            setShowGoalEditor(true);
          }}
          onCancel={() => setShowAddGoalMenu(false)}
        />
      )}

      {/* Goal Editor */}
      {showGoalEditor && onCreateGoal && (
        <Suspense fallback={<div className="loading">Loading editor...</div>}>
          <GoalEditor
            initialLevel={newGoalLevel}
            initialParentId={newGoalParentId}
            onSave={(goal) => {
              onCreateGoal(goal);
              setShowGoalEditor(false);
              setNewGoalLevel(undefined);
              setNewGoalParentId(undefined);
            }}
            onCancel={() => {
              setShowGoalEditor(false);
              setNewGoalLevel(undefined);
              setNewGoalParentId(undefined);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default memo(FlowchartEditor);
