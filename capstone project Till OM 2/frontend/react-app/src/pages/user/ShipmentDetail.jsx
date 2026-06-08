import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/axios";
import StatusBadge from "../../components/dashboard/StatusBadge";
import StatusTimeline from "../../components/dashboard/StatusTimeline";
import {
  Copy, Check, Clock, MapPin, Package, Weight, Route,
  User, ClipboardList, Zap, Loader2, AlertCircle, ArrowLeft,
  ArrowRight, AlertTriangle
} from "lucide-react";

/* ── Info Tile — admin-minimal-card style ── */
const InfoTile = ({ label, value, icon: Icon }) => (
  <div className="admin-minimal-card p-4 flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-3">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</h4>
      {Icon && (
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
          <Icon size={14} />
        </div>
      )}
    </div>
    <p className="text-sm font-black text-slate-900">{value || "—"}</p>
  </div>
);

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/api/customer/shipments/${id}`)
      .then((res) => setShipment(res.data.data))
      .catch(() => setError("Shipment not found or you don't have access."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shipment.shipment_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
      <Loader2 className="animate-spin text-indigo-500" size={36} />
      <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse tracking-widest uppercase">
        Loading Shipment...
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-rose-400" />
        </div>
        <p className="text-sm text-red-500 mb-3 font-black">{error}</p>
        <button onClick={() => navigate("/customer/shipments")}
          className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">
          <ArrowLeft size={12} className="inline mr-1" /> Back to shipments
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 min-h-screen font-sans relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-[50px] right-[-50px] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-[40%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">
                {shipment.shipment_code}
              </h1>
              <button
                onClick={handleCopy}
                className="admin-secondary-btn !px-3 !py-1.5 flex items-center gap-1.5 !text-[10px] cursor-pointer"
              >
                {copied ? (
                  <><Check size={12} className="text-emerald-600" /> Copied!</>
                ) : (
                  <><Copy size={12} /> Copy</>
                )}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={shipment.status} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Created{" "}
                {new Date(shipment.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/customer/shipments")}
            className="admin-secondary-btn flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} /> All Shipments
          </button>
        </div>

        {/* ── DELAY ALERT ── */}
        {shipment.is_delayed && (
          <div className="admin-minimal-card p-4 mb-6 !border-rose-200 bg-rose-50/50">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Shipment Delayed
                </p>
                <p className="text-[10px] text-rose-500 font-bold mt-0.5 uppercase tracking-wider">
                  Your shipment is running behind schedule.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Metrics row */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Zap size={12} /> Shipment Metrics
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoTile label="ETA" value={shipment.eta_hours ? `${shipment.eta_hours}h` : null} icon={Clock} />
                <InfoTile label="Distance" value={shipment.estimated_distance_km ? `${shipment.estimated_distance_km} km` : null} icon={Route} />
                <InfoTile label="Package" value={shipment.package_type ? shipment.package_type.charAt(0).toUpperCase() + shipment.package_type.slice(1) : null} icon={Package} />
                <InfoTile label="Weight" value={shipment.weight_kg ? `${shipment.weight_kg} kg` : null} icon={Weight} />
              </div>
            </div>

            {/* Delivery dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoTile
                label="Expected Delivery"
                icon={Clock}
                value={
                  shipment.expected_delivery_at
                    ? new Date(shipment.expected_delivery_at).toLocaleString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                    : null
                }
              />
              {shipment.actual_delivery_at && (
                <InfoTile
                  label="Actual Delivery"
                  icon={Check}
                  value={new Date(shipment.actual_delivery_at).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                />
              )}
            </div>

            {/* Route card */}
            <div className="admin-minimal-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <MapPin size={14} className="text-indigo-500" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Route</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4">
                  {/* Pickup */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Pickup</span>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
                      <p className="text-sm font-black text-slate-800">{shipment.pickup_city}</p>
                      {shipment.pickup_subregion && (
                        <p className="text-xs text-blue-600 font-bold mt-0.5">{shipment.pickup_subregion}</p>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-md">
                      <ArrowRight size={14} className="text-white" />
                    </div>
                    {shipment.estimated_distance_km && (
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{shipment.estimated_distance_km} km</span>
                    )}
                  </div>

                  {/* Delivery */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Delivery</span>
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3.5 border border-indigo-100">
                      <p className="text-sm font-black text-slate-800">{shipment.delivery_city}</p>
                      {shipment.delivery_subregion && (
                        <p className="text-xs text-indigo-600 font-bold mt-0.5">{shipment.delivery_subregion}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent card */}
            <div className="admin-minimal-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <User size={14} className="text-indigo-500" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Delivery Agent</h2>
              </div>
              <div className="p-5">
                {shipment.Agent ? (
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900
                      flex items-center justify-center text-white font-black text-lg shadow-md">
                      {shipment.Agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{shipment.Agent.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {shipment.Agent.city}
                        {shipment.Agent.phone && ` · ${shipment.Agent.phone}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Clock size={16} className="text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Awaiting agent assignment</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status history table */}
            {shipment.ShipmentHistories?.length > 0 && (
              <div className="admin-minimal-card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <ClipboardList size={14} className="text-indigo-500" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[480px]">
                    <thead>
                      <tr className="border-b-2 border-gray-100 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                        <th className="pb-4 px-5 pt-4">From</th>
                        <th className="pb-4 px-5 pt-4">To</th>
                        <th className="pb-4 px-5 pt-4">Notes</th>
                        <th className="pb-4 px-5 pt-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {shipment.ShipmentHistories.map((h) => (
                        <tr key={h.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-5 text-xs text-slate-500 capitalize font-bold">
                            {h.previous_status?.replace("_", " ") || "—"}
                          </td>
                          <td className="py-4 px-5">
                            <StatusBadge status={h.new_status} />
                          </td>
                          <td className="py-4 px-5 text-xs text-slate-400 font-bold">{h.notes || "—"}</td>
                          <td className="py-4 px-5 text-xs text-slate-400 whitespace-nowrap font-bold">
                            {new Date(h.createdAt).toLocaleString("en-IN", {
                              day: "numeric", month: "short",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column — Timeline ── */}
          <div className="lg:col-span-1">
            <div className="admin-minimal-card p-5 sticky top-20">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <Zap size={14} className="text-indigo-500" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Progress</h2>
              </div>
              <StatusTimeline
                currentStatus={shipment.status}
                history={shipment.ShipmentHistories || []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetail;