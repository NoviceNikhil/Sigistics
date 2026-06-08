import React, { useState, useEffect, useCallback } from 'react';
import * as agentService from '../services/agentService';
import * as locationService from '../services/locationService';
import Pagination from '../components/ui/Pagination';
import BulkConflictModal from '../components/modals/BulkConflictModal';
import CustomSelect from '../components/ui/CustomSelect';

import {
  Users, Search, Plus, Trash2, Power, Edit2, RotateCcw,
  Upload, FileText, Info, X, ArrowUpDown, Loader2, CheckCircle2,
  Star, ClipboardList
} from 'lucide-react';

const LIMIT = 10;

export default function AgentManagement() {
  const [agents, setAgents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");

  // Advanced Filters
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [fCity, setFCity] = useState("");
  const [fSub, setFSub] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fRatingMin, setFRatingMin] = useState("");
  const [fRatingMax, setFRatingMax] = useState("");
  const [fJobsMin, setFJobsMin] = useState("");
  const [fJobsMax, setFJobsMax] = useState("");

  // Modals/Drawers State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null); // For Detail Drawer
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', city: '', subregion: '' });

  // Location Data
  const [masterLocations, setMasterLocations] = useState([]);

  useEffect(() => {
    locationService.getLocations({ limit: 1000 }).then(res => setMasterLocations(res.locations || [])).catch(console.error);
  }, []);

  const uniqueCities = [...new Set(masterLocations.map(loc => loc.city))];

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: LIMIT, sort: sortBy };
      if (searchTerm) params.search = searchTerm;

      // Advanced Filters
      if (fCity) params.city = fCity;
      if (fSub) params.subregion = fSub;
      if (fStatus === 'deleted') {
        params.includeDeleted = "true";
        params.is_deleted = "true";
      } else if (fStatus) {
        params.availability_status = fStatus;
      }

      if (fRatingMin) params['rating[gte]'] = fRatingMin;
      if (fRatingMax) params['rating[lte]'] = fRatingMax;

      if (fJobsMin) params['active_shipments_count[gte]'] = fJobsMin;
      if (fJobsMax) params['active_shipments_count[lte]'] = fJobsMax;

      const { agents, results } = await agentService.getAgents(params);
      setAgents(agents);
      setTotal(results);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, searchTerm, sortBy, fCity, fSub, fStatus, fRatingMin, fRatingMax, fJobsMin, fJobsMax]);

  useEffect(() => {
    const timer = setTimeout(loadAgents, 400);
    return () => clearTimeout(timer);
  }, [loadAgents]);

  useEffect(() => { setPage(1); }, [searchTerm, fCity, fSub, fStatus, fRatingMin, fRatingMax, fJobsMin, fJobsMax, sortBy]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortBy(`-${field}`);
    else if (sortBy === `-${field}`) setSortBy("-createdAt");
    else setSortBy(field);
  };

  const resetFilters = () => {
    setFCity(""); setFSub(""); setFStatus(""); setFRatingMin(""); setFRatingMax("");
    setFJobsMin(""); setFJobsMax(""); setSearchTerm(""); setSortBy("-createdAt");
  };

  const activeFilterCount = [fCity, fSub, fStatus, fRatingMin, fRatingMax, fJobsMin, fJobsMax].filter(Boolean).length;

  const getSubregions = (city) => {
    return [...new Set(masterLocations.filter(l => l.city === city).map(l => l.subregion))];
  };

  // --- HANDLERS ---
  const handleToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'offline' : 'available';
    try {
      await agentService.toggleAvailability(id, nextStatus);
      loadAgents();
    } catch (err) { alert(err.response?.data?.message || "Status toggle failed"); }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    try {
      await agentService.createAgent(formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', phone: '', city: '', subregion: '' });
      loadAgents();
    } catch (err) { alert(err.response?.data?.message || "Creation failed"); }
  };

  const handleEditAgent = async (e) => {
    e.preventDefault();
    try {
      await agentService.updateAgent(editingAgent.id, formData);
      setIsEditModalOpen(false);
      setEditingAgent(null);
      setFormData({ name: '', email: '', phone: '', city: '', subregion: '' });
      loadAgents();
    } catch (err) { alert(err.response?.data?.message || "Update failed"); }
  };

  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setFormData({ name: agent.name, email: agent.email, phone: agent.phone, city: agent.city || '', subregion: agent.subregion || '' });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete agent ${name}?`)) {
      try {
        await agentService.deleteAgent(id);
        loadAgents();
      } catch (err) { alert(err.response?.data?.message || "Deletion failed"); }
    }
  };

  const handleRestoreAgent = async (id) => {
    try {
      await agentService.restoreAgent(id);
      loadAgents();
    } catch (err) { alert(err.response?.data?.message || "Restore failed"); }
  };

  const handleBulkUpload = async (e, overwrite = false) => {
    const file = overwrite ? pendingFile : e.target.files[0];
    if (!file) return;

    if (!overwrite) {
      setPendingFile(file);
    }

    try {
      const response = await agentService.bulkUploadAgents(file, overwrite);
      if (response.status === "CONFLICT") {
        setConflicts(response.conflicts);
        setIsConflictModalOpen(true);
        setIsBulkModalOpen(false);
      } else {
        setIsBulkModalOpen(false);
        setIsConflictModalOpen(false);
        setPendingFile(null);
        loadAgents();
        alert(`Bulk upload successful! ${response.created || 0} created, ${response.updated || 0} updated.`);
      }
    } catch (err) { alert(err.response?.data?.message || "Upload failed"); }
  };

  const viewDetails = async (id) => {
    try {
      setIsDetailLoading(true);
      const data = await agentService.getAgentById(id);
      setSelectedAgent(data);
    } catch (err) { alert("Could not fetch details"); }
    finally { setIsDetailLoading(false); }
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 min-h-screen font-sans relative overflow-hidden">
      {/* Background Orbs for Glassmorphism */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[50px] right-[-50px] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-[40%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 sm:gap-3">
              <Users className="text-indigo-600" size={24} /> Global Agent Command
            </h1>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">Manage courier capacities and availability profiles</p>
          </div>
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="admin-secondary-btn py-3 px-5 shadow-sm flex-1 sm:flex-initial justify-center flex items-center gap-2"
            >
              <Upload size={14} /> Bulk Onboard
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 px-5 py-3 rounded-xl font-black uppercase text-xs tracking-widest text-white hover:bg-indigo-700 transition-all shadow-sm flex-1 sm:flex-initial justify-center"
            >
              <Plus size={16} /> Direct Assign
            </button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="admin-minimal-card overflow-hidden">
          {/* REVAMPED FILTER BAR */}
          <div className="relative z-20 space-y-4 mb-8">
            <div className="p-4 sm:p-5 flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-indigo-400 outline-none transition-all text-sm font-medium placeholder:text-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Quick Sort Controls */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  onClick={() => toggleSort('rating')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy.includes('rating') 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                  }`}
                  title="Toggle Rating Sort"
                >
                  <Star size={12} /> 
                  <span className="hidden sm:inline">Rating</span>
                  {sortBy === 'rating' && "↑"}
                  {sortBy === '-rating' && "↓"}
                </button>
                <button
                  onClick={() => toggleSort('active_shipments_count')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy.includes('active_shipments_count') 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                  }`}
                  title="Toggle Workload Sort"
                >
                  <ClipboardList size={12} /> 
                  <span className="hidden sm:inline">Jobs</span>
                  {sortBy === 'active_shipments_count' && "↑"}
                  {sortBy === '-active_shipments_count' && "↓"}
                </button>
              </div>

              {/* Advanced Toggle */}

              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-widest border transition-all ${isFiltersOpen || activeFilterCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                  : "bg-white text-gray-600 border-gray-100 hover:border-indigo-200"
                  }`}
              >
                <Users size={16} /> Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[10px] font-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <RotateCcw size={18} />
                </button>
              )}

              <div className="ml-auto text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Results: <span className="text-indigo-600">{total}</span>
                {loading && <Loader2 size={16} className="animate-spin text-indigo-400" />}
              </div>
            </div>

            {/* ADVANCED FILTERS PANEL */}
            {isFiltersOpen && (
              <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in slide-in-from-top-4 duration-300">

                {/* Region */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">Region Control</h4>
                  <div className="space-y-2">
                    <CustomSelect
                      className="w-full bg-gray-50/50 border-gray-100"
                      placeholder="All Cities"
                      value={fCity}
                      onChange={(e) => { setFCity(e.target.value); setFSub(""); }}
                      options={[{ value: "", label: "ALL CITIES" }, ...uniqueCities.map(c => ({ value: c, label: c.toUpperCase() }))]}
                    />
                    <CustomSelect
                      className="w-full bg-gray-50/50 border-gray-100"
                      placeholder="All Subregions"
                      value={fSub}
                      onChange={(e) => setFSub(e.target.value)}
                      disabled={!fCity}
                      options={[{ value: "", label: "ALL SUBREGIONS" }, ...getSubregions(fCity).map(s => ({ value: s, label: s.toUpperCase() }))]}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">Availability Status</h4>
                  <CustomSelect
                    className="w-full bg-gray-50/50 border-gray-100"
                    placeholder="Any Status"
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value)}
                    options={[
                      { value: "", label: "ANY STATUS" },
                      { value: "available", label: "AVAILABLE" },
                      { value: "busy", label: "BUSY" },
                      { value: "offline", label: "OFFLINE" },
                      { value: "deleted", label: "DELETED AGENTS" }
                    ]}
                  />
                </div>

                {/* Workload Range */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">Active Jobs Range</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" placeholder="Min Jobs"
                      className="w-1/2 p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      value={fJobsMin} onChange={(e) => setFJobsMin(e.target.value)}
                    />
                    <input
                      type="number" placeholder="Max Jobs"
                      className="w-1/2 p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      value={fJobsMax} onChange={(e) => setFJobsMax(e.target.value)}
                    />
                  </div>
                </div>

                {/* Rating Range */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">Rating Scale</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" step="0.1" placeholder="Min Stars"
                      className="w-1/2 p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      value={fRatingMin} onChange={(e) => setFRatingMin(e.target.value)}
                    />
                    <input
                      type="number" step="0.1" placeholder="Max Stars"
                      className="w-1/2 p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      value={fRatingMax} onChange={(e) => setFRatingMax(e.target.value)}
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                  <th className="py-5 px-4 sm:px-8">Agent Information</th>
                  <th className="py-5 px-4 sm:px-6">Region</th>
                  <th className="py-5 px-4 sm:px-6 text-center">Active Jobs</th>
                  <th className="py-5 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-5 px-4 sm:px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agents.map(agent => (
                  <tr key={agent.id} className={`hover:bg-slate-50 transition-colors group ${agent.deletedAt ? 'opacity-50 grayscale' : ''}`}>
                    <td className="py-4 sm:py-5 px-4 sm:px-8">
                      <div className="font-bold text-slate-900 text-sm sm:text-base">{agent.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{agent.email}</div>
                    </td>
                    <td className="py-4 sm:py-5 px-4 sm:px-6">
                      <div className="text-slate-700 font-semibold text-sm">{agent.city}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{agent.subregion}</div>
                    </td>
                    <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${agent.active_shipments_count > 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-700'}`}>
                        {agent.active_shipments_count || 0}
                      </span>
                    </td>
                    <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                      <span className={`px-2 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${agent.availability_status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        agent.availability_status === 'busy' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                        {agent.availability_status}
                      </span>
                    </td>
                    <td className="py-4 sm:py-5 px-4 sm:px-8 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button onClick={() => viewDetails(agent.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"><Info size={16} /></button>
                        <button onClick={() => openEditModal(agent)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"><Edit2 size={16} /></button>
                        <button onClick={() => handleToggle(agent.id, agent.availability_status)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"><Power size={16} /></button>
                        {agent.deletedAt ? (
                          <button onClick={() => handleRestoreAgent(agent.id)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"><RotateCcw size={16} /></button>
                        ) : (
                          <button onClick={() => handleDelete(agent.id, agent.name)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* --- ADD AGENT MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 overflow-hidden relative">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
            <h2 className="text-2xl font-black text-gray-900 mb-2">New Agent</h2>
            <p className="text-gray-500 mb-8 font-medium">Register a fresh agent or restore a deleted one.</p>

            <form onSubmit={handleAddAgent} className="space-y-4">
              <input required placeholder="Full Name" maxLength={100} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="email" placeholder="Email" maxLength={100} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                <input required placeholder="Phone" maxLength={20} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  required
                  placeholder="Select City"
                  value={formData.city || ''}
                  onChange={e => setFormData({ ...formData, city: e.target.value, subregion: '' })}
                  options={[
                    ...(!uniqueCities.includes(formData.city) && formData.city ? [{ value: formData.city, label: formData.city }] : []),
                    ...uniqueCities.map(city => ({ value: city, label: city }))
                  ]}
                />
                <CustomSelect
                  required
                  disabled={!formData.city}
                  placeholder="Select Subregion"
                  value={formData.subregion || ''}
                  onChange={e => setFormData({ ...formData, subregion: e.target.value })}
                  options={[
                    ...(!masterLocations.find(l => l.city === formData.city && l.subregion === formData.subregion) && formData.subregion ? [{ value: formData.subregion, label: formData.subregion }] : []),
                    ...masterLocations.filter(loc => loc.city === formData.city).map(loc => ({ value: loc.subregion, label: loc.subregion }))
                  ]}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-4">Confirm Registration</button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT AGENT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 overflow-hidden relative">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingAgent(null);
                setFormData({ name: '', email: '', phone: '', city: '', subregion: '' });
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            ><X /></button>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Edit Agent</h2>
            <p className="text-gray-500 mb-8 font-medium">Update agent's service area and info.</p>

            <form onSubmit={handleEditAgent} className="space-y-4">
              <input required disabled placeholder="Full Name" className="w-full px-5 py-3.5 bg-gray-100 text-gray-500 rounded-2xl outline-none" value={formData.name} />
              <div className="grid grid-cols-2 gap-4">
                <input required disabled type="email" placeholder="Email" className="w-full px-5 py-3.5 bg-gray-100 text-gray-500 rounded-2xl outline-none" value={formData.email} />
                <input required disabled placeholder="Phone" className="w-full px-5 py-3.5 bg-gray-100 text-gray-500 rounded-2xl outline-none" value={formData.phone} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select required className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value, subregion: '' })}>
                  <option value="" disabled>Select City</option>
                  {(!uniqueCities.includes(formData.city) && formData.city) && <option value={formData.city}>{formData.city}</option>}
                  {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <select required disabled={!formData.city} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 disabled:opacity-50" value={formData.subregion || ''} onChange={e => setFormData({ ...formData, subregion: e.target.value })}>
                  <option value="" disabled>Select Subregion</option>
                  {(!masterLocations.find(l => l.city === formData.city && l.subregion === formData.subregion) && formData.subregion) && <option value={formData.subregion}>{formData.subregion}</option>}
                  {masterLocations.filter(loc => loc.city === formData.city).map(loc => <option key={loc.id} value={loc.subregion}>{loc.subregion}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-4">Confirm Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* --- BULK IMPORT MODAL --- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Upload size={32} />
            </div>
            <h2 className="text-2xl font-black mb-2">Excel Import</h2>
            <p className="text-gray-500 mb-8 font-medium">Upload your workforce manifest to sync agents in bulk.</p>

            <label className="block w-full cursor-pointer group">
              <div className="border-2 border-dashed border-gray-200 rounded-[2rem] p-8 group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all">
                <FileText className="mx-auto mb-4 text-gray-300 group-hover:text-blue-500" size={40} />
                <span className="text-sm font-bold text-gray-400 group-hover:text-blue-600 uppercase tracking-widest">Select .xlsx file</span>
                <input type="file" className="hidden" accept=".xlsx" onChange={handleBulkUpload} />
              </div>
            </label>
            <button onClick={() => setIsBulkModalOpen(false)} className="mt-8 text-sm font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {/* --- AGENT DETAIL DRAWER --- */}
      {selectedAgent && (
        // ... (keep existing code for detail drawer)
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedAgent(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-10 flex flex-col animate-slide-in">
            <button onClick={() => setSelectedAgent(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X size={28} /></button>

            <div className="mb-10 pt-10">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black mb-6 shadow-xl shadow-blue-200">
                {selectedAgent.name.charAt(0)}
              </div>
              <h2 className="text-3xl font-black text-gray-900">{selectedAgent.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">Rating: {selectedAgent.rating}</span>
                <span className="text-gray-400 text-xs font-bold">• {selectedAgent.email}</span>
              </div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              <section>
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Location & Logistics</h3>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex justify-between mb-2"><span className="text-gray-500 text-xs font-bold">City</span><span className="font-bold text-sm">{selectedAgent.city}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 text-xs font-bold">Subregion</span><span className="font-bold text-sm">{selectedAgent.subregion}</span></div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Current Workload</h3>
                <div className="space-y-3">
                  {(selectedAgent.Shipments || []).map(ship => (
                    <div key={ship.id} className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-2xl group hover:bg-blue-600 transition-all cursor-pointer">
                      <div>
                        <div className="text-xs font-black text-blue-600 group-hover:text-white uppercase tracking-wider">{ship.shipment_code}</div>
                        <div className="text-[10px] text-blue-400 group-hover:text-blue-100 font-bold mt-1">Status: {ship.status}</div>
                      </div>
                      <Info size={16} className="text-blue-300 group-hover:text-white" />
                    </div>
                  ))}
                  {(selectedAgent.Shipments || []).length === 0 && (
                    <div className="text-center py-10 text-gray-300 text-xs italic font-bold uppercase tracking-widest">No Active Jobs</div>
                  )}
                </div>
              </section>
            </div>

            <button
              onClick={() => handleToggle(selectedAgent.id, selectedAgent.availability_status).then(() => setSelectedAgent(null))}
              className="mt-10 w-full py-4 border-2 border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Toggle Status: {selectedAgent.availability_status}
            </button>
          </div>
        </div>
      )}

      <BulkConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={conflicts}
        onConfirm={() => handleBulkUpload(null, true)}
        type="agents"
      />
    </div>
  );
}