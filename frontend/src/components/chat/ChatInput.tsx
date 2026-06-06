import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (question: string) => void;
  isLoading: boolean;
}

const EXAMPLE_QUESTIONS = [
  'Show me the top 10 customers by revenue',
  'What are the monthly sales trends for this year?',
  'List products with inventory below reorder level',
  'Which employees have the most orders?',
];

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const q = value.trim();
    if (!q || isLoading) return;
    onSend(q);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  return (
    <div className="p-4 border-t border-[var(--surface-border)] bg-[var(--surface)]">
      {/* Example questions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {EXAMPLE_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => { setValue(q); textareaRef.current?.focus(); }}
            className="text-xs px-2.5 py-1 rounded-full border border-[var(--surface-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] hover:bg-[var(--brand-muted)] transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-3 items-end bg-[var(--surface-secondary)] rounded-xl border border-[var(--surface-border)] focus-within:border-[var(--brand)] focus-within:ring-1 focus-within:ring-[var(--brand)] transition-all px-4 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); handleInput(); }}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your data... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none leading-relaxed disabled:opacity-50"
          style={{ minHeight: '24px', maxHeight: '160px' }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />
          }
        </button>
      </div>

      <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
        Read-only database access · Dangerous operations blocked
      </p>
    </div>
  );
}
