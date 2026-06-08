const STEPS = [
  { key: "created", label: "Order Created", desc: "Shipment request placed", icon: "✦" },
  { key: "assigned", label: "Agent Assigned", desc: "Delivery agent confirmed", icon: "◈" },
  { key: "picked", label: "Picked Up", desc: "Package collected by agent", icon: "⬡" },
  { key: "in_transit", label: "In Transit", desc: "Out for delivery", icon: "➤" },
  { key: "delivered", label: "Delivered", desc: "Package delivered successfully", icon: "✓" },
];

const ORDER = ["created", "assigned", "picked", "in_transit", "delivered"];

const StatusTimeline = ({ currentStatus, history = [] }) => {
  const currentIndex = ORDER.indexOf(currentStatus);

  const getState = (key) => {
    const i = ORDER.indexOf(key);
    if (i < currentIndex) return "done";
    if (i === currentIndex) return "active";
    return "pending";
  };

  const getHistory = (key) => history.find((h) => h.new_status === key);

  return (
    <div className="space-y-1">
      {STEPS.map((step, idx) => {
        const state = getState(step.key);
        const entry = getHistory(step.key);
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-3">
            {/* Left: dot + line */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                ${state === "done"
                  ? "bg-blue-600 shadow-md shadow-blue-200"
                  : state === "active"
                    ? "bg-white border-2 border-blue-600 shadow-md shadow-blue-100"
                    : "bg-slate-50 border-2 border-slate-200"}`}
              >
                {state === "done" ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : state === "active" ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Connector */}
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 min-h-[1.5rem] rounded-full transition-colors duration-500
                  ${state === "done" ? "bg-blue-300" : "bg-slate-200"}`}
                />
              )}
            </div>

            {/* Right: content */}
            <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
              <p className={`text-sm font-semibold leading-none mb-1 mt-1.5
                ${state === "pending" ? "text-slate-300" : "text-slate-800"}`}>
                {step.label}
              </p>
              <p className={`text-xs ${state === "pending" ? "text-slate-300" : "text-slate-500"}`}>
                {step.desc}
              </p>
              {entry && (
                <p className="text-[11px] text-blue-500 font-medium mt-1">
                  {new Date(entry.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short",
                    hour: "2-digit", minute: "2-digit",
                  })}
                  {entry.notes && (
                    <span className="text-slate-400 font-normal"> · {entry.notes}</span>
                  )}
                </p>
              )}
              {state === "active" && !entry && (
                <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Current status
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;

