import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#a855f7",
  "#06b6d4", "#84cc16",
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl px-4 py-3">
        <p className="font-black text-gray-900 text-sm">{d.name}</p>
        <p className="text-indigo-600 font-bold text-sm">
          {d.value.toLocaleString()} shipments
        </p>
        <p className="text-gray-400 text-xs font-bold">
          {d.payload.percent
            ? `${(d.payload.percent * 100).toFixed(1)}%`
            : ""}
        </p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight="900"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CityPieChart({ data = [], title, subtitle }) {
  const filtered = data.filter((d) => d.value > 0).slice(0, 12);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 h-full flex flex-col non-interactive-chart">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800 flex items-center gap-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300 font-black text-xs uppercase tracking-widest">
          No data in this scope
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart tabIndex={-1}>
              <Pie
                data={filtered}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius="80%"
                innerRadius="35%"
                dataKey="value"
                paddingAngle={2}
              >
                {filtered.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[10px] font-bold text-gray-600 uppercase">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
