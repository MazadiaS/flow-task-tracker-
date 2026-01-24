import { useState, useRef, useCallback, useEffect } from 'react';
import './RichTextInput.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  'data-block-id'?: string;
  autoFocus?: boolean;
}

export interface FormatRange {
  type: 'bold' | 'italic' | 'code' | 'strikethrough' | 'highlight';
  start: number;
  end: number;
}

function RichTextInput({ value, onChange, placeholder, className, onKeyDown, 'data-block-id': blockId, autoFocus }: Props) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0 && contentRef.current) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setToolbarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowToolbar(true);

      // Calculate selection indices in the text
      const preRange = range.cloneRange();
      preRange.selectNodeContents(contentRef.current);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;
      const end = start + selection.toString().length;

      setSelectionRange({ start, end });
    } else {
      setShowToolbar(false);
      setSelectionRange(null);
    }
  }, []);

  // Apply formatting
  const applyFormat = useCallback((format: 'bold' | 'italic' | 'code' | 'strikethrough' | 'highlight') => {
    if (!selectionRange) return;

    const { start, end } = selectionRange;
    const selectedText = value.slice(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'highlight':
        formattedText = `==${selectedText}==`;
        break;
    }

    const newValue = value.slice(0, start) + formattedText + value.slice(end);
    onChange(newValue);
    setShowToolbar(false);
    setSelectionRange(null);
  }, [value, onChange, selectionRange]);

  // Handle keyboard shortcuts
  const handleKeyDown_ = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0 && contentRef.current) {
        const range = selection.getRangeAt(0);
        const preRange = range.cloneRange();
        preRange.selectNodeContents(contentRef.current);
        preRange.setEnd(range.startContainer, range.startOffset);
        const start = preRange.toString().length;
        const end = start + selection.toString().length;

        setSelectionRange({ start, end });

        if (e.key === 'b') {
          e.preventDefault();
          applyFormat('bold');
          return;
        } else if (e.key === 'i') {
          e.preventDefault();
          applyFormat('italic');
          return;
        } else if (e.key === 'e') {
          e.preventDefault();
          applyFormat('code');
          return;
        }
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [onKeyDown, applyFormat]);

  // Handle content changes
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newValue = e.currentTarget.textContent || '';
    onChange(newValue);
  }, [onChange]);

  // Auto-focus if needed
  useEffect(() => {
    if (autoFocus && contentRef.current) {
      contentRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [autoFocus]);

  // Sync the contentEditable with value prop (only when value changes externally)
  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== value) {
      contentRef.current.textContent = value;
    }
  }, [value]);

  return (
    <>
      <div
        ref={contentRef}
        className={`rich-text-input ${className || ''}`}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown_}
        onMouseUp={handleMouseUp}
        data-block-id={blockId}
        data-placeholder={placeholder}
      />

      {showToolbar && (
        <>
          <div className="format-toolbar-overlay" onClick={() => setShowToolbar(false)} />
          <div
            className="format-toolbar"
            style={{
              position: 'fixed',
              left: `${toolbarPosition.x}px`,
              top: `${toolbarPosition.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <button
              className="format-btn"
              onClick={() => applyFormat('bold')}
              title="Bold (Cmd/Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              className="format-btn"
              onClick={() => applyFormat('italic')}
              title="Italic (Cmd/Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              className="format-btn"
              onClick={() => applyFormat('code')}
              title="Code (Cmd/Ctrl+E)"
            >
              &lt;/&gt;
            </button>
            <button
              className="format-btn"
              onClick={() => applyFormat('strikethrough')}
              title="Strikethrough"
            >
              <s>S</s>
            </button>
            <button
              className="format-btn format-highlight"
              onClick={() => applyFormat('highlight')}
              title="Highlight"
            >
              H
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default RichTextInput;
