import React from 'react';

export default function KPICard({ title, value, subtitle, icon: Icon, colorClass = "blue" }) {
  // Convert old colorClass gradient strings to simple colors if needed, 
  // or just use color mapping for minimalistic look.
  const getColorScheme = (color) => {
    if (color.includes("emerald")) return "bg-emerald-50 text-emerald-600";
    if (color.includes("rose") || color.includes("red")) return "bg-rose-50 text-rose-600";
    if (color.includes("amber") || color.includes("orange")) return "bg-amber-50 text-amber-600";
    return "bg-indigo-50 text-indigo-600";
  };

  const scheme = getColorScheme(colorClass);

  return (
    <div className="admin-minimal-card p-6 flex flex-col justify-between hover:border-slate-300 transition-all group h-full">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{title}</h4>
        {Icon && (
            <div className={`p-2 rounded-xl ${scheme}`}>
                <Icon size={18} />
            </div>
        )}
      </div>
      <div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
          {subtitle && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}