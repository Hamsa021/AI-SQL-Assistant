import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ModelProvider, HistoryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Model
  modelProvider: ModelProvider;
  setModelProvider: (p: ModelProvider) => void;

  // Session
  sessionId: string;
  newSession: () => void;

  // Chat messages
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Sidebar history
  history: HistoryEntry[];
  setHistory: (h: HistoryEntry[]) => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      modelProvider: 'anthropic',
      setModelProvider: (p) => set({ modelProvider: p }),

      sessionId: uuidv4(),
      newSession: () => set({ sessionId: uuidv4(), messages: [] }),

      messages: [],
      addMessage: (msg) =>
        set(s => ({
          messages: [
            ...s.messages,
            { ...msg, id: uuidv4(), timestamp: new Date() },
          ],
        })),
      clearMessages: () => set({ messages: [], sessionId: uuidv4() }),

      history: [],
      setHistory: (h) => set({ history: h }),

      sidebarOpen: true,
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      isLoading: false,
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'sql-assistant-store',
      partialize: (s) => ({ darkMode: s.darkMode, modelProvider: s.modelProvider, sidebarOpen: s.sidebarOpen }),
    },
  ),
);
