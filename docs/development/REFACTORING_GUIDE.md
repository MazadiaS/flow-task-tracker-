# Refactoring Implementation Guide

**Status:** Phase 1 Partially Complete
**Date:** 2025-12-29

---

## ✅ Phase 0: Quick Wins (COMPLETED)

All component folders have been reorganized:
- ✓ `/common` - ErrorBoundary, Footer, KeyboardShortcutsHelp, WelcomeScreen
- ✓ `/modals` - All *Modal.tsx files
- ✓ `/views` - Archive, BackupSettings, Statistics, TimelineView
- ✓ `/tasks` - TaskDetail, TaskList, HomeworkResourceManager
- ✓ `/session` - DaySession
- ✓ `/shared` - FullscreenTimer, SubtaskManager
- ✓ `/flowchart` - FlowchartEditor and subdirectory
- ✓ `/Goals` - All goal-related components (was already organized)
- ✓ App.tsx imports updated

---

## 🚧 Phase 1: Wire Up AppContext (IN PROGRESS)

### Current Situation

**AppContext.tsx exists with:**
- Complete state management
- All task CRUD handlers
- All goal CRUD handlers
- Debounced localStorage saves
- useAppContext hook

**App.tsx (611 lines) duplicates everything:**
- Manages state directly with useState
- Defines all handlers again
- Passes everything via props (props drilling)

### Step-by-Step Implementation

#### Step 1: Wrap App with AppProvider in main.tsx

**File:** `src/main.tsx`

```tsx
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <App />
  </AppProvider>
);
```

**Why:** This makes the context available to the entire app.

---

#### Step 2: Refactor App.tsx to Use Context

**Current App.tsx structure (611 lines):**
```tsx
function App() {
  const [state, setState] = useState<AppState>(getInitialState());
  const [currentView, setCurrentView] = useState(...);
  const [selectedTaskId, setSelectedTaskId] = useState(...);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(...);

  // 17 handler functions (handleAddTask, handleUpdateTask, etc.)
  const handleAddTask = useCallback((task: Task) => { ... }, []);
  const handleUpdateTask = useCallback((updatedTask: Task) => { ... }, []);
  // ... 15 more handlers

  // All the JSX rendering
}
```

**New App.tsx structure (~200 lines):**
```tsx
function App() {
  // Get state and handlers from context (no more duplication!)
  const {
    state,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    handleReorderTasks,
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleCreateGoalPlan,
  } = useAppContext();

  // Only local UI state (view navigation, modals)
  const [currentView, setCurrentView] = useState<'start' | 'list' | ...>('start');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(...);

  const isDeveloperMode = sessionStorage.getItem('developer-mode') === 'true';

  // View navigation helpers (still needed in App)
  const handleShowDetail = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentView('detail');
  }, []);

  const handleShowStats = useCallback(() => setCurrentView('stats'), []);
  const handleShowTimeline = useCallback(() => setCurrentView('timeline'), []);
  const handleShowFlowchart = useCallback(() => setCurrentView('flowchart'), []);
  const handleShowBackup = useCallback(() => setCurrentView('backup'), []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      meta: true,
      handler: () => setShowAddTaskModal(true),
      description: 'Add new task'
    },
    // ... other shortcuts
  ]);

  // All the JSX rendering (unchanged)
}
```

**Benefits:**
- ✅ App.tsx reduced from 611 → ~200 lines
- ✅ No duplicate handler logic
- ✅ Single source of truth for state
- ✅ App only handles UI/navigation, not business logic

---

#### Step 3: Update AppContext to Include Missing Handlers

**Problem:** AppContext has task/goal handlers but App.tsx has additional handlers like:
- handleStartDay
- handleEndDay
- handleDeleteGoalPlan
- etc.

**Solution:** Add these to AppContext.tsx

Example additions needed:

