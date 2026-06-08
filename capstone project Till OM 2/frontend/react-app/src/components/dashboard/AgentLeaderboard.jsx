import React, { useState } from "react";
import {
  Trophy, Star, TrendingUp, AlertTriangle, MapPin,
  X, Mail, Phone, Package, Truck, CheckCircle2,
  Clock, AlertCircle, Loader2, Activity, User
} from "lucide-react";
import * as agentService from "../../services/agentService";

/* ── Rank medals ────────────────────────────────────────────── */
const MEDAL = {
  1: { emoji: "🥇", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
  2: { emoji: "🥈", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-500" },
  3: { emoji: "🥉", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-500" },
};

/* ── Status colours for shipment badges ─────────────────────── */
const STATUS_STYLE = {
  created: "bg-gray-100 text-gray-600 border-gray-200",
  assigned: "bg-amber-50 text-amber-700 border-amber-200",
  picked: "bg-blue-50 text-blue-700 border-blue-200",
  in_transit: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_ICON = {
  created: <Package size={11} />,
  assigned: <User size={11} />,
  picked: <Truck size={11} />,
  in_transit: <Truck size={11} />,
  delivered: <CheckCircle2 size={11} />,
  cancelled: <AlertCircle size={11} />,
};

/* ── Star rating row ─────────────────────────────────────────── */
const RatingStars = ({ rating, size = 10 }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < full
              ? "text-amber-400 fill-amber-400"
              : i === full && half
                ? "text-amber-300 fill-amber-200"
                : "text-gray-200"
          }
        />
      ))}
      <span className="text-[9px] font-black text-gray-400 ml-1">{rating?.toFixed(1)}</span>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────── */
export default function AgentLeaderboard({ data = [] }) {
  const [modal, setModal] = useState(null);   // full agent object from API
  const [loading, setLoading] = useState(false);

  const openModal = async (agentId) => {
    setLoading(true);
    setModal("loading");
    try {
      const full = await agentService.getAgentById(agentId);
      setModal(full);
    } catch {
      setModal(null);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setModal(null);

  /* leaderboard row data enriched from analytics */
  const leaderMap = Object.fromEntries(data.map(a => [a.agent_id, a]));

  return (
    <>
      {/* ── LEADERBOARD CARD ─────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" /> Agent Leaderboard
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
              Click an agent to view full profile
            </p>
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Top {data.length}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-300 font-black text-xs uppercase tracking-widest">
            No deliveries in this period
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="space-y-2">
              {data.map((agent) => {
                const medal = MEDAL[agent.rank];
                const isTop3 = agent.rank <= 3;
                return (
                  <div
                    key={agent.agent_id}
                    onClick={() => openModal(agent.agent_id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${isTop3
                        ? `${medal.bg} ${medal.border} border`
                        : "bg-gray-50/50 border border-gray-100 hover:bg-white"
                      }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm flex-shrink-0 ${isTop3 ? `${medal.text} text-lg` : "text-gray-400 text-xs"
                      }`}>
                      {isTop3 ? medal.emoji : `#${agent.rank}`}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-sm truncate">{agent.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${agent.availability_status === "available"
                            ? "bg-green-100 text-green-600"
                            : agent.availability_status === "busy"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                          {agent.availability_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={9} className="text-gray-400 flex-shrink-0" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase truncate">{agent.city}</span>
                      </div>
                      <RatingStars rating={agent.rating} />
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black text-blue-600">
                        {agent.delivered_count}
                        <span className="text-[10px] text-gray-400 font-bold ml-0.5">del</span>
                      </div>
                      <div className={`text-[10px] font-black flex items-center justify-end gap-1 ${agent.on_time_rate >= 80 ? "text-emerald-500" : "text-rose-500"
                        }`}>
                        {agent.on_time_rate >= 80 ? <TrendingUp size={9} /> : <AlertTriangle size={9} />}
                        {agent.on_time_rate}% on-time
                      </div>
                      {agent.delayed_count > 0 && (
                        <div className="text-[9px] text-rose-400 font-bold">{agent.delayed_count} delayed</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── AGENT DETAIL MODAL ───────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="relative bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
                  {modal === "loading" ? "…" : modal.name?.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200 mb-0.5">Agent Profile</div>
                  <h2 className="text-xl font-black">{modal === "loading" ? "Loading…" : modal.name}</h2>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            {modal === "loading" ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 size={40} className="animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden divide-x divide-gray-100">

                {/* ── LEFT: Personal details + performance ── */}
                <div className="w-72 flex-shrink-0 overflow-y-auto p-7 space-y-6 bg-white">
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-2 ${modal.availability_status === "available"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : modal.availability_status === "busy"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                      {modal.availability_status}
                    </span>
                  </div>

                  {/* Contact */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3">Contact</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Mail size={13} className="text-blue-500" />
                        </div>
                        <span className="text-gray-700 font-medium truncate">{modal.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Phone size={13} className="text-blue-500" />
                        </div>
                        <span className="text-gray-700 font-medium">{modal.phone}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <MapPin size={13} className="text-blue-500" />
                        </div>
                        <span className="text-gray-700 font-medium">{modal.city} · {modal.subregion}</span>
                      </div>
                    </div>
                  </section>

                  {/* Rating */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3">Rating</h3>
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                      <div className="text-4xl font-black text-amber-600 mb-1">{parseFloat(modal.rating || 0).toFixed(1)}</div>
                      <RatingStars rating={parseFloat(modal.rating || 0)} size={14} />
                    </div>
                  </section>

                  {/* Performance from leaderboard data */}
                  {leaderMap[modal.id] && (
                    <section>
                      <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3">Performance</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold text-gray-500">Delivered</span>
                          <span className="text-sm font-black text-blue-600">{leaderMap[modal.id].delivered_count}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold text-gray-500">Delayed</span>
                          <span className="text-sm font-black text-rose-500">{leaderMap[modal.id].delayed_count}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold text-gray-500">On-Time Rate</span>
                          <span className={`text-sm font-black ${leaderMap[modal.id].on_time_rate >= 80 ? "text-emerald-600" : "text-rose-500"}`}>
                            {leaderMap[modal.id].on_time_rate}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <span className="text-xs font-bold text-gray-500">Leaderboard Rank</span>
                          <span className="text-sm font-black text-amber-600">
                            {MEDAL[leaderMap[modal.id].rank]?.emoji || `#${leaderMap[modal.id].rank}`}
                          </span>
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                {/* ── RIGHT: Shipment deliveries ── */}
                <div className="flex-1 overflow-y-auto p-7 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-gray-700 flex items-center gap-2">
                      <Activity size={15} className="text-blue-500" /> Shipments
                    </h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {(modal.Shipments || []).length} total
                    </span>
                  </div>

                  {(modal.Shipments || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                        <Package size={24} className="text-gray-300" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-300">No shipments assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Active first, then completed */}
                      {[...modal.Shipments]
                        .sort((a, b) => {
                          const order = { in_transit: 0, picked: 1, assigned: 2, created: 3, delivered: 4, cancelled: 5 };
                          return (order[a.status] ?? 9) - (order[b.status] ?? 9);
                        })
                        .map(ship => (
                          <div key={ship.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <div className="font-black text-blue-600 text-sm tracking-wide">{ship.shipment_code}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                  {ship.pickup_city} → {ship.delivery_city}
                                </div>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider flex items-center gap-1 flex-shrink-0 ${STATUS_STYLE[ship.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                {STATUS_ICON[ship.status]}
                                {ship.status?.replace("_", " ")}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-gray-50 rounded-xl p-2 text-center">
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Type</div>
                                <div className="text-xs font-black text-gray-700 mt-0.5 capitalize">{ship.package_type}</div>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-2 text-center">
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Weight</div>
                                <div className="text-xs font-black text-gray-700 mt-0.5">{ship.weight_kg} kg</div>
                              </div>
                              <div className={`rounded-xl p-2 text-center ${ship.is_delayed ? "bg-rose-50" : "bg-emerald-50"}`}>
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Delay</div>
                                <div className={`text-xs font-black mt-0.5 ${ship.is_delayed ? "text-rose-600" : "text-emerald-600"}`}>
                                  {ship.is_delayed ? "Yes" : "No"}
                                </div>
                              </div>
                            </div>

                            {ship.expected_delivery_at && (
                              <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-gray-400 font-bold">
                                <Clock size={10} />
                                ETA: {new Date(ship.expected_delivery_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
