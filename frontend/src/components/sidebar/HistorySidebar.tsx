import { useEffect } from 'react';
import { History, Trash2, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import { getHistory, deleteHistoryEntry } from '../../utils/api';
import { useStore } from '../../store/useStore';
import type { HistoryEntry } from '../../types';
import { clsx } from 'clsx';

export function HistorySidebar() {
  const { history, setHistory, sidebarOpen, toggleSidebar } = useStore();

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

          {/* History list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {history.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                No queries yet
              </div>
            ) : (
              history.map(entry => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  formatTime={formatTime}
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
}

function HistoryItem({ entry, onDelete, formatTime }: HistoryItemProps) {
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
          {entry.question}
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
