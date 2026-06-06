import { useEffect, useState } from 'react';
import { X, Key, Link2, Search } from 'lucide-react';
import { getSchema } from '../../utils/api';
import type { TableSchema } from '../../types';

interface SchemaModalProps {
  open: boolean;
  onClose: () => void;
}

export function SchemaModal({ open, onClose }: SchemaModalProps) {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getSchema().then(r => { setTables(r.tables); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  const filtered = tables.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface)] rounded-2xl border border-[var(--surface-border)] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Database Schema</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)]">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[var(--surface-border)]">
          <div className="flex items-center gap-2 bg-[var(--surface-secondary)] rounded-lg px-3 py-2">
            <Search size={13} className="text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tables..."
              className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Tables */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">Loading schema...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">No tables found</div>
          ) : (
            filtered.map(table => (
              <div key={table.name} className="border border-[var(--surface-border)] rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-[var(--surface-secondary)] flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">{table.name}</span>
                  {table.row_count !== null && (
                    <span className="text-xs text-[var(--text-muted)]">~{table.row_count.toLocaleString()} rows</span>
                  )}
                </div>
                <div className="divide-y divide-[var(--surface-border)]">
                  {table.columns.map(col => (
                    <div key={col.name} className="px-4 py-2 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {col.primary_key && <Key size={10} className="text-amber-500" />}
                        {col.foreign_keys.length > 0 && <Link2 size={10} className="text-blue-400" />}
                      </div>
                      <span className="font-mono text-xs text-[var(--text-primary)] flex-1">{col.name}</span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">{col.type}</span>
                      {!col.nullable && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">NOT NULL</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
