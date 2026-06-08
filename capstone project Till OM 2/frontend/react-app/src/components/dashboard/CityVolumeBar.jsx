import React from "react";
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

const STATUS_COLORS = {
  delivered: "#10b981",
  in_transit: "#6366f1",
  assigned: "#f59e0b",
  picked: "#8b5cf6",
  created: "#94a3b8",
  cancelled: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl px-4 py-3 min-w-[160px]">
        <p className="font-black text-gray-900 text-sm mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex justify-between gap-4 text-xs font-bold">
            <span style={{ color: p.fill }} className="capitalize">
              {p.dataKey}
            </span>
            <span className="text-gray-700">{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CityVolumeBar({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 h-full flex flex-col">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800 mb-4">
          📊 City Volume Breakdown
        </h3>
        <div className="flex-1 flex items-center justify-center text-gray-300 font-black text-xs uppercase tracking-widest">
          No data in this scope
        </div>
      </div>
    );
  }

  // Sort by total descending
  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 h-full flex flex-col non-interactive-chart">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800">
          📊 City Volume Breakdown
        </h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
          Shipments per city by status
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            margin={{ top: 4, right: 16, left: -10, bottom: 40 }}
            barSize={12}
            tabIndex={-1}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="city"
              tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8", textTransform: "uppercase" }}
              angle={-35}
              textAnchor="end"
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
            {Object.keys(STATUS_COLORS).map((status) => (
              <Bar
                key={status}
                dataKey={status}
                stackId="a"
                fill={STATUS_COLORS[status]}
                radius={status === "delivered" ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