```tsx
// In AppContext.tsx interface
interface AppContextType {
  // ... existing
  handleStartDay: (date: string) => void;
  handleEndDay: () => void;
  handleDeleteGoalPlan: (planId: string) => void;
}

// In AppProvider implementation
const handleStartDay = useCallback((date: string) => {
  setState(prevState => ({
    ...prevState,
    currentDay: {
      ...prevState.currentDay,
      isActive: true,
      date: date,
    }
  }));
}, []);

const handleEndDay = useCallback(() => {
  setState(prevState => {
    const dayArchive: DayArchive = {
      date: prevState.currentDay.date,
      tasks: prevState.currentDay.tasks,
      totalFocusTime: prevState.currentDay.totalFocusTime || 0,
    };

    return {
      ...prevState,
      currentDay: {
        isActive: false,
        date: '',
        tasks: [],
        totalFocusTime: 0,
      },
      archive: [...prevState.archive, dayArchive]
    };
  });
}, []);

const handleDeleteGoalPlan = useCallback((planId: string) => {
  setState(prevState => ({
    ...prevState,
    activeGoalPlan: prevState.activeGoalPlan?.id === planId ? undefined : prevState.activeGoalPlan,
    goalPlanIndex: prevState.goalPlanIndex.filter(p => p.id !== planId)
  }));
  deleteGoalPlan(planId);
  removeFromGoalPlanIndex(planId);
}, []);
```

---

#### Step 4: Remove Duplicate Handlers from App.tsx

After wiring up context, delete these from App.tsx:
- `const handleAddTask = useCallback(...)` ❌ DELETE
- `const handleUpdateTask = useCallback(...)` ❌ DELETE
- `const handleDeleteTask = useCallback(...)` ❌ DELETE
- `const handleReorderTasks = useCallback(...)` ❌ DELETE
- `const handleCreateGoal = useCallback(...)` ❌ DELETE
- `const handleUpdateGoal = useCallback(...)` ❌ DELETE
- `const handleDeleteGoal = useCallback(...)` ❌ DELETE
- `const handleCreateGoalPlan = useCallback(...)` ❌ DELETE

**Keep only:**
- View navigation handlers (handleShowDetail, handleShowStats, etc.)
- Modal state handlers (setShowAddTaskModal, etc.)
- Local UI state

---

#### Step 5: Remove State Management from App.tsx

**Delete:**
```tsx
const [state, setState] = useState<AppState>(getInitialState()); ❌ DELETE

const debouncedSaveState = useMemo(
  () => debounce(saveState, 500),
  []
); ❌ DELETE

useEffect(() => {
  debouncedSaveState(state);
  triggerAutoSync();
}, [state, debouncedSaveState]); ❌ DELETE

useEffect(() => {
  initAutoSync();
  requestNotificationPermission().catch(console.error);
}, []); ❌ DELETE
```

**Why:** AppContext handles all of this now.

---

#### Step 6: Test Everything

After making changes, test:
- [ ] Add a task
- [ ] Edit a task
- [ ] Delete a task
- [ ] Reorder tasks
- [ ] Create a goal
- [ ] Edit a goal
- [ ] Delete a goal
- [ ] Start/end day
- [ ] Navigate between views
- [ ] Data persists in localStorage
- [ ] Auto-sync works

---

## ⚠️ Migration Risks

### High Risk Areas:
1. **localStorage save timing** - Make sure debounce still works
2. **Goal plan lifecycle** - Creating/deleting plans is complex
3. **Task reordering** - Drag & drop state management
4. **Day session** - Start/end day logic

### Testing Checklist:
- [ ] All CRUD operations work
- [ ] No console errors
- [ ] Data persists correctly
- [ ] UI updates reactively
- [ ] Navigation still works
- [ ] Modals open/close properly

---

## 📝 Phase 2: Split FlowchartEditor (PENDING)

**Goal:** Reduce FlowchartEditor.tsx from 1,203 lines → 4 files of ~300 lines each

### Files to Create:

1. **flowchart/FlowchartEditor.tsx** (~300 lines)
   - Main component
   - Orchestrates everything
   - Manages local state

