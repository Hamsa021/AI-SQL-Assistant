import { useState } from 'react';
import { ChevronLeft, ChevronRight, TableIcon } from 'lucide-react';

interface ResultsTableProps {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  executionTimeMs: number;
}

const PAGE_SIZE = 25;

export function ResultsTable({ columns, rows, rowCount, executionTimeMs }: ResultsTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (columns.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-[var(--surface-border)] overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-secondary)] border-b border-[var(--surface-border)]">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <TableIcon size={14} />
          <span>{rowCount.toLocaleString()} row{rowCount !== 1 ? 's' : ''}</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span className="text-[var(--text-muted)]">{executionTimeMs.toFixed(0)}ms</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded hover:bg-[var(--surface)] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1 rounded hover:bg-[var(--surface)] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)]">
              {columns.map(col => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap bg-[var(--surface-secondary)] sticky top-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-[var(--surface-border)] last:border-0 hover:bg-[var(--surface-secondary)] transition-colors"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs whitespace-nowrap max-w-xs truncate"
                    title={cell === null ? 'NULL' : String(cell)}
                  >
                    {cell === null ? (
                      <span className="text-[var(--text-muted)] italic">NULL</span>
                    ) : typeof cell === 'boolean' ? (
                      <span className={cell ? 'text-green-500' : 'text-red-400'}>{String(cell)}</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
