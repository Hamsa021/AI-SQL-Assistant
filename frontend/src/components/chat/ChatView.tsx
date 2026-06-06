import { useRef, useEffect } from 'react';
import { Database } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { runQuery } from '../../utils/api';
import { MessageBubble } from '../chat/MessageBubble';
import { ThinkingIndicator } from '../chat/ThinkingIndicator';
import { ChatInput } from '../chat/ChatInput';
import type { Message } from '../../types';

export function ChatView() {
  const { messages, addMessage, isLoading, setLoading, modelProvider, sessionId } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (question: string) => {
    if (isLoading) return;

    // Add user message
    addMessage({ role: 'user', content: question });
    setLoading(true);

    // Build conversation history from existing messages
    const history: Message[] = messages
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: question });

    try {
      const response = await runQuery(question, modelProvider, history, sessionId);

      addMessage({
        role: 'assistant',
        content: response.explanation || 'Here are the results:',
        queryResponse: response,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

      addMessage({
        role: 'assistant',
        content: 'I encountered an error processing your query.',
        error: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand-muted)] border border-[var(--brand)] flex items-center justify-center">
        <Database size={28} className="text-[var(--brand)]" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Ask about your data</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
          Type a question in plain English and the AI will write the SQL, run it, explain it, and chart the results for you.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)] max-w-sm">
        {[
          '✦ Auto-generates SQL',
          '✦ Explains results',
          '✦ Auto-charts data',
          '✦ Follow-up questions',
          '✦ Self-correcting AI',
          '✦ Read-only & safe',
        ].map(f => (
          <span key={f} className="text-left">{f}</span>
        ))}
      </div>
    </div>
  );
}