2. **flowchart/FlowchartToolbar.tsx** (~250 lines)
   - Add node controls
   - Search bar
   - Template dropdown
   - Export/import buttons

3. **flowchart/FlowchartCanvas.tsx** (~350 lines)
   - React Flow setup
   - Node rendering
   - Edge handling
   - Pan/zoom controls

4. **flowchart/templates/FlowchartTemplates.tsx** (~300 lines)
   - All template definitions
   - Template loading logic

### Implementation Steps:

1. Create new files with basic structure
2. Extract toolbar JSX → FlowchartToolbar
3. Extract canvas JSX → FlowchartCanvas
4. Extract templates → FlowchartTemplates
5. Update imports
6. Test all flowchart features

---

## 📝 Phase 3: Create BaseFlowGraph (PENDING)

**Goal:** Eliminate ~500 lines of duplicate code between FlowchartEditor and GoalFlowGraph

### Shared Functionality:
- React Flow setup
- Zoom/pan controls
- Node positioning
- Edge rendering
- Export functionality
- Layout algorithms

### Implementation:

Create `src/components/shared/BaseFlowGraph.tsx`:

```tsx
interface BaseFlowGraphProps<T> {
  nodes: Node<T>[];
  edges: Edge[];
  onNodeClick?: (node: Node<T>) => void;
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  renderNode: (data: T) => ReactNode;
  renderControls?: () => ReactNode;
}

export function BaseFlowGraph<T extends Record<string, unknown>>({
  nodes,
  edges,
  onNodeClick,
  onNodesChange,
  onEdgesChange,
  renderNode,
  renderControls,
}: BaseFlowGraphProps<T>) {
  // Shared React Flow logic
  // - Minimap
  // - Controls
  // - Background
  // - Node types
  // - Edge types

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
    >
      <Background />
      <Controls />
      <MiniMap />
      {renderControls?.()}
    </ReactFlow>
  );
}
```

**Usage in FlowchartEditor:**
```tsx
<BaseFlowGraph
  nodes={nodes}
  edges={edges}
  renderNode={(data) => <FlowchartNode {...data} />}
  onNodesChange={handleNodesChange}
/>
```

**Usage in GoalFlowGraph:**
```tsx
<BaseFlowGraph
  nodes={goalNodes}
  edges={goalEdges}
  renderNode={(data) => <GoalNode goal={data.goal} />}
  onNodesChange={handleNodesChange}
/>
```

---

## 📝 Phase 4: Final Cleanup (PENDING)

1. Delete any remaining backup files
2. Run full test suite
3. Update documentation
4. Run build and verify production bundle
5. Performance audit
6. Update README with new architecture

---

## 📊 Progress Tracker

| Phase | Status | Lines Saved | Complexity Reduced |
|-------|--------|-------------|-------------------|
| Phase 0: Reorganization | ✅ Complete | N/A | High (discoverability) |
| Phase 1: AppContext | 🚧 50% | ~400 lines | Very High |
| Phase 2: Split FlowchartEditor | ⏸️ Pending | ~300 lines | High |
| Phase 3: BaseFlowGraph | ⏸️ Pending | ~500 lines | Medium |
| Phase 4: Cleanup | ⏸️ Pending | ~100 lines | Low |
| **TOTAL** | **30%** | **~1,300 lines** | **Very High** |

---

## 🎯 Next Immediate Action

**Priority 1:** Complete Phase 1 - Wire up AppContext

**Steps:**
1. Update `src/main.tsx` to wrap App with AppProvider
2. Add missing handlers to AppContext.tsx
3. Refactor App.tsx to use useAppContext
4. Delete duplicate handlers from App.tsx
5. Delete duplicate state management from App.tsx
6. Test everything thoroughly

**Estimated Time:** 4-6 hours
**Risk Level:** Medium (lots of testing needed)
**Impact:** Very High (reduces App.tsx from 611 → ~200 lines)

---

**Document Maintained By:** Claude Code
**Last Updated:** 2025-12-29
