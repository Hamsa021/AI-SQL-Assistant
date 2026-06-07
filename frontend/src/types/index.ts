export type ModelProvider = 'anthropic' | 'openai';
export type ChartType = 'bar' | 'line' | 'pie' | 'none';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChartRecommendation {
  type: ChartType;
  x_column: string | null;
  y_column: string | null;
  label_column: string | null;
  value_column: string | null;
  title: string;
}

export interface QueryResponse {
  session_id: string;
  sql: string;
  explanation: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
  chart_recommendation: ChartRecommendation;
  execution_time_ms: number;
  model_used: string;
  retries: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_keys: string[];
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  row_count: number | null;
}

export interface SchemaResponse {
  tables: TableSchema[];
  total_tables: number;
}

export interface HistoryEntry {
  id: number;
  session_id: string;
  question: string;
  sql: string;
  success: boolean;
  error_message: string | null;
  execution_time_ms: number;
  model_used: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  queryResponse?: QueryResponse;
  partialSql?: string;
  error?: string;
  timestamp: Date;
}

export type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'sql'; sql: string; explanation: string }
  | { type: 'result'; columns: string[]; rows: (string | number | boolean | null)[][]; row_count: number; chart_recommendation: ChartRecommendation; execution_time_ms: number }
  | { type: 'done'; session_id: string; model_used: string; retries: number }
  | { type: 'error'; message: string };

export interface HealthStatus {
  status: string;
  database: boolean;
  anthropic: boolean;
  openai: boolean;
  timestamp: string;
}
