import { useEffect, useState } from 'react';
import { History, Trash2, CheckCircle, XCircle, ChevronLeft, Search, X } from 'lucide-react';
import { getHistory, deleteHistoryEntry } from '../../utils/api';
import { useStore } from '../../store/useStore';
import type { HistoryEntry } from '../../types';
import { clsx } from 'clsx';

export function HistorySidebar() {
  const { history, setHistory, sidebarOpen, toggleSidebar } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory(50);
      setHistory(data);
    } catch {
      // Silently fail if backend not available
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteHistoryEntry(id);
    setHistory(history.filter(h => h.id !== id));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredHistory = searchQuery
    ? history.filter(h => h.question.toLowerCase().includes(searchQuery.toLowerCase()))
    : history;

  return (
    <aside
      className={clsx(
        'flex flex-col border-r border-[var(--surface-border)] bg-[var(--sidebar-bg)] transition-all duration-300 overflow-hidden flex-shrink-0',
        sidebarOpen ? 'w-72' : 'w-0'
      )}
    >
      {sidebarOpen && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--surface-border)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <History size={15} />
              Query History
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-[var(--surface-border)]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)]">
              <Search size={12} className="text-[var(--text-muted)] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 text-xs bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* History list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                {searchQuery ? 'No results found' : 'No queries yet'}
              </div>
            ) : (
              filteredHistory.map(entry => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  formatTime={formatTime}
                  highlight={searchQuery}
                />
              ))
            )}
          </div>
        </>
      )}
    </aside>
  );
}

interface HistoryItemProps {
  entry: HistoryEntry;
  onDelete: (id: number, e: React.MouseEvent) => void;
  formatTime: (iso: string) => string;
  highlight: string;
}

function HistoryItem({ entry, onDelete, formatTime, highlight }: HistoryItemProps) {
  const question = highlight
    ? highlightMatch(entry.question, highlight)
    : entry.question;

  return (
    <div className="group flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors cursor-default">
      <div className="flex-shrink-0 mt-0.5">
        {entry.success
          ? <CheckCircle size={12} className="text-green-500" />
          : <XCircle size={12} className="text-red-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-primary)] leading-snug truncate" title={entry.question}>
          {question}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-[var(--text-muted)]">{formatTime(entry.created_at)}</span>
          <span className="text-[10px] text-[var(--text-muted)]">·</span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{entry.execution_time_ms.toFixed(0)}ms</span>
        </div>
      </div>
      <button
        onClick={(e) => onDelete(entry.id, e)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-[var(--text-muted)] hover:text-red-500 transition-all"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--brand-muted)] text-[var(--brand)] rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
