import { useState, useCallback, useRef, useEffect } from 'react';
import RichTextInput from './RichTextInput';
import './NodeEditor.css';

export interface ContentBlock {
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

interface Props {
  nodeId: string;
  nodeLabel: string;
  content: ContentBlock[];
  onUpdateContent: (nodeId: string, content: ContentBlock[]) => void;
  onUpdateLabel?: (nodeId: string, label: string) => void;
  onClose: () => void;
  onTogglePosition: () => void;
  position: 'left' | 'right';
}

function NodeEditor({ nodeId, nodeLabel, content, onUpdateContent, onUpdateLabel, onClose, onTogglePosition, position }: Props) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    content.length > 0 ? content : [{ id: Date.now().toString(), type: 'text', content: '' }]
  );
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(nodeLabel);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Update parent when blocks change
  useEffect(() => {
    onUpdateContent(nodeId, blocks);
  }, [blocks, nodeId, onUpdateContent]);

  const updateBlock = useCallback((blockId: string, updates: Partial<ContentBlock>) => {
    setBlocks(prev =>
      prev.map(block => (block.id === blockId ? { ...block, ...updates } : block))
    );
  }, []);

  const addBlock = useCallback((afterBlockId: string, type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      metadata: type === 'checkbox' ? { checked: false } : type === 'table' ? { rows: [['', ''], ['', '']] } : undefined,
    };

    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === afterBlockId);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });

    setShowSlashMenu(false);
    setActiveBlockId(newBlock.id);
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      if (prev.length === 1) return prev; // Keep at least one block
      return prev.filter(b => b.id !== blockId);
    });
  }, []);

  // Block reordering handlers
  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    setDragOverBlockId(blockId);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!draggedBlockId || !dragOverBlockId || draggedBlockId === dragOverBlockId) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    setBlocks(prev => {
      const draggedIndex = prev.findIndex(b => b.id === draggedBlockId);
      const targetIndex = prev.findIndex(b => b.id === dragOverBlockId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newBlocks = [...prev];
      const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(targetIndex, 0, draggedBlock);

      return newBlocks;
    });

    setDraggedBlockId(null);
    setDragOverBlockId(null);
  }, [draggedBlockId, dragOverBlockId]);

  const moveBlockUp = useCallback((blockId: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index <= 0) return prev;

      const newBlocks = [...prev];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      return newBlocks;
    });
  }, []);

  const moveBlockDown = useCallback((blockId: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index === -1 || index >= prev.length - 1) return prev;

      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      return newBlocks;
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string, blockIndex: number) => {
    const block = blocks[blockIndex];

    // Handle slash command
    if (e.key === '/' && block.content === '') {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      setSlashMenuPosition({ x: rect.left, y: rect.bottom });
      setShowSlashMenu(true);
      setActiveBlockId(blockId);
      return;
    }

    // Enter key - create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlock: ContentBlock = {
        id: Date.now().toString(),
        type: 'text',
        content: '',
      };

      setBlocks(prev => {
        const newBlocks = [...prev];
        newBlocks.splice(blockIndex + 1, 0, newBlock);
        return newBlocks;
      });

      // Focus new block after render
      setTimeout(() => {
        const nextInput = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
        nextInput?.focus();
      }, 0);
    }

    // Backspace on empty block - delete it
    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(blockId);

      // Focus previous block
      if (blockIndex > 0) {
        setTimeout(() => {
          const prevBlock = blocks[blockIndex - 1];
          const prevInput = document.querySelector(`[data-block-id="${prevBlock.id}"]`) as HTMLElement;
          prevInput?.focus();
        }, 0);
      }
    }
  }, [blocks, deleteBlock]);

  const slashMenuItems = [
    { type: 'text' as const, label: 'Text', icon: '📝', description: 'Plain text' },
    { type: 'heading1' as const, label: 'Heading 1', icon: 'H1', description: 'Large heading' },
    { type: 'heading2' as const, label: 'Heading 2', icon: 'H2', description: 'Medium heading' },
    { type: 'heading3' as const, label: 'Heading 3', icon: 'H3', description: 'Small heading' },
    { type: 'bulletList' as const, label: 'Bullet List', icon: '•', description: 'Bulleted list' },
    { type: 'numberedList' as const, label: 'Numbered List', icon: '1.', description: 'Numbered list' },
    { type: 'checkbox' as const, label: 'Checkbox', icon: '☑', description: 'To-do list' },
    { type: 'code' as const, label: 'Code', icon: '</>', description: 'Code block' },
    { type: 'quote' as const, label: 'Quote', icon: '"', description: 'Quote block' },
    { type: 'divider' as const, label: 'Divider', icon: '—', description: 'Horizontal line' },
    { type: 'table' as const, label: 'Table', icon: '⊞', description: 'Simple table' },
    { type: 'image' as const, label: 'Image', icon: '🖼', description: 'Upload or embed' },
    { type: 'link' as const, label: 'Link', icon: '🔗', description: 'External link' },
  ];

  const renderBlock = (block: ContentBlock, index: number) => {
    const commonProps = {
      'data-block-id': block.id,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id, index),
      className: 'block-input',
    };

    switch (block.type) {
      case 'heading1':
        return (
          <RichTextInput
            {...commonProps}
            value={block.content}
            onChange={(value) => updateBlock(block.id, { content: value })}
            placeholder="Heading 1"
            className="heading-1"
          />
        );

      case 'heading2':
        return (
          <RichTextInput
            {...commonProps}
            value={block.content}
            onChange={(value) => updateBlock(block.id, { content: value })}
            placeholder="Heading 2"
            className="heading-2"
          />
        );

      case 'heading3':
        return (
          <RichTextInput
            {...commonProps}
            value={block.content}
            onChange={(value) => updateBlock(block.id, { content: value })}
            placeholder="Heading 3"
            className="heading-3"
          />
        );

      case 'bulletList':
        return (
          <div className="list-item">
            <span className="list-marker">•</span>
            <RichTextInput
              {...commonProps}
              value={block.content}
              onChange={(value) => updateBlock(block.id, { content: value })}
              placeholder="List item"
              className="block-input"
            />
          </div>
        );

      case 'numberedList':
        return (
          <div className="list-item">
            <span className="list-marker">{index + 1}.</span>
            <RichTextInput
              {...commonProps}
              value={block.content}
              onChange={(value) => updateBlock(block.id, { content: value })}
              placeholder="List item"
              className="block-input"
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="checkbox-item">
            <input
              type="checkbox"
              checked={block.metadata?.checked || false}
              onChange={(e) =>
                updateBlock(block.id, {
                  metadata: { ...block.metadata, checked: e.target.checked },
                })
              }
              className="checkbox-input"
            />
            <RichTextInput
              {...commonProps}
              value={block.content}
              onChange={(value) => updateBlock(block.id, { content: value })}
              placeholder="To-do"
              className="checkbox-text"
            />
          </div>
        );

      case 'code':
        return (
          <textarea
            {...commonProps}
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="// Code here..."
            className="block-input code-block"
            rows={5}
          />
        );

      case 'quote':
        return (
          <div className="quote-block">
            <div className="quote-marker">│</div>
            <textarea
              {...commonProps}
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Quote..."
              className="block-input quote-text"
              rows={3}
            />
          </div>
        );

      case 'divider':
        return <hr className="divider-block" />;

      case 'table':
        return (
          <div className="table-block">
            <table>
              <tbody>
                {(block.metadata?.rows || [['', '']]).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const newRows = [...(block.metadata?.rows || [])];
                            newRows[rowIndex][cellIndex] = e.target.value;
                            updateBlock(block.id, {
                              metadata: { ...block.metadata, rows: newRows },
                            });
                          }}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'image':
        return (
          <div className="image-block">
            <div
              className="image-upload-zone"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      updateBlock(block.id, { content: event.target.result as string });
                    }
                  };
                  reader.readAsDataURL(files[0]);
                }
              }}
            >
              <input
                {...commonProps}
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Image URL or drag & drop image..."
                className="block-input"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        updateBlock(block.id, { content: event.target.result as string });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="image-file-input"
                id={`image-input-${block.id}`}
              />
              <label htmlFor={`image-input-${block.id}`} className="image-upload-label">
                📁 Choose File
              </label>
            </div>
            {block.content && (
              <img src={block.content} alt="Content" className="block-image" />
            )}
          </div>
        );

      case 'link':
        return (
          <div className="link-block">
            <input
              {...commonProps}
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="https://example.com"
              className="block-input"
            />
            {block.content && (
              <a href={block.content} target="_blank" rel="noopener noreferrer" className="block-link">
                🔗 {block.content}
              </a>
            )}
          </div>
        );

      default:
        return (
          <RichTextInput
            {...commonProps}
            value={block.content}
            onChange={(value) => updateBlock(block.id, { content: value })}
            placeholder="Type '/' for commands, or start writing..."
            className="text-block"
          />
        );
    }
  };

  // Handle label editing
  const handleLabelClick = () => {
    setIsEditingLabel(true);
    setTimeout(() => labelInputRef.current?.focus(), 0);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedLabel(e.target.value);
  };

  const handleLabelBlur = () => {
    if (editedLabel.trim() && editedLabel !== nodeLabel && onUpdateLabel) {
      onUpdateLabel(nodeId, editedLabel.trim());
    } else {
      setEditedLabel(nodeLabel);
    }
    setIsEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelBlur();
    } else if (e.key === 'Escape') {
      setEditedLabel(nodeLabel);
      setIsEditingLabel(false);
    }
  };

  // Update edited label when nodeLabel prop changes
  useEffect(() => {
    setEditedLabel(nodeLabel);
  }, [nodeLabel]);

  return (
    <div className="node-editor-panel">
      <div className="editor-header">
        {isEditingLabel ? (
          <input
            ref={labelInputRef}
            type="text"
            className="node-label-input"
            value={editedLabel}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
          />
        ) : (
          <h2 onClick={handleLabelClick} style={{ cursor: 'pointer' }} title="Click to edit">
            📝 {nodeLabel}
          </h2>
        )}
        <div className="editor-controls">
          <button className="btn-icon" onClick={onTogglePosition} title={`Move to ${position === 'left' ? 'right' : 'left'}`}>
            ↔️
          </button>
          <button className="btn-icon" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      <div className="editor-body" ref={editorRef}>
        <div className="blocks-container">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className={`block-wrapper ${draggedBlockId === block.id ? 'dragging' : ''} ${dragOverBlockId === block.id ? 'drag-over' : ''}`}
              draggable
              onDragStart={() => handleDragStart(block.id)}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="block-drag-handle" title="Drag to reorder">
                ⋮⋮
              </div>
              <div className="block-actions">
                <button
                  className="block-action-btn block-move-up"
                  onClick={() => moveBlockUp(block.id)}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="block-action-btn block-move-down"
                  onClick={() => moveBlockDown(block.id)}
                  disabled={index === blocks.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className={`block-action-btn block-comment ${block.metadata?.comment ? 'has-comment' : ''}`}
                  onClick={() => updateBlock(block.id, {
                    metadata: {
                      ...block.metadata,
                      showComment: !block.metadata?.showComment,
                    },
                  })}
                  title={block.metadata?.comment ? 'View/Edit comment' : 'Add comment'}
                >
                  💬
                </button>
                <button
                  className="block-action-btn block-delete"
                  onClick={() => deleteBlock(block.id)}
                  title="Delete block"
                >
                  🗑️
                </button>
              </div>
              <div className="block-content-wrapper">
                {renderBlock(block, index)}
                {block.metadata?.showComment && (
                  <div className="block-comment-section">
                    <textarea
                      value={block.metadata?.comment || ''}
                      onChange={(e) => updateBlock(block.id, {
                        metadata: {
                          ...block.metadata,
                          comment: e.target.value,
                        },
                      })}
                      placeholder="Add a note or comment about this block..."
                      className="block-comment-input"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          className="add-block-btn"
          onClick={() => addBlock(blocks[blocks.length - 1].id, 'text')}
        >
          + Add Block
        </button>
      </div>

      {/* Slash Menu */}
      {showSlashMenu && activeBlockId && (
        <div
          className="slash-menu"
          style={{
            position: 'fixed',
            top: slashMenuPosition.y,
            left: slashMenuPosition.x,
          }}
        >
          {slashMenuItems.map((item) => (
            <button
              key={item.type}
              className="slash-menu-item"
              onClick={() => {
                const blockIndex = blocks.findIndex(b => b.id === activeBlockId);
                if (blockIndex !== -1) {
                  updateBlock(activeBlockId, { type: item.type, content: '' });
                }
                setShowSlashMenu(false);
              }}
            >
              <span className="slash-menu-icon">{item.icon}</span>
              <div className="slash-menu-text">
                <div className="slash-menu-label">{item.label}</div>
                <div className="slash-menu-description">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close slash menu */}
      {showSlashMenu && (
        <div
          className="slash-menu-overlay"
          onClick={() => setShowSlashMenu(false)}
        />
      )}
    </div>
  );
}

export default NodeEditor;
