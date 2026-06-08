import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TimelineChart({ data }) {
  // Format date to a cleaner string (e.g., "Apr 10")
  const formattedData = data.map(d => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      displayDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  return (
    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col h-full non-interactive-chart">
      <div className="mb-6 flex justify-between items-end">
        <div>
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800">Throughput Velocity</h3>
           <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">Daily parcel induction rate</p>
        </div>
      </div>
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} tabIndex={-1}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 'bold'}} 
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 'bold'}} 
            />
            <Tooltip 
               contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
               labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', color: '#6b7280', fontSize: '10px', letterSpacing: '0.1em' }}
               itemStyle={{ fontWeight: '900', color: '#4f46e5' }}
            />
            <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#4f46e5" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5', style: { filter: "drop-shadow(0px 4px 10px rgba(79, 70, 229, 0.6))"} }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}