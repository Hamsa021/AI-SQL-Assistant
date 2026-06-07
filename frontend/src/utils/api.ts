import axios from 'axios';
import type {
  QueryResponse,
  SchemaResponse,
  HistoryEntry,
  Message,
  ModelProvider,
  HealthStatus,
  StreamEvent,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export async function runQuery(
  question: string,
  provider: ModelProvider,
  conversationHistory: Message[],
  sessionId?: string,
): Promise<QueryResponse> {
  const { data } = await api.post<QueryResponse>('/query/', {
    question,
    model_provider: provider,
    conversation_history: conversationHistory,
    session_id: sessionId,
  });
  return data;
}

export async function runQueryStream(
  question: string,
  provider: ModelProvider,
  conversationHistory: Message[],
  sessionId: string | undefined,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/v1/query/stream/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      model_provider: provider,
      conversation_history: conversationHistory,
      session_id: sessionId,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6)) as StreamEvent;
          onEvent(event);
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  }
}

export async function getSchema(): Promise<SchemaResponse> {
  const { data } = await api.get<SchemaResponse>('/schema/');
  return data;
}

export async function getHistory(limit = 50): Promise<HistoryEntry[]> {
  const { data } = await api.get<HistoryEntry[]>('/history/', { params: { limit } });
  return data;
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  await api.delete(`/history/${id}`);
}

export async function getHealth(): Promise<HealthStatus> {
  const { data } = await api.get<HealthStatus>('/health/');
  return data;
}
