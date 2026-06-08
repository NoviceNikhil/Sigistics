import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import ShipmentCard from "../../components/dashboard/ShipmentCard";
import Pagination from "../../components/ui/Pagination";
import {
  Search, Filter, Package, X,
  Loader2, AlertCircle, Plus
} from "lucide-react";

const STATUSES = ["all", "assigned", "picked", "in_transit", "delivered", "cancelled"];
const PACKAGE_TYPES = ["all", "small", "medium", "large"];

const STATUS_LABELS = {
  all: "All Statuses", assigned: "Assigned", picked: "Picked Up",
  in_transit: "In Transit", delivered: "Delivered", cancelled: "Cancelled",
};

const ShipmentsList = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [packageType, setPackageType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  const searchDebounce = useRef(null);

  const fetchShipments = async (overrides = {}) => {
    setLoading(true);
    try {
      const currentSearch = overrides.search !== undefined ? overrides.search : search;
      const currentStatus = overrides.status !== undefined ? overrides.status : status;
      const currentPackageType = overrides.packageType !== undefined ? overrides.packageType : packageType;
      const currentFromDate = overrides.fromDate !== undefined ? overrides.fromDate : fromDate;
      const currentToDate = overrides.toDate !== undefined ? overrides.toDate : toDate;
      const currentPage = overrides.page !== undefined ? overrides.page : page;
      const currentLimit = overrides.limit !== undefined ? overrides.limit : limit;

      const params = { page: currentPage, limit: currentLimit };
      if (currentSearch) params.search = currentSearch;
      if (currentStatus !== "all") params.status = currentStatus;
      if (currentPackageType !== "all") params.package_type = currentPackageType;
      if (currentFromDate) params.from = currentFromDate;
      if (currentToDate) params.to = currentToDate;

      const res = await api.get("/api/customer/shipments", { params });
      setShipments(res.data.shipments);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch {
      setError("Failed to load shipments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipments(); }, []);

  useEffect(() => {
    fetchShipments({ status, packageType, limit, page });
  }, [status, packageType, limit, page]);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setPage(1);
      fetchShipments({ search: value, page: 1 });
    }, 300);
  };

  const handleFromDateChange = (value) => {
    setFromDate(value);
    setPage(1);
    fetchShipments({ fromDate: value, page: 1 });
  };

  const handleToDateChange = (value) => {
    setToDate(value);
    setPage(1);
    fetchShipments({ toDate: value, page: 1 });
  };

  const clearFilters = () => {
    setSearch(""); setStatus("all"); setPackageType("all");
    setFromDate(""); setToDate(""); setPage(1);
    fetchShipments({ search: "", status: "all", packageType: "all", fromDate: "", toDate: "", page: 1 });
  };

  const hasActiveFilters = search || status !== "all" || packageType !== "all" || fromDate || toDate;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 min-h-screen font-sans relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-[50px] right-[-50px] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 sm:gap-3">
              <Package className="text-indigo-600" size={24} /> My Shipments
            </h1>
            <p className="text-[10px] font-black text-slate-400 mt-1 tracking-widest uppercase">
              {total} shipment{total !== 1 ? "s" : ""} found · Browse & Track
            </p>
          </div>
          <button
            onClick={() => navigate("/customer/shipments/new")}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-sm hover:bg-black transition-all font-black uppercase text-xs tracking-widest w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus size={16} /> New Shipment
          </button>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="admin-minimal-card p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-2 text-slate-800 mb-4">
            <Filter size={14} className="text-indigo-500" />
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Filter Shipments</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* Live search */}
            <div className="relative">
              {loading && search ? (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                </div>
              ) : (
                <Search size={16} className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
              <input
                type="text"
                placeholder="🔎 Search by code or city..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-3 bg-white border border-slate-200 text-gray-700 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all cursor-text"
              />
            </div>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-200 text-gray-700 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all cursor-pointer"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>

            {/* Package type */}
            <select
              value={packageType}
              onChange={(e) => { setPackageType(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-200 text-gray-700 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all cursor-pointer"
            >
              {PACKAGE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "📦 All Packages" : p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>

            {/* Per page */}
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="w-full bg-white border border-slate-200 text-gray-700 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all cursor-pointer"
            >
              {[10, 20, 50].map((l) => <option key={l} value={l}>{l} per page</option>)}
            </select>
          </div>

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="text-sm bg-white border border-slate-200 font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="text-sm border-none bg-gray-100 font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors ml-1"
              >
                <X size={12} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ── RESULTS ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
            <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse tracking-widest uppercase">
              Loading Shipments...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-bold tracking-wider">
            <AlertCircle className="mx-auto mb-3" size={28} />
            {error}
          </div>
        ) : shipments.length === 0 ? (
          <div className="admin-minimal-card p-16 text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-indigo-400" />
            </div>
            <p className="text-sm font-black text-slate-700 mb-1">No shipments found</p>
            <p className="text-xs text-slate-400 font-bold mb-5 uppercase tracking-wider">
              {hasActiveFilters ? "Try adjusting your filters" : "Create your first shipment to get started"}
            </p>
            <button
              onClick={() => navigate("/customer/shipments/new")}
              className="text-xs font-black bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-black shadow-sm transition-all uppercase tracking-widest cursor-pointer"
            >
              Create Shipment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {shipments.map((s) => <ShipmentCard key={s.id} shipment={s} />)}
          </div>
        )}

        {/* ── PAGINATION ── */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default ShipmentsList;