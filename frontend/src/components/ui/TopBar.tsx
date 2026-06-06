import { Sun, Moon, PanelLeftOpen, PlusSquare, Database, Activity } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { ModelProvider } from '../../types';
import { clsx } from 'clsx';

interface TopBarProps {
  onSchemaClick: () => void;
  onHealthClick: () => void;
}

export function TopBar({ onSchemaClick, onHealthClick }: TopBarProps) {
  const { darkMode, toggleDarkMode, modelProvider, setModelProvider, sidebarOpen, toggleSidebar, newSession, clearMessages } = useStore();

  const handleNewChat = () => {
    newSession();
    clearMessages();
  };

  return (
    <header className="flex items-center justify-between px-4 h-14 border-b border-[var(--surface-border)] bg-[var(--surface)] flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors">
            <PanelLeftOpen size={16} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[var(--brand)] rounded-lg flex items-center justify-center">
            <Database size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight">SQL Assistant</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Model switcher */}
        <div className="flex items-center bg-[var(--surface-secondary)] rounded-lg border border-[var(--surface-border)] p-0.5">
          {(['anthropic', 'openai'] as ModelProvider[]).map(p => (
            <button
              key={p}
              onClick={() => setModelProvider(p)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                modelProvider === p
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--surface-border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              {p === 'anthropic' ? 'Claude' : 'GPT-4o'}
            </button>
          ))}
        </div>

        <button onClick={onSchemaClick} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors" title="View Schema">
          <Database size={15} />
        </button>

        <button onClick={onHealthClick} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors" title="System Health">
          <Activity size={15} />
        </button>

        <button onClick={handleNewChat} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors" title="New Chat">
          <PlusSquare size={15} />
        </button>

        <button onClick={toggleDarkMode} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors">
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
