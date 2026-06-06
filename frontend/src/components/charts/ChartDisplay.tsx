import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { ChartRecommendation } from '../../types';
import { useStore } from '../../store/useStore';

interface ChartDisplayProps {
  recommendation: ChartRecommendation;
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export function ChartDisplay({ recommendation, columns, rows }: ChartDisplayProps) {
  const darkMode = useStore(s => s.darkMode);

  if (recommendation.type === 'none' || rows.length === 0) return null;

  // Build data array from rows
  const data = rows.slice(0, 50).map(row => {
    const obj: Record<string, string | number | null> = {};
    columns.forEach((col, i) => {
      const val = row[i];
      obj[col] = typeof val === 'string' ? val : Number(val);
    });
    return obj;
  });

  const axisStyle = { fill: darkMode ? '#78716c' : '#6b7280', fontSize: 11, fontFamily: 'IBM Plex Mono' };
  const gridColor = darkMode ? '#2a2a2a' : '#f0f0f0';
  const bgColor = darkMode ? '#1a1a1a' : '#ffffff';

  const tooltipStyle = {
    backgroundColor: bgColor,
    border: `1px solid ${darkMode ? '#2a2a2a' : '#e5e7eb'}`,
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'IBM Plex Mono',
    color: darkMode ? '#fafaf9' : '#1c1917',
  };

  const renderChart = () => {
    const xKey = recommendation.x_column || columns[0];
    const yKey = recommendation.y_column || columns[1] || columns[0];

    if (recommendation.type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={axisStyle} angle={-30} textAnchor="end" interval="preserveStartEnd" />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey={yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (recommendation.type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={axisStyle} angle={-30} textAnchor="end" interval="preserveStartEnd" />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (recommendation.type === 'pie') {
      const labelKey = recommendation.label_column || columns[0];
      const valueKey = recommendation.value_column || columns[1] || columns[0];
      return (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={labelKey}
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: darkMode ? '#555' : '#ccc' }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="mt-3 rounded-xl border border-[var(--surface-border)] overflow-hidden animate-fade-in">
      <div className="px-4 py-2.5 bg-[var(--surface-secondary)] border-b border-[var(--surface-border)]">
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          {recommendation.title || `${recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)} Chart`}
        </span>
      </div>
      <div className="p-4 bg-[var(--surface)]">
        {renderChart()}
      </div>
    </div>
  );
}
