# Architecture Refactoring - To-Do List

## ✅ COMPLETED

1. **Component Reorganization**
   - Created logical folder structure (/common, /modals, /views, /tasks, /session, /shared, /flowchart)
   - Moved all 22 root components into appropriate folders
   - Updated App.tsx imports

## 🔧 NEEDS IMMEDIATE FIX

2. **Import Path Updates** - TypeScript build is failing

   **Problem:** Components moved into subdirectories need "../" changed to "../../"

   **Files needing fixes (~20 files):**
   - `/modals/*` files need: `../types` → `../../types`
   - `/session/*` files need: `../types` → `../../types`
   - `/shared/*` files need: `../types` → `../../types`
   - `/tasks/*` files need: `../types` → `../../types`
   - `/views/*` files need: `../types` → `../../types`
   - `/common/*` files might need updates too
   - `main.tsx` needs: `'./components/ErrorBoundary.tsx'` → `'./components/common/ErrorBoundary'`

   **Also need to fix cross-component imports:**
   - TaskDetail.tsx imports SubtaskManager → `./SubtaskManager` → `../shared/SubtaskManager`
   - TaskDetail.tsx imports FullscreenTimer → `./FullscreenTimer` → `../shared/FullscreenTimer`
   - TaskDetail.tsx imports EstimatedTimeModal → `./EstimatedTimeModal` → `../modals/EstimatedTimeModal`
   - TaskList.tsx imports GoalRecommendations → `./GoalRecommendations` → `../Goals/GoalRecommendations`
   - TaskList.tsx imports DeveloperModeModal → `./DeveloperModeModal` → `../modals/DeveloperModeModal`
   - DaySession.tsx imports EndDayModal → `./EndDayModal` → `../modals/EndDayModal`

   **Quick command to help identify:**
   ```bash
   # Find all imports that need fixing
   grep -r "import.*from '\.\./types'" src/components/modals/ src/components/session/ src/components/shared/ src/components/tasks/ src/components/views/
   ```

## ⏸️ PENDING (Do AFTER fixing imports)

3. **Phase 1: Wire Up AppContext**
   - Update main.tsx to wrap App with AppProvider
   - Add missing handlers to AppContext.tsx
   - Refactor App.tsx to use useAppContext
   - Delete duplicate code from App.tsx
   - Test everything

4. **Phase 2: Split FlowchartEditor**
   - Extract toolbar → FlowchartToolbar.tsx
   - Extract canvas → FlowchartCanvas.tsx
   - Extract templates → FlowchartTemplates.tsx

5. **Phase 3: Create BaseFlowGraph**
   - Create shared/BaseFlowGraph.tsx
   - Migrate FlowchartEditor to use it
   - Migrate GoalFlowGraph to use it

6. **Phase 4: Final Testing & Build**
   - Run full test suite
   - Build for production
   - Update documentation

## 📝 NOTES

- Phase 0 (reorganization) is 100% done
- Build is currently BROKEN due to import paths
- Fix imports first before continuing to Phase 1
- All architectural planning is complete (see ARCHITECTURE_ANALYSIS.md and REFACTORING_GUIDE.md)

## 🚀 NEXT ACTION

**Fix all import paths** - Run search/replace:
- In `/modals/*.tsx`: `from '../` → `from '../../`
- In `/session/*.tsx`: `from '../` → `from '../../`
- In `/shared/*.tsx`: `from '../` → `from '../../`
- In `/tasks/*.tsx`: `from '../` → `from '../../`
- In `/views/*.tsx`: `from '../` → `from '../../`
- Fix cross-component imports manually

Then run `npm run build` to verify.
