import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getHealth } from '../../utils/api';
import type { HealthStatus } from '../../types';

interface HealthModalProps {
  open: boolean;
  onClose: () => void;
}

export function HealthModal({ open, onClose }: HealthModalProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open]);

  if (!open) return null;

  const StatusRow = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-[var(--surface-border)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        {ok
          ? <><CheckCircle size={14} className="text-green-500" /><span className="text-xs text-green-500">Connected</span></>
          : <><XCircle size={14} className="text-red-400" /><span className="text-xs text-red-400">Unavailable</span></>
        }
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface)] rounded-2xl border border-[var(--surface-border)] w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
          <h2 className="font-semibold text-[var(--text-primary)]">System Health</h2>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)]">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)]">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          {loading && !health ? (
            <div className="text-center py-4 text-[var(--text-muted)] text-sm">Checking...</div>
          ) : health ? (
            <>
              <StatusRow label="PostgreSQL Database" ok={health.database} />
              <StatusRow label="Anthropic Claude" ok={health.anthropic} />
              <StatusRow label="OpenAI GPT-4" ok={health.openai} />
              <p className="text-xs text-[var(--text-muted)] mt-3">
                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </>
          ) : (
            <div className="text-center py-4 text-red-400 text-sm">Backend unreachable</div>
          )}
        </div>
      </div>
    </div>
  );
}
