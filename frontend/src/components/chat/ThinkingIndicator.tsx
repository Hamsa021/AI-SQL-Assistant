import { Bot } from 'lucide-react';

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-secondary)] border border-[var(--surface-border)]">
        <Bot size={14} className="text-[var(--text-secondary)]" />
      </div>
      <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-[var(--chat-ai-bg)] border border-[var(--surface-border)]">
        <div className="flex items-center gap-1.5">
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>
      </div>
    </div>
  );
}
