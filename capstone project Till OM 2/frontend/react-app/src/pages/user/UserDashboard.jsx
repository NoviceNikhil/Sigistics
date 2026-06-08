import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import ShipmentCard from "../../components/dashboard/ShipmentCard";
import Chatbot from "../../components/dashboard/Chatbot";
import {
  Package, Truck, CheckCircle2, Clock, Plus, Loader2,
  LayoutDashboard, ArrowRight, AlertCircle
} from "lucide-react";

/* ── KPI Card — reuses admin-minimal-card styling ─────────────────────────── */
const KpiCard = ({ label, value, icon: Icon, colorClass }) => {
  const getScheme = (c) => {
    if (c.includes("emerald") || c.includes("teal")) return "bg-emerald-50 text-emerald-600";
    if (c.includes("rose") || c.includes("red")) return "bg-rose-50 text-rose-600";
    if (c.includes("amber") || c.includes("orange")) return "bg-amber-50 text-amber-600";
    if (c.includes("purple") || c.includes("indigo")) return "bg-indigo-50 text-indigo-600";
    return "bg-blue-50 text-blue-600";
  };
  const scheme = getScheme(colorClass);

  return (
    <div className="admin-minimal-card p-6 flex flex-col justify-between hover:border-slate-300 transition-all group h-full">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</h4>
        {Icon && (
          <div className={`p-2 rounded-xl ${scheme}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="text-3xl font-black text-slate-900 tracking-tight">{value ?? "—"}</div>
    </div>
  );
};

/* ── Main Dashboard ───────────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    total: 0, inTransit: 0, delivered: 0, pendingAssignment: 0, recentShipments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/customer/shipments/dashboard")
      .then((res) => setData(res.data.data))
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
      <Loader2 className="animate-spin text-indigo-500" size={36} />
      <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse tracking-widest uppercase">
        Loading Dashboard...
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-500 font-bold tracking-wider">
      <AlertCircle className="mx-auto mb-3" size={28} />
      {error}
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
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 sm:gap-3">
              <LayoutDashboard className="text-indigo-600" size={24} /> My Dashboard
            </h1>
            <p className="text-[10px] font-black text-slate-400 mt-1 tracking-widest uppercase">
              {today} · Shipment Overview
            </p>
          </div>
          <button
            onClick={() => navigate("/customer/shipments/new")}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-sm hover:bg-black transition-all font-black uppercase text-xs tracking-widest w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus size={16} /> New Shipment
          </button>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="mb-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Package size={12} /> Shipment Metrics
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard label="Total Shipments" value={data?.total} icon={Package} colorClass="from-blue-500 to-indigo-500" />
            <KpiCard label="In Transit" value={data?.inTransit} icon={Truck} colorClass="from-amber-400 to-orange-500" />
            <KpiCard label="Delivered" value={data?.delivered} icon={CheckCircle2} colorClass="from-emerald-400 to-teal-500" />
            <KpiCard label="Pending" value={data?.pendingAssignment} icon={Clock} colorClass="from-purple-500 to-indigo-500" />
          </div>
        </div>

        {/* ── RECENT SHIPMENTS ── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Truck size={12} /> Recent Shipments
            </p>
            <button
              onClick={() => navigate("/customer/shipments")}
              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors cursor-pointer"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {data?.recentShipments?.length === 0 ? (
            <div className="admin-minimal-card p-16 text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="text-indigo-400" />
              </div>
              <p className="text-sm font-black text-slate-700 mb-1">No shipments yet</p>
              <p className="text-xs text-slate-400 font-bold mb-5 uppercase tracking-wider">
                Create your first shipment to get started
              </p>
              <button
                onClick={() => navigate("/customer/shipments/new")}
                className="text-xs font-black bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-black shadow-sm transition-all uppercase tracking-widest cursor-pointer"
              >
                Create Shipment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recentShipments.map((s) => (
                <ShipmentCard key={s.id} shipment={s} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Chatbot />
    </div>


  );
};

export default Dashboard;