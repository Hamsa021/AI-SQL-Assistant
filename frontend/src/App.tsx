import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { TopBar } from './components/ui/TopBar';
import { HistorySidebar } from './components/sidebar/HistorySidebar';
import { ChatView } from './components/chat/ChatView';
import { SchemaModal } from './components/ui/SchemaModal';
import { HealthModal } from './components/ui/HealthModal';

export default function App() {
  const darkMode = useStore(s => s.darkMode);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--surface)]">
      <TopBar onSchemaClick={() => setSchemaOpen(true)} onHealthClick={() => setHealthOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <HistorySidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatView />
        </main>
      </div>

      <SchemaModal open={schemaOpen} onClose={() => setSchemaOpen(false)} />
      <HealthModal open={healthOpen} onClose={() => setHealthOpen(false)} />
    </div>
  );
}
