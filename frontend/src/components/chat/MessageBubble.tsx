import { User, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { SqlBlock } from './SqlBlock';
import { ResultsTable } from '../results/ResultsTable';
import { ChartDisplay } from '../charts/ChartDisplay';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const { queryResponse, error } = message;

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
          isUser ? 'bg-[var(--brand)]' : 'bg-[var(--surface-secondary)] border border-[var(--surface-border)]'
        }`}
      >
        {isUser
          ? <User size={14} />
          : <Bot size={14} className="text-[var(--text-secondary)]" />
        }
      </div>

      {/* Content */}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        {/* Text bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[var(--chat-user-bg)] text-white rounded-tr-sm'
              : 'bg-[var(--chat-ai-bg)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--surface-border)]'
          }`}
        >
          {message.content}
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm max-w-full">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Query response */}
        {queryResponse && (
          <div className="w-full max-w-3xl">
            {/* SQL block */}
            <SqlBlock sql={queryResponse.sql} />

            {/* Explanation */}
            {queryResponse.explanation && (
              <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed px-1">
                {queryResponse.explanation}
              </p>
            )}

            {/* Retry notice */}
            {queryResponse.retries > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                <RefreshCw size={11} />
                <span>Auto-corrected after {queryResponse.retries} attempt{queryResponse.retries > 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Chart */}
            <ChartDisplay
              recommendation={queryResponse.chart_recommendation}
              columns={queryResponse.columns}
              rows={queryResponse.rows}
            />

            {/* Table */}
            <ResultsTable
              columns={queryResponse.columns}
              rows={queryResponse.rows}
              rowCount={queryResponse.row_count}
              executionTimeMs={queryResponse.execution_time_ms}
            />

            {/* Meta */}
            <div className="flex items-center gap-2 mt-2 px-1">
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{queryResponse.model_used}</span>
              <span className="text-[var(--text-muted)] text-[10px]">·</span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
