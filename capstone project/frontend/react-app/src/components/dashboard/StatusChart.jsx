import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StatusChart({ data }) {
  // Filter out any 0 values for clean graphing
  const activeData = data.filter(d => d.value > 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (percent === 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="black" className="tracking-widest">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col h-full non-interactive-chart">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800">State Matrix</h3>
        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">Current shipment disposition</p>
      </div>
      <div className="flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart tabIndex={-1}>
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="10" stdDeviation="15" floodOpacity="0.15" />
              </filter>
            </defs>
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
              labelLine={false}
              label={renderCustomizedLabel}
              style={{ filter: "url(#shadow)" }}
            >
              {activeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              itemStyle={{ color: '#1f2937', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}
              formatter={(value) => [`${value} parcels`, 'Count']} 
            />
            <Legend 
               verticalAlign="bottom" 
               height={36} 
               iconType="circle"
               wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}