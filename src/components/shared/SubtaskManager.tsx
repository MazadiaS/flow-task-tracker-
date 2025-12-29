import { useState } from 'react';
import type { Task } from '../../types';
import './SubtaskManager.css';

interface Props {
  parentTask: Task;
  currentDepth: number;
  maxDepth?: number;
  onAddSubtask: (parentId: string, subtask: Task) => void;
  onUpdateSubtask: (subtask: Task) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onToggleSubtask: (taskId: string) => void;
}

const MAX_DEPTH = 5;

function SubtaskManager({
  parentTask,
  currentDepth,
  maxDepth = MAX_DEPTH,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onToggleSubtask
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  const canAddMore = currentDepth < maxDepth;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSubtaskName.trim()) {
      return;
    }

    const now = Date.now();
    const newSubtask: Task = {
      id: `${parentTask.id}-${now}`,
      name: newSubtaskName,
      type: parentTask.type,
      icon: parentTask.icon,
      priority: parentTask.priority,
      importance: parentTask.importance,
      order: 0,
      target: parentTask.target,
      notes: '',
      parentId: parentTask.id,
      subtasks: [],
      sessions: parentTask.type === 'duration' ? [] : undefined,
      countLogs: parentTask.type === 'count' ? [] : undefined,
      completions: parentTask.type === 'completion' ? [] : undefined,
      media: [],
      isRecurring: false,
      createdAt: now
    };

    onAddSubtask(parentTask.id, newSubtask);
    setNewSubtaskName('');
    setShowAddForm(false);
  };

  const getDepthColor = (depth: number): string => {
    const colors = [
      'rgba(102, 126, 234, 0.3)',
      'rgba(118, 75, 162, 0.3)',
      'rgba(240, 147, 251, 0.3)',
      'rgba(245, 87, 108, 0.3)',
      'rgba(17, 153, 142, 0.3)'
    ];
    return colors[Math.min(depth, colors.length - 1)];
  };

  const toggleNotes = (subtaskId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(subtaskId)) {
      newExpanded.delete(subtaskId);
    } else {
      newExpanded.add(subtaskId);
    }
    setExpandedNotes(newExpanded);
  };

  const startEditingNotes = (subtask: Task) => {
    setEditingNotes(subtask.id);
    setNotesText(subtask.notes || '');
    setExpandedNotes(new Set([...expandedNotes, subtask.id]));
  };

  const saveNotes = (subtask: Task) => {
    onUpdateSubtask({ ...subtask, notes: notesText });
    setEditingNotes(null);
    setNotesText('');
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  return (
    <div
      className="subtask-manager"
      style={{
        borderLeftColor: getDepthColor(currentDepth),
        marginLeft: currentDepth > 0 ? '20px' : '0'
      }}
    >
      {parentTask.subtasks && parentTask.subtasks.length > 0 && (
        <div className="subtasks-list">
          <div className="subtasks-header" onClick={() => onToggleSubtask(parentTask.id)}>
            <span className="collapse-icon">
              {parentTask.isCollapsed ? '▶' : '▼'}
            </span>
            <span className="subtasks-count">
              {parentTask.subtasks.length} subtask{parentTask.subtasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {!parentTask.isCollapsed && parentTask.subtasks.map((subtask, index) => (
            <div key={subtask.id} className="subtask-item">
              <div className="subtask-content" style={{ borderLeftColor: getDepthColor(currentDepth) }}>
                <div className="subtask-main">
                  <span className="subtask-number">#{index + 1}</span>
                  <span className="subtask-icon">{subtask.icon || '📌'}</span>
                  <span className="subtask-name">{subtask.name}</span>
                  <button
                    className="btn-notes-toggle"
                    onClick={() => toggleNotes(subtask.id)}
                    title={expandedNotes.has(subtask.id) ? "Hide notes" : "Show notes"}
                  >
                    📝
                  </button>
                  <button
                    className="btn-delete-subtask"
                    onClick={() => onDeleteSubtask(subtask.id)}
                    title="Delete subtask"
                  >
                    ✕
                  </button>
                </div>

                {expandedNotes.has(subtask.id) && (
                  <div className="subtask-notes-section">
                    {editingNotes === subtask.id ? (
                      <div className="notes-edit-form">
                        <textarea
                          className="subtask-notes-textarea"
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Add notes for this subtask..."
                          autoFocus
                          spellCheck="true"
                        />
                        <div className="notes-actions">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => saveNotes(subtask)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={cancelEditingNotes}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="notes-display">
                        {subtask.notes ? (
                          <>
                            <div className="notes-text">{subtask.notes}</div>
                            <button
                              className="btn-edit-notes"
                              onClick={() => startEditingNotes(subtask)}
                            >
                              ✏️ Edit
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-add-notes"
                            onClick={() => startEditingNotes(subtask)}
                          >
                            + Add notes
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recursive subtask rendering */}
              {subtask.subtasks && subtask.subtasks.length > 0 && (
                <SubtaskManager
                  parentTask={subtask}
                  currentDepth={currentDepth + 1}
                  maxDepth={maxDepth}
                  onAddSubtask={onAddSubtask}
                  onUpdateSubtask={onUpdateSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onToggleSubtask={onToggleSubtask}
                />
              )}

              {/* Allow adding subtasks to this subtask if under max depth */}
              {currentDepth + 1 < maxDepth && (
                <SubtaskManager
                  parentTask={subtask}
                  currentDepth={currentDepth + 1}
                  maxDepth={maxDepth}
                  onAddSubtask={onAddSubtask}
                  onUpdateSubtask={onUpdateSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onToggleSubtask={onToggleSubtask}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div className="add-subtask-section">
          {!showAddForm ? (
            <button
              className="btn-add-subtask"
              onClick={() => setShowAddForm(true)}
            >
              + Add Subtask (Level {currentDepth + 1}/{maxDepth})
            </button>
          ) : (
            <form onSubmit={handleAddSubtask} className="add-subtask-form">
              <input
                type="text"
                placeholder="Enter subtask name..."
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                autoFocus
                spellCheck="true"
              />
              <div className="form-actions">
                <button type="submit" className="btn btn-sm btn-primary">
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSubtaskName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default SubtaskManager;
