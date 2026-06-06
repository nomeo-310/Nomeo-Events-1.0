// analytics-charts.tsx
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHART_COLORS, tooltipStyle } from "./analytics-types";

export function TrendBar({ data, dataKey = "count", color = "#3b82f6", height = 160 }: {
  data: { label: string; [k: string]: any }[];
  dataKey?: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-800" />
        <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data, lines, height = 160 }: {
  data: { label: string; [k: string]: any }[];
  lines: { key: string; color: string; label?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-800" />
        <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />}
        {lines.map(l => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label ?? l.key}
            stroke={l.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MiniPie({ data }: { data: { _id: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="_id" cx="50%" cy="50%"
          outerRadius={62} innerRadius={32}
          label={(props) => {
            const entry = props as typeof props & { _id: string };
            return `${entry._id} ${(((props.percent) ?? 0) * 100).toFixed(0)}%`;
          }}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}