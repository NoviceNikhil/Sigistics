import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

const COLORS = {
  small: "#6366f1",
  medium: "#10b981",
  large: "#f59e0b",
};

export default function PackagePieChart({ data = [] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  const radialData = data.map((d) => ({
    ...d,
    fill: COLORS[d.name] || "#94a3b8",
    percentage: total > 0 ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 h-full flex flex-col non-interactive-chart">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800">
          📦 Package Type Breakdown
        </h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
          Distribution by parcel size
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300 font-black text-xs uppercase tracking-widest">
          No data in this scope
        </div>
      ) : (
        <>
          {/* Radial chart */}
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="90%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
                tabIndex={-1}
              >
                <RadialBar
                  dataKey="percentage"
                  background={{ fill: "#f8fafc" }}
                  cornerRadius={6}
                  label={false}
                />
                <Tooltip
                  formatter={(v, name, props) => [
                    `${v}% (${props.payload.value} shipments)`,
                    props.payload.name,
                  ]}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Detail cards */}
          <div className="flex-1 space-y-3 mt-2">
            {data.map((row) => {
              const color = COLORS[row.name] || "#94a3b8";
              const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
              return (
                <div key={row.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        {row.name}
                      </span>
                      <span className="text-xs font-black" style={{ color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] text-gray-400 font-bold">
                        {row.value.toLocaleString()} shipments
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold">
                        Avg {row.avg_weight}kg
                      </span>
                    </div>
                    {row.delayed_count > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={8} className="text-rose-400" />
                        <span className="text-[9px] text-rose-400 font-bold">
                          {row.delayed_count} delayed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Total Packages
            </span>
            <span className="text-lg font-black text-gray-900">
              {total.toLocaleString()}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
