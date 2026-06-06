import axios from 'axios';
import type {
  QueryResponse,
  SchemaResponse,
  HistoryEntry,
  Message,
  ModelProvider,
  HealthStatus,
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
