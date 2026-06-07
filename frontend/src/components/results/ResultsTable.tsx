import { useState } from 'react';
import { ChevronLeft, ChevronRight, TableIcon, Download, AlertTriangle } from 'lucide-react';

interface ResultsTableProps {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  executionTimeMs: number;
}

const PAGE_SIZE = 25;
const ROW_LIMIT = 100;

export function ResultsTable({ columns, rows, rowCount, executionTimeMs }: ResultsTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (columns.length === 0) return null;

  const exportCSV = () => {
    const escape = (cell: string | number | boolean | null): string => {
      if (cell === null) return '';
      const s = String(cell);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const csv = [columns.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv' }), 'results.csv');
  };

  const exportJSON = () => {
    const data = rows.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'results.json');
  };

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
        <div className="flex items-center gap-2">
          {/* Export buttons */}
          <button
            onClick={exportCSV}
            title="Export as CSV"
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
          <button
            onClick={exportJSON}
            title="Export as JSON"
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors"
          >
            <Download size={12} />
            JSON
          </button>

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
      </div>

      {/* Row limit warning */}
      {rowCount >= ROW_LIMIT && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={12} className="flex-shrink-0" />
          Results are limited to {ROW_LIMIT} rows. Refine your question or add a smaller LIMIT to see different data.
        </div>
      )}

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
