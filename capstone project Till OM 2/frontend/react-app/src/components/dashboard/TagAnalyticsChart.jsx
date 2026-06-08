import React from "react";
import { Tag, AlertTriangle, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#a855f7",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl px-4 py-3">
        <p className="font-black text-gray-900 text-sm mb-1">
          {label.replace(/_/g, " ").toUpperCase()}
        </p>
        <p className="text-indigo-600 font-bold text-xs">Count: {d.count}</p>
        <p className="text-rose-500 font-bold text-xs">Delay Rate: {d.delay_rate}%</p>
        <p className="text-amber-500 font-bold text-xs">Delayed: {d.delayed}</p>
      </div>
    );
  }
  return null;
};

export default function TagAnalyticsChart({ data = [] }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 h-full flex flex-col non-interactive-chart">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800 flex items-center gap-2">
          <Tag size={14} className="text-purple-500" /> Rule Tag Frequency
        </h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
          Top rule engine tags on shipments
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300 font-black text-xs uppercase tracking-widest">
          No tagged shipments found
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                barSize={14}
                tabIndex={-1}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.replace(/_/g, " ").toUpperCase()}
                />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`tag-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top-3 tags summary pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {data.slice(0, 5).map((tag, i) => (
              <div
                key={tag.name}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border"
                style={{
                  background: `${COLORS[i % COLORS.length]}15`,
                  borderColor: `${COLORS[i % COLORS.length]}40`,
                  color: COLORS[i % COLORS.length],
                }}
              >
                <span>{tag.name.replace(/_/g, " ")}</span>
                <span className="opacity-70">×{tag.count}</span>
                {tag.delay_rate > 30 && (
                  <AlertTriangle size={9} className="text-rose-500" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
