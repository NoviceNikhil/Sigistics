import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";

const PACKAGE_ICON = {
  small: "📦",
  medium: "🗃️",
  large: "📫",
};

const ShipmentCard = ({ shipment }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/customer/shipments/${shipment.id}`)}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-300
        shadow-sm hover:shadow-lg hover:shadow-blue-100/60
        transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top accent line — animates on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400
        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-sm font-bold text-blue-600 group-hover:text-blue-700 tracking-wide">
            {shipment.shipment_code}
          </span>
          <StatusBadge status={shipment.status} />
        </div>

        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          {/* From */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">From</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{shipment.pickup_city}</p>
            {shipment.pickup_subregion && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{shipment.pickup_subregion}</p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center
              group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* To */}
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">To</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{shipment.delivery_city}</p>
            {shipment.delivery_subregion && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{shipment.delivery_subregion}</p>
            )}
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {shipment.package_type && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <span>{PACKAGE_ICON[shipment.package_type]}</span>
                <span className="capitalize">{shipment.package_type}</span>
              </span>
            )}
            {shipment.weight_kg && (
              <span className="text-xs text-slate-400">{shipment.weight_kg} kg</span>
            )}
            {shipment.estimated_distance_km && (
              <span className="text-xs text-slate-400">{shipment.estimated_distance_km} km</span>
            )}
          </div>
          {shipment.eta_hours && (
            <span className="text-xs text-slate-500">
              ETA{" "}
              <span className="font-semibold text-slate-700">{shipment.eta_hours}h</span>
            </span>
          )}
        </div>
      </div>

      {/* Delay banner */}
      {shipment.is_delayed && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border-t border-red-100">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-600">Shipment is running behind schedule</span>
        </div>
      )}
    </div>
  );
};

export default ShipmentCard;


