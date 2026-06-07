import { useRef, useEffect } from 'react';
import { Database } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { runQueryStream } from '../../utils/api';
import { MessageBubble } from '../chat/MessageBubble';
import { ThinkingIndicator } from '../chat/ThinkingIndicator';
import { ChatInput } from '../chat/ChatInput';
import type { Message, QueryResponse, ChartRecommendation } from '../../types';

const SUGGESTED_QUESTIONS = [
  'Show top 10 customers by total revenue',
  'What are sales by product category?',
  'Which products have fewer than 10 units in stock?',
  'Show order count and total value by status',
];

export function ChatView() {
  const { messages, addMessage, updateLastMessage, isLoading, setLoading, modelProvider, sessionId } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (question: string) => {
    if (isLoading) return;

    addMessage({ role: 'user', content: question });
    setLoading(true);

    const history: Message[] = messages
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: question });

    // Placeholder message updated progressively via SSE events
    addMessage({ role: 'assistant', content: 'Generating SQL...' });

    let partial: {
      sql?: string;
      explanation?: string;
      columns?: string[];
      rows?: (string | number | boolean | null)[][];
      row_count?: number;
      chart_recommendation?: ChartRecommendation;
      execution_time_ms?: number;
    } = {};

    try {
      await runQueryStream(question, modelProvider, history, sessionId, (event) => {
        if (event.type === 'status') {
          updateLastMessage({ content: event.message });
        } else if (event.type === 'sql') {
          partial.sql = event.sql;
          partial.explanation = event.explanation;
          updateLastMessage({
            content: event.explanation || 'Here are the results:',
            partialSql: event.sql,
          });
        } else if (event.type === 'result') {
          partial.columns = event.columns;
          partial.rows = event.rows;
          partial.row_count = event.row_count;
          partial.chart_recommendation = event.chart_recommendation;
          partial.execution_time_ms = event.execution_time_ms;
        } else if (event.type === 'done') {
          const fullResponse: QueryResponse = {
            session_id: event.session_id,
            sql: partial.sql!,
            explanation: partial.explanation!,
            columns: partial.columns!,
            rows: partial.rows!,
            row_count: partial.row_count!,
            chart_recommendation: partial.chart_recommendation!,
            execution_time_ms: partial.execution_time_ms!,
            model_used: event.model_used,
            retries: event.retries,
          };
          updateLastMessage({
            content: fullResponse.explanation || 'Here are the results:',
            queryResponse: fullResponse,
            partialSql: undefined,
          });
        } else if (event.type === 'error') {
          updateLastMessage({
            content: 'I encountered an error processing your query.',
            error: event.message,
            partialSql: undefined,
          });
        }
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      updateLastMessage({
        content: 'I encountered an error processing your query.',
        error: errorMsg,
        partialSql: undefined,
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
          <EmptyState onQuestion={handleSend} />
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

function EmptyState({ onQuestion }: { onQuestion: (q: string) => void }) {
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
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <p className="text-xs text-[var(--text-muted)] font-medium text-left">Try asking:</p>
        {SUGGESTED_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => onQuestion(q)}
            className="text-left text-xs px-3 py-2.5 rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-secondary)] hover:border-[var(--brand)] text-[var(--text-secondary)] transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
