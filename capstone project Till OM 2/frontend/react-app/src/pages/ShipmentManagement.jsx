import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import * as shipmentService from "../services/shipmentService";
import * as agentService from "../services/agentService";
import * as locationService from "../services/locationService";
import Pagination from "../components/ui/Pagination";
import CustomSelect from "../components/ui/CustomSelect";
import BulkConflictModal from "../components/modals/BulkConflictModal";

import {
  Box,
  Search,
  Trash2,
  Users,
  UserPlus,
  Upload,
  FileText,
  Info,
  X,
  Map,
  Truck,
  Loader2,
  RotateCcw,
  Activity,
  Clock,
  Edit2,
  Filter,
  AlertTriangle,
  Tag,
  CheckCircle2,
  Package,
  ArrowRight,
  AlertCircle,
  MapPin,
  RotateCw,
  Scale,
  Navigation,
  ArrowUpDown,
} from "lucide-react";

const LIMIT = 10;

const FSM = {
  created: ["created", "assigned", "cancelled"],
  assigned: ["assigned", "picked", "cancelled", "created"],
  picked: ["picked", "in_transit"],
  in_transit: ["in_transit", "delivered"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

const STATUS_OPTIONS = [
  "",
  "created",
  "assigned",
  "picked",
  "in_transit",
  "delivered",
  "cancelled",
];

const STATUS_STYLES = {
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_transit: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200 cursor-not-allowed",
  assigned: "bg-amber-50 text-amber-700 border-amber-200",
  picked: "bg-indigo-50 text-indigo-700 border-indigo-200",
  created: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ShipmentManagement() {
  const [searchParams] = useSearchParams();
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") || "",
  );
  const [sortBy, setSortBy] = useState("-createdAt");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [delayedFilter, setDelayedFilter] = useState(false);
  const [tagFilter, setTagFilter] = useState("");

  // Modals / Drawers
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipmentHistory, setShipmentHistory] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Advanced Filters
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [fPCity, setFPCity] = useState("");
  const [fPSub, setFPSub] = useState("");
  const [fDCity, setFDCity] = useState("");
  const [fDSub, setFDSub] = useState("");
  const [fPkg, setFPkg] = useState("");
  const [fWeightMin, setFWeightMin] = useState("");
  const [fWeightMax, setFWeightMax] = useState("");
  const [fDistMin, setFDistMin] = useState("");
  const [fDistMax, setFDistMax] = useState("");
  const [fExpDate, setFExpDate] = useState("");

  // Lifecycle Modal (opened by clicking status badge)
  const [lifecycleShipment, setLifecycleShipment] = useState(null);
  const [lifecycleHistory, setLifecycleHistory] = useState([]);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);

  // Manual Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetId, setAssignTargetId] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isAgentsLoading, setIsAgentsLoading] = useState(false);

  // Edit Details Modal
  const [editTarget, setEditTarget] = useState(null); // shipment being edited
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Master Locations for dropdowns
  const [masterLocations, setMasterLocations] = useState([]);

  useEffect(() => {
    locationService
      .getLocations({ limit: 1000 })
      .then((res) => setMasterLocations(res.locations || []))
      .catch(console.error);
  }, []);

  const uniqueCities = [...new Set(masterLocations.map((l) => l.city))];

  // ─── LOAD ─────────────────────────────────────────────────────────────────
  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: LIMIT, sort: sortBy };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (delayedFilter) params.is_delayed = "true";
      if (tagFilter) params.tags = tagFilter;

      // Advanced filters mapping to APIFeatures bracket notation
      if (fPCity) params.pickup_city = fPCity;
      if (fPSub) params.pickup_subregion = fPSub;
      if (fDCity) params.delivery_city = fDCity;
      if (fDSub) params.delivery_subregion = fDSub;
      if (fPkg) params.package_type = fPkg;

      if (fWeightMin) params["weight_kg[gte]"] = fWeightMin;
      if (fWeightMax) params["weight_kg[lte]"] = fWeightMax;

      if (fDistMin) params["estimated_distance_km[gte]"] = fDistMin;
      if (fDistMax) params["estimated_distance_km[lte]"] = fDistMax;

      if (fExpDate) {
        // Exact day matchmaking (Start of day to end of day)
        const start = new Date(fExpDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(fExpDate);
        end.setHours(23, 59, 59, 999);
        params["expected_delivery_at[gte]"] = start.toISOString();
        params["expected_delivery_at[lte]"] = end.toISOString();
      }

      const { shipments: data, results } =
        await shipmentService.getShipments(params);
      setShipments(data || []);
      setTotal(results || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    searchTerm,
    sortBy,
    statusFilter,
    delayedFilter,
    tagFilter,
    fPCity,
    fPSub,
    fDCity,
    fDSub,
    fPkg,
    fWeightMin,
    fWeightMax,
    fDistMin,
    fDistMax,
    fExpDate,
  ]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncRules = async () => {
    try {
      setIsSyncing(true);
      await shipmentService.syncRules();
      await loadShipments();
    } catch (err) {
      alert("Rule synchronization failed. Please check backend logs.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadShipments, 400);
    return () => clearTimeout(timer);
  }, [loadShipments]);

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    statusFilter,
    delayedFilter,
    tagFilter,
    fPCity,
    fPSub,
    fDCity,
    fDSub,
    fPkg,
    fWeightMin,
    fWeightMax,
    fDistMin,
    fDistMax,
    fExpDate,
    sortBy,
  ]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortBy(`-${field}`);
    else if (sortBy === `-${field}`) setSortBy("-createdAt");
    else setSortBy(field);
  };

  const resetFilters = () => {
    setFPCity("");
    setFPSub("");
    setFDCity("");
    setFDSub("");
    setFPkg("");
    setFWeightMin("");
    setFWeightMax("");
    setFDistMin("");
    setFDistMax("");
    setFExpDate("");
    setSearchTerm("");
    setStatusFilter("");
    setDelayedFilter(false);
    setTagFilter("");
    setSortBy("-createdAt");
  };

  const activeFilterCount = [
    statusFilter,
    delayedFilter,
    tagFilter,
    fPCity,
    fPSub,
    fDCity,
    fDSub,
    fPkg,
    fWeightMin,
    fWeightMax,
    fDistMin,
    fDistMax,
    fExpDate,
  ].filter(Boolean).length;

  const getSubregions = (city) => {
    return [
      ...new Set(
        masterLocations.filter((l) => l.city === city).map((l) => l.subregion),
      ),
    ];
  };

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await shipmentService.updateShipmentStatus(id, { status: newStatus });
      loadShipments();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Status update failed. Check FSM constraints.",
      );
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to cancel/delete this shipment?")
    )
      return;
    try {
      await shipmentService.deleteShipment(id);
      loadShipments();
    } catch (err) {
      alert(err.response?.data?.message || "Deletion failed.");
    }
  };

  const handleRestore = async (id) => {
    try {
      await shipmentService.restoreShipment(id);
      loadShipments();
    } catch (err) {
      alert(err.response?.data?.message || "Restore failed.");
    }
  };

  const handleBulkUpload = async (e, overwrite = false) => {
    const file = overwrite ? pendingFile : e.target.files[0];
    if (!file) return;

    if (!overwrite) {
      setPendingFile(file);
    }

    try {
      const response = await shipmentService.bulkUploadShipments(
        file,
        overwrite,
      );
      if (response.status === "CONFLICT") {
        setConflicts(response.conflicts);
        setIsConflictModalOpen(true);
        setIsBulkModalOpen(false);
      } else {
        setIsBulkModalOpen(false);
        setIsConflictModalOpen(false);
        setPendingFile(null);
        loadShipments();
        alert(
          `Bulk upload successful! ${response.created || 0} shipments created, ${response.updated || 0} updated.`,
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  const viewDetails = async (id) => {
    try {
      setIsDetailLoading(true);
      setSelectedShipment(null);
      const data = await shipmentService.getShipmentById(id);
      const historyData = await shipmentService.getShipmentHistory(id);
      setSelectedShipment(data);
      setShipmentHistory(historyData);
    } catch (err) {
      alert("Could not fetch details");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Open the shipment lifecycle modal
  const openLifecycle = async (shipment) => {
    setLifecycleShipment(shipment);
    setLifecycleHistory([]);
    setLifecycleLoading(true);
    try {
      const history = await shipmentService.getShipmentHistory(shipment.id);
      setLifecycleHistory(history || []);
    } catch (err) {
      console.error("Failed to fetch shipment history:", err);
    } finally {
      setLifecycleLoading(false);
    }
  };

  const closeLifecycle = () => {
    setLifecycleShipment(null);
    setLifecycleHistory([]);
    setLifecycleLoading(false);
  };

  const openEdit = (shipment) => {
    setEditTarget(shipment);
    setEditForm({
      pickup_city: shipment.pickup_city || "",
      pickup_subregion: shipment.pickup_subregion || "",
      delivery_city: shipment.delivery_city || "",
      delivery_subregion: shipment.delivery_subregion || "",
      package_type: shipment.package_type || "small",
      weight_kg: shipment.weight_kg || "",
    });
  };

  const openAssignModal = async (shipmentId) => {
    setAssignTargetId(shipmentId);
    setIsAssignModalOpen(true);
    setIsAgentsLoading(true);
    try {
      const { agents } = await agentService.getAgents({ limit: 200 });
      setAvailableAgents(
        (agents || []).filter((a) => a.availability_status === "available"),
      );
    } catch (err) {
      alert("Failed to load agents.");
    } finally {
      setIsAgentsLoading(false);
    }
  };

  const handleManualAssign = async (agentId) => {
    try {
      await agentService.assignAgent(assignTargetId, agentId);
      setIsAssignModalOpen(false);
      setAssignTargetId(null);
      loadShipments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign agent manually.");
    }
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    try {
      setEditSaving(true);
      await shipmentService.updateShipmentDetails(editTarget.id, {
        ...editForm,
        weight_kg: parseFloat(editForm.weight_kg),
      });
      setEditTarget(null);
      loadShipments();
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to update shipment details.",
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleBulkAutoAssign = async () => {
    if (
      !window.confirm(
        "This will auto-assign the best available agent to every unassigned shipment. Proceed?",
      )
    )
      return;
    try {
      setIsAssigning(true);
      const result = await shipmentService.bulkAutoAssign();
      alert(
        ` Done! ${result.data.assigned} shipments assigned, ${result.data.skipped} skipped (no agent capacity in their city).`,
      );
      loadShipments();
    } catch (err) {
      alert(err.response?.data?.message || "Bulk assign failed.");
    } finally {
      setIsAssigning(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 min-h-screen font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[50px] right-[-50px] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-[40%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 sm:gap-3">
              <Box className="text-indigo-600" size={24} /> Shipment Hub
            </h1>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">
              Track and manage active parcels and intelligent routes (FSM
              Active).
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleBulkAutoAssign}
              disabled={isAssigning}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-sm hover:bg-black disabled:opacity-60 transition-all font-black uppercase text-xs tracking-widest flex-1 sm:flex-initial justify-center"
            >
              {isAssigning ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Truck size={16} />
              )}
              {isAssigning ? "Assigning..." : "Assign All"}
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="admin-secondary-btn py-3 px-5 shadow-sm flex-1 sm:flex-initial justify-center flex items-center gap-2"
            >
              <Upload size={14} /> Batch Import
            </button>
          </div>
        </div>

        {/* REVAMPED FILTER BAR */}
        <div className="relative z-20 space-y-4 mb-6">
          <div className="admin-minimal-card p-4 sm:p-5 flex flex-wrap gap-3 sm:gap-4 items-center">
            {/* Text search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by code, customer, agent..."
                maxLength={100}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-indigo-400 outline-none text-xs sm:text-sm font-medium transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sync Rules Button */}
            <button
              onClick={handleSyncRules}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                isSyncing
                  ? "bg-slate-50 text-slate-400 border-slate-100 italic"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
              title="Re-evaluate all rules across shipments"
            >
              <RotateCw size={14} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing..." : "Sync Rules"}
            </button>

            {/* Quick Status toggle */}
            <CustomSelect
              className="bg-gray-50 border-none rounded-xl text-xs sm:text-sm font-bold text-gray-700 w-52 sm:w-60"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Status"
              options={[
                { value: "", label: "Status" },
                ...STATUS_OPTIONS.filter(Boolean).map((s) => ({
                  value: s,
                  label: s.replace("_", " ").toUpperCase(),
                })),
              ]}
            />

            {/* Quick Sort Controls */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100/30">
              <button
                onClick={() => toggleSort("weight_kg")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy.includes("weight_kg")
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
                title="Toggle Weight Sort"
              >
                <Scale size={12} />
                <span className="hidden sm:inline">Weight</span>
                {sortBy === "weight_kg" && "↑"}
                {sortBy === "-weight_kg" && "↓"}
              </button>
              <button
                onClick={() => toggleSort("estimated_distance_km")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy.includes("estimated_distance_km")
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
                title="Toggle Distance Sort"
              >
                <Navigation size={12} />
                <span className="hidden sm:inline">KM</span>
                {sortBy === "estimated_distance_km" && "↑"}
                {sortBy === "-estimated_distance_km" && "↓"}
              </button>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest border transition-all ${
                isFiltersOpen || activeFilterCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                  : "bg-white text-gray-600 border-gray-100 hover:border-indigo-200"
              }`}
            >
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[10px] font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                title="Reset all filters"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {/* ADVANCED FILTERS PANEL */}
          {isFiltersOpen && (
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white shadow-2xl p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in slide-in-from-top-4 duration-300">
              {/* Pickup Geography */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <MapPin size={12} className="text-indigo-400" /> Pickup Origin
                </h4>
                <div className="space-y-2">
                  <CustomSelect
                    className="w-full bg-gray-50/50 border-gray-100"
                    value={fPCity}
                    onChange={(e) => {
                      setFPCity(e.target.value);
                      setFPSub("");
                    }}
                    placeholder="Select City"
                    options={[
                      { value: "", label: "ALL CITIES" },
                      ...uniqueCities.map((c) => ({
                        value: c,
                        label: c.toUpperCase(),
                      })),
                    ]}
                  />
                  <CustomSelect
                    className="w-full bg-gray-50/50 border-gray-100"
                    value={fPSub}
                    onChange={(e) => setFPSub(e.target.value)}
                    placeholder="Select Subregion"
                    disabled={!fPCity}
                    options={[
                      { value: "", label: "ALL SUBREGIONS" },
                      ...getSubregions(fPCity).map((s) => ({
                        value: s,
                        label: s.toUpperCase(),
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* Delivery Geography */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Map size={12} className="text-blue-400" /> Destination
                </h4>
                <div className="space-y-2">
                  <CustomSelect
                    className="w-full bg-gray-50/50 border-gray-100"
                    value={fDCity}
                    onChange={(e) => {
                      setFDCity(e.target.value);
                      setFDSub("");
                    }}
                    placeholder="Select City"
                    options={[
                      { value: "", label: "ALL CITIES" },
                      ...uniqueCities.map((c) => ({
                        value: c,
                        label: c.toUpperCase(),
                      })),
                    ]}
                  />
                  <CustomSelect
                    className="w-full bg-gray-50/50 border-gray-100"
                    value={fDSub}
                    onChange={(e) => setFDSub(e.target.value)}
                    placeholder="Select Subregion"
                    disabled={!fDCity}
                    options={[
                      { value: "", label: "ALL SUBREGIONS" },
                      ...getSubregions(fDCity).map((s) => ({
                        value: s,
                        label: s.toUpperCase(),
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* Package & Logistics */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Package size={12} className="text-purple-400" /> Package
                  Details
                </h4>
                <div className="space-y-2">
                  <CustomSelect
                    className="w-full bg-gray-50/50 border-gray-100"
                    value={fPkg}
                    onChange={(e) => setFPkg(e.target.value)}
                    placeholder="Package Type"
                    options={[
                      { value: "", label: "ALL TYPES" },
                      { value: "small", label: "SMALL" },
                      { value: "medium", label: "MEDIUM" },
                      { value: "large", label: "LARGE" },
                    ]}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min Kg"
                      className="w-1/2 p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      value={fWeightMin}
                      onChange={(e) => setFWeightMin(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Max Kg"
                      className="w-1/2 p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      value={fWeightMax}
                      onChange={(e) => setFWeightMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Ranges */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Activity size={12} className="text-emerald-400" />{" "}
                  Constraints
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min KM"
                      className="w-1/2 p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      value={fDistMin}
                      onChange={(e) => setFDistMin(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Max KM"
                      className="w-1/2 p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      value={fDistMax}
                      onChange={(e) => setFDistMax(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400 uppercase"
                      value={fExpDate}
                      onChange={(e) => setFExpDate(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-black text-gray-300 tracking-tighter uppercase">
                      ETA MATCH
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Toggles */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4 pt-4 border-t border-gray-100 flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setDelayedFilter(!delayedFilter)}
                    className={`w-10 h-5 rounded-full transition-all relative ${delayedFilter ? "bg-rose-500" : "bg-gray-200"}`}
                  >
                    <div
                      className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${delayedFilter ? "left-6" : "left-1"}`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-700">
                    Delayed Shipments Only
                  </span>
                </label>

                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <Tag size={12} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by rule tag..."
                    className="flex-1 bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-700 focus:ring-0 outline-none p-0"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TABLE CARD */}
        <div className="admin-minimal-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                  <th className="py-5 px-4 sm:px-8">Tracking Info</th>
                  <th className="py-5 px-4 sm:px-6">Route</th>
                  <th className="py-5 px-4 sm:px-6">Agent</th>
                  <th className="py-5 px-4 sm:px-6 text-center">Tags</th>
                  <th className="py-5 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-5 px-4 sm:px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shipments.map((shipment) => {
                  const allowed = FSM[shipment.status] || [shipment.status];
                  const isFinal =
                    shipment.status === "delivered" ||
                    shipment.status === "cancelled";
                  return (
                    <tr
                      key={shipment.id}
                      className={`hover:bg-slate-50/50 transition-colors group ${shipment.deletedAt ? "opacity-50" : ""}`}
                    >
                      {/* Tracking */}
                      <td className="py-4 px-8">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          {shipment.shipment_code}
                          {shipment.is_delayed && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                              title={
                                shipment.delay_reason || "Flagged as delayed"
                              }
                            ></span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                          {shipment.User?.full_name || "System User"}
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1.5 text-gray-700 font-semibold">
                            <Map size={13} className="text-gray-400" />{" "}
                            {shipment.pickup_city}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                            <Truck size={13} className="text-gray-400" />{" "}
                            {shipment.delivery_city}
                          </span>
                        </div>
                      </td>
                      {/* Agent */}
                      <td className="py-4 px-6">
                        {shipment.Agent ? (
                          <div>
                            <div className="text-gray-700 font-bold text-sm">
                              {shipment.Agent.name}
                            </div>
                            <div className="text-[10px] text-indigo-500 uppercase tracking-wider font-bold">
                              {shipment.current_subregion
                                ? `${shipment.current_city}, ${shipment.current_subregion}`
                                : shipment.Agent.subregion}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic font-bold">
                            Unassigned
                          </span>
                        )}
                      </td>
                      {/* Tags */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-[140px]">
                          {shipment.tags && shipment.tags.length > 0 ? (
                            shipment.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tight"
                              >
                                {tag.replace(/_/g, " ")}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-300 text-[10px] font-bold italic">
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status — clickable badge opens lifecycle modal; FSM change via select in actions */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => openLifecycle(shipment)}
                          className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border cursor-pointer transition-all hover:border-slate-300 ${STATUS_STYLES[shipment.status] || "bg-slate-50 text-slate-500 border-slate-100"}`}
                        >
                          {shipment.status.replace("_", " ")}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-8 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {/* FSM status change — compact select */}
                          {!isFinal && !shipment.deletedAt && (
                            <CustomSelect
                              value={shipment.status}
                              onChange={(e) =>
                                handleUpdateStatus(shipment.id, e.target.value)
                              }
                              className="text-[10px] uppercase font-black tracking-wider py-1.5 px-3 min-w-[130px] rounded-lg border-slate-200 shadow-none bg-slate-50 text-slate-600 hover:border-indigo-300"
                              options={Object.keys(FSM).map((s) => ({
                                value: s,
                                label: s.replace("_", " "),
                                disabled: !allowed.includes(s),
                              }))}
                            />
                          )}
                          <button
                            onClick={() => viewDetails(shipment.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"
                          >
                            <Info size={16} />
                          </button>
                          {!shipment.Agent &&
                            !isFinal &&
                            !shipment.deletedAt && (
                              <button
                                onClick={() => openAssignModal(shipment.id)}
                                className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"
                              >
                                <UserPlus size={16} />
                              </button>
                            )}
                          {!isFinal && !shipment.deletedAt && (
                            <button
                              onClick={() => openEdit(shipment)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {!shipment.deletedAt ? (
                            <button
                              onClick={() => handleDelete(shipment.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(shipment.id)}
                              className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {shipments.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-sm"
                    >
                      No Shipments Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ─── BULK IMPORT MODAL ──────────────────────────────────────────────── */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center relative">
            <button
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X />
            </button>
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
              <Upload size={32} />
            </div>
            <h2 className="text-2xl font-black mb-2">Excel Import</h2>
            <p className="text-gray-500 mb-8 font-medium">
              Upload your manifest to sync shipments in bulk.
            </p>
            <label className="block w-full cursor-pointer group">
              <div className="border-2 border-dashed border-gray-200 rounded-[2.5rem] p-8 group-hover:border-indigo-400 group-hover:bg-indigo-50/50 transition-all">
                <FileText
                  className="mx-auto mb-4 text-gray-300 group-hover:text-indigo-500"
                  size={40}
                />
                <span className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 uppercase tracking-widest">
                  Select .xlsx file
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx"
                  onChange={handleBulkUpload}
                />
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ─── EDIT DETAILS MODAL ─────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-8 py-6 bg-gray-50/60 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Edit2 size={18} className="text-indigo-600" /> Edit Shipment
                  Details
                </h2>
                <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                  {editTarget.shipment_code} — ETA will recalculate
                  automatically
                </p>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    Pickup City
                  </label>
                  <CustomSelect
                    className="w-full border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-none bg-white"
                    value={editForm.pickup_city || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        pickup_city: e.target.value,
                        pickup_subregion: "",
                      }))
                    }
                    placeholder="Select City"
                    options={[
                      ...(!uniqueCities.includes(editForm.pickup_city) &&
                      editForm.pickup_city
                        ? [
                            {
                              value: editForm.pickup_city,
                              label: editForm.pickup_city,
                            },
                          ]
                        : []),
                      ...uniqueCities.map((city) => ({
                        value: city,
                        label: city,
                      })),
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    Pickup Subregion
                  </label>
                  <CustomSelect
                    disabled={!editForm.pickup_city}
                    className="w-full border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-none bg-white opacity-100"
                    value={editForm.pickup_subregion || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        pickup_subregion: e.target.value,
                      }))
                    }
                    placeholder="Select Subregion"
                    options={[
                      ...(!masterLocations.find(
                        (l) =>
                          l.city === editForm.pickup_city &&
                          l.subregion === editForm.pickup_subregion,
                      ) && editForm.pickup_subregion
                        ? [
                            {
                              value: editForm.pickup_subregion,
                              label: editForm.pickup_subregion,
                            },
                          ]
                        : []),
                      ...masterLocations
                        .filter((loc) => loc.city === editForm.pickup_city)
                        .map((loc) => ({
                          value: loc.subregion,
                          label: loc.subregion,
                        })),
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    Delivery City
                  </label>
                  <CustomSelect
                    className="w-full border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-none bg-white"
                    value={editForm.delivery_city || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        delivery_city: e.target.value,
                        delivery_subregion: "",
                      }))
                    }
                    placeholder="Select City"
                    options={[
                      ...(!uniqueCities.includes(editForm.delivery_city) &&
                      editForm.delivery_city
                        ? [
                            {
                              value: editForm.delivery_city,
                              label: editForm.delivery_city,
                            },
                          ]
                        : []),
                      ...uniqueCities.map((city) => ({
                        value: city,
                        label: city,
                      })),
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    Delivery Subregion
                  </label>
                  <CustomSelect
                    disabled={!editForm.delivery_city}
                    className="w-full border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-none bg-white opacity-100"
                    value={editForm.delivery_subregion || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        delivery_subregion: e.target.value,
                      }))
                    }
                    placeholder="Select Subregion"
                    options={[
                      ...(!masterLocations.find(
                        (l) =>
                          l.city === editForm.delivery_city &&
                          l.subregion === editForm.delivery_subregion,
                      ) && editForm.delivery_subregion
                        ? [
                            {
                              value: editForm.delivery_subregion,
                              label: editForm.delivery_subregion,
                            },
                          ]
                        : []),
                      ...masterLocations
                        .filter((loc) => loc.city === editForm.delivery_city)
                        .map((loc) => ({
                          value: loc.subregion,
                          label: loc.subregion,
                        })),
                    ]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    Package Type
                  </label>
                  <CustomSelect
                    className="w-full border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-none bg-white"
                    value={editForm.package_type}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        package_type: e.target.value,
                      }))
                    }
                    options={[
                      { value: "small", label: "Small" },
                      { value: "medium", label: "Medium" },
                      { value: "large", label: "Large" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={editForm.weight_kg}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, weight_kg: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-3 border-2 border-gray-100 text-gray-500 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {editSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save & Recalculate ETA"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANUAL ASSIGN MODAL ────────────────────────────────────────────── */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[80vh]">
            <div className="px-8 py-6 bg-gray-50/60 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <UserPlus size={18} className="text-emerald-600" /> Manual
                  Assignment
                </h2>
                <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                  Select an available agent
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {isAgentsLoading ? (
                <div className="py-10 flex justify-center">
                  <Loader2
                    size={30}
                    className="animate-spin text-emerald-500"
                  />
                </div>
              ) : availableAgents.length === 0 ? (
                <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                  No available agents
                </div>
              ) : (
                availableAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex justify-between items-center p-4 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-200 group"
                  >
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {agent.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {agent.city} - {agent.subregion}
                      </div>
                    </div>
                    <button
                      onClick={() => handleManualAssign(agent.id)}
                      className="px-4 py-2 bg-white text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SHIPMENT DETAIL DRAWER ──────────────────────────────────────────── */}
      {(selectedShipment || isDetailLoading) && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setSelectedShipment(null)}
          ></div>
          <div className="relative w-full max-w-[500px] bg-white h-full shadow-2xl p-10 flex flex-col overflow-y-auto">
            <button
              onClick={() => {
                setSelectedShipment(null);
                setIsDetailLoading(false);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"
            >
              <X size={26} />
            </button>

            {isDetailLoading || !selectedShipment ? (
              <div className="flex-1 flex justify-center items-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-6 pt-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                      <Box size={30} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">
                        {selectedShipment.shipment_code}
                      </h2>
                      <div className="text-sm text-gray-400 font-bold">
                        {selectedShipment.User?.full_name || "System User"} ·{" "}
                        {selectedShipment.User?.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span
                      className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${STATUS_STYLES[selectedShipment.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}
                    >
                      {selectedShipment.status?.replace("_", " ")}
                    </span>
                    <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                      <Clock size={12} /> ETA: {selectedShipment.eta_hours}h
                    </span>
                    {selectedShipment.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-purple-50 text-purple-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-purple-100"
                      >
                        #{tag.replace(/_/g, " ")}
                      </span>
                    ))}
                    {selectedShipment.is_delayed && (
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-rose-100">
                        Delayed
                      </span>
                    )}
                  </div>

                  {selectedShipment.delay_reason && (
                    <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold italic border border-rose-100">
                      {selectedShipment.delay_reason}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Route */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Map size={13} /> Routing Details
                    </h3>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                          Origin
                        </span>
                        <span className="font-bold text-gray-900">
                          {selectedShipment.pickup_city} ·{" "}
                          {selectedShipment.pickup_subregion}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                          Destination
                        </span>
                        <span className="font-bold text-gray-900">
                          {selectedShipment.delivery_city} ·{" "}
                          {selectedShipment.delivery_subregion}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                          Distance
                        </span>
                        <span className="font-bold text-gray-900">
                          {selectedShipment.estimated_distance_km} km
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Payload */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Box size={13} /> Payload & Timeframes
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                          Type
                        </div>
                        <div className="font-black text-gray-900 capitalize">
                          {selectedShipment.package_type}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                          Weight
                        </div>
                        <div className="font-black text-gray-900">
                          {selectedShipment.weight_kg} kg
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">
                          Expected Drop
                        </span>
                        <span className="font-bold text-gray-900">
                          {new Date(
                            selectedShipment.expected_delivery_at ||
                              selectedShipment.expected_delivery_date,
                          ).toLocaleString()}
                        </span>
                      </div>
                      {selectedShipment.actual_delivery_date && (
                        <div className="flex justify-between text-xs border-t border-gray-200 pt-2">
                          <span className="text-gray-400 font-bold uppercase tracking-widest">
                            Actual Drop
                          </span>
                          <span className="font-bold text-emerald-600">
                            {new Date(
                              selectedShipment.actual_delivery_date,
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Agent */}
                  {selectedShipment.Agent && (
                    <section>
                      <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Truck size={13} /> Assigned Agent
                      </h3>
                      <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                        <div className="font-black text-indigo-900">
                          {selectedShipment.Agent.name}
                        </div>
                        <div className="text-xs text-indigo-600 font-bold mt-1">
                          {selectedShipment.Agent.subregion} ·{" "}
                          {selectedShipment.Agent.phone}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* History */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Activity size={13} /> Status Event Log
                    </h3>
                    <div className="space-y-4 border-l-2 border-gray-100 ml-2 pl-4 pb-2">
                      {shipmentHistory.map((history, idx) => (
                        <div key={history.id} className="relative">
                          <div
                            className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 ${idx === 0 ? "bg-indigo-500 border-white ring-2 ring-indigo-100" : "bg-gray-300 border-white"}`}
                          ></div>
                          <div className="text-xs font-black uppercase tracking-widest text-gray-700">
                            {history.new_status?.replace("_", " ")}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                            {new Date(history.createdAt).toLocaleString()}
                          </div>
                          {history.notes && (
                            <div className="text-[11px] text-gray-500 mt-1.5 bg-gray-50 p-2 rounded-xl italic font-medium">
                              "{history.notes}"
                            </div>
                          )}
                        </div>
                      ))}
                      {shipmentHistory.length === 0 && (
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          No events recorded
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── SHIPMENT LIFECYCLE MODAL ────────────────────────────────────────── */}
      {lifecycleShipment && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
          onClick={closeLifecycle}
        >
          <div
            className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-start justify-between gap-4 flex-shrink-0">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-200 mb-1">
                  Shipment Lifecycle
                </div>
                <h2 className="text-xl font-black tracking-tight">
                  {lifecycleShipment.shipment_code}
                </h2>
                <div className="text-xs text-indigo-200 font-bold mt-1">
                  {lifecycleShipment.pickup_city} →{" "}
                  {lifecycleShipment.delivery_city}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={closeLifecycle}
                  className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X size={18} />
                </button>
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-2 ${STATUS_STYLES[lifecycleShipment.status] || "bg-white/20 text-white border-white/30"}`}
                >
                  {lifecycleShipment.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Shipment meta strip */}
            <div className="px-8 py-4 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap gap-4 text-xs font-bold text-indigo-700 flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <Package size={12} className="text-indigo-400" />
                {lifecycleShipment.package_type?.toUpperCase()} ·{" "}
                {lifecycleShipment.weight_kg} kg
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-indigo-400" />
                ETA: {lifecycleShipment.eta_hours}h
              </span>
              {lifecycleShipment.Agent && (
                <span className="flex items-center gap-1.5">
                  <Truck size={12} className="text-indigo-400" />
                  {lifecycleShipment.Agent.name}
                </span>
              )}
              {lifecycleShipment.is_delayed && (
                <span className="flex items-center gap-1.5 text-rose-600">
                  <AlertTriangle size={12} /> Delayed
                </span>
              )}
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {lifecycleLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 size={36} className="animate-spin text-indigo-400" />
                </div>
              ) : lifecycleHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Activity size={24} className="text-gray-300" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-300">
                    No status transitions recorded yet
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1 font-medium">
                    This shipment was just created
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-100 to-gray-100 rounded-full" />

                  <div className="space-y-6">
                    {lifecycleHistory.map((event, idx) => {
                      const isLast = idx === lifecycleHistory.length - 1;
                      const statusColorMap = {
                        created: {
                          dot: "bg-gray-400",
                          ring: "ring-gray-100",
                          label: "bg-gray-100 text-gray-600 border-gray-200",
                          icon: "📦",
                        },
                        assigned: {
                          dot: "bg-amber-400",
                          ring: "ring-amber-100",
                          label: "bg-amber-50 text-amber-700 border-amber-200",
                          icon: "👤",
                        },
                        picked: {
                          dot: "bg-indigo-500",
                          ring: "ring-indigo-100",
                          label:
                            "bg-indigo-50 text-indigo-700 border-indigo-200",
                          icon: "🤚",
                        },
                        in_transit: {
                          dot: "bg-blue-500",
                          ring: "ring-blue-100",
                          label: "bg-blue-50 text-blue-700 border-blue-200",
                          icon: "🚚",
                        },
                        delivered: {
                          dot: "bg-emerald-500",
                          ring: "ring-emerald-100",
                          label:
                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                          icon: " ",
                        },
                        cancelled: {
                          dot: "bg-red-400",
                          ring: "ring-red-100",
                          label: "bg-red-50 text-red-700 border-red-200",
                          icon: "❌",
                        },
                      };
                      const newStyles =
                        statusColorMap[event.new_status] ||
                        statusColorMap.created;
                      const prevStyles =
                        statusColorMap[event.previous_status] ||
                        statusColorMap.created;

                      return (
                        <div
                          key={event.id || idx}
                          className="flex gap-4 relative"
                        >
                          {/* Dot */}
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full ${newStyles.dot} ring-4 ${newStyles.ring} flex items-center justify-center text-base shadow-sm z-10`}
                          >
                            {newStyles.icon}
                          </div>

                          {/* Content card */}
                          <div
                            className={`flex-1 bg-white rounded-2xl border shadow-sm p-4 min-w-0 ${isLast ? "border-indigo-200 shadow-indigo-100" : "border-gray-100"}`}
                          >
                            {/* Transition arrow */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${prevStyles.label}`}
                              >
                                {event.previous_status?.replace("_", " ")}
                              </span>
                              <ArrowRight
                                size={12}
                                className="text-gray-300 flex-shrink-0"
                              />
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${newStyles.label}`}
                              >
                                {event.new_status?.replace("_", " ")}
                              </span>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                              <Clock size={10} />
                              {new Date(event.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>

                            {/* Notes */}
                            {event.notes && (
                              <div className="mt-2.5 text-[11px] text-gray-500 bg-gray-50 rounded-xl px-3 py-2 italic font-medium border border-gray-100">
                                "{event.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Current state dot at end */}
                    {lifecycleHistory.length > 0 && (
                      <div className="flex gap-4 relative">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-dashed ${
                            lifecycleShipment.status === "delivered"
                              ? "border-emerald-400"
                              : lifecycleShipment.status === "cancelled"
                                ? "border-red-400"
                                : "border-indigo-400"
                          } flex items-center justify-center z-10`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full animate-pulse ${
                              lifecycleShipment.status === "delivered"
                                ? "bg-emerald-400"
                                : lifecycleShipment.status === "cancelled"
                                  ? "bg-red-400"
                                  : "bg-indigo-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1 flex items-center">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Current status —{" "}
                            {lifecycleShipment.status?.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {lifecycleHistory.length} transition
                {lifecycleHistory.length !== 1 ? "s" : ""} recorded
              </span>
              <button
                onClick={closeLifecycle}
                className="px-5 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={conflicts}
        onConfirm={() => handleBulkUpload(null, true)}
        type="shipments"
      />
    </div>
  );
}
