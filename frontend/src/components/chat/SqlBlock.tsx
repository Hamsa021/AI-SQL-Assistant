import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface SqlBlockProps {
  sql: string;
}

export function SqlBlock({ sql }: SqlBlockProps) {
  const darkMode = useStore(s => s.darkMode);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-[var(--surface-border)] mt-3">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--sql-bg)] border-b border-[var(--surface-border)]">
        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">SQL</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language="sql"
        style={darkMode ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '13px',
          lineHeight: '1.6',
          background: darkMode ? '#0d1117' : '#f8f9fa',
          fontFamily: "'IBM Plex Mono', monospace",
        }}
        wrapLongLines
      >
        {sql}
      </SyntaxHighlighter>
    </div>
  );
}
