const STATUS_CONFIG = {
  created: {
    label: "Created",
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  },
  assigned: {
    label: "Assigned",
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
  picked: {
    label: "Picked Up",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  in_transit: {
    label: "In Transit",
    dot: "bg-orange-500 animate-pulse",
    pill: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  },
  delivered: {
    label: "Delivered",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-400",
    pill: "bg-red-50 text-red-600 ring-1 ring-red-200",
  },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.created;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;

