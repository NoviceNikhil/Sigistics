import React, { useState, useEffect, useCallback } from 'react';
import * as locationService from '../services/locationService';
import Pagination from '../components/ui/Pagination';
import { 
  MapPin, Search, Plus, Trash2, X, Loader2, RotateCcw, Info
} from 'lucide-react';

const LIMIT = 10;

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("city"); // Sort by city by default

  // Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ city: '', subregion: '', latitude: '', longitude: '' });

  // Detail State
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      const { locations: data, results } = await locationService.getLocations({ page, limit: LIMIT, search: searchTerm, sort: sortBy });
      setLocations(data || []);
      setTotal(results || 0);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [page, searchTerm, sortBy]);

  useEffect(() => {
    const timer = setTimeout(loadLocations, 400);
    return () => clearTimeout(timer);
  }, [loadLocations]);

  // --- HANDLERS ---
  const viewDetails = async (id) => {
    try {
      setIsDetailLoading(true);
      const data = await locationService.getLocationById(id);
      setSelectedLocation(data);
    } catch (err) { alert("Could not fetch details"); }
    finally { setIsDetailLoading(false); }
  };
  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      await locationService.createLocation({
          city: formData.city,
          subregion: formData.subregion,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
      });
      setIsAddModalOpen(false);
      setFormData({ city: '', subregion: '', latitude: '', longitude: '' });
      loadLocations();
    } catch (err) { alert(err.response?.data?.message || "Failed to create location."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this master location?")) return;
    try {
      await locationService.deleteLocation(id);
      loadLocations();
    } catch (err) { alert(err.response?.data?.message || "Failed to delete logic node."); }
  };

  const handleRestore = async (id) => {
    try {
      await locationService.restoreLocation(id);
      loadLocations();
    } catch (err) { alert(err.response?.data?.message || "Failed to restore logic node."); }
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 md:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-indigo-800 drop-shadow-sm flex items-center gap-2 sm:gap-3">
            <MapPin className="text-indigo-600" size={28} /> Geo Nodes
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-400 tracking-widest uppercase mt-1">Manage master city hubs and geographic zones.</p>
        </div>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-widest text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1 w-full sm:w-auto justify-center"
        >
            <Plus size={16} /> Add Logic Node
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by city or subregion..." 
              maxLength={100}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">
            Results: <span className="text-blue-600">{total}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[560px]">
          <thead>
            <tr className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-[0.2em] font-black">
              <th className="py-5 px-4 sm:px-8 w-1/4">City Identity</th>
              <th className="py-5 px-4 sm:px-6">Routing Hub</th>
              <th className="py-5 px-4 sm:px-6 hidden sm:table-cell">Coordinate System</th>
              <th className="py-5 px-4 sm:px-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {locations.map(loc => (
              <tr key={loc.id} className={`hover:bg-blue-50/30 transition-colors group ${loc.deletedAt ? 'opacity-50' : ''}`}>
                <td className="py-4 sm:py-5 px-4 sm:px-8">
                  <div className="font-bold text-gray-900 text-sm sm:text-base">{loc.city}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: #{loc.id}</div>
                </td>
                <td className="py-4 sm:py-5 px-4 sm:px-6">
                  <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">{loc.subregion}</span>
                </td>
                <td className="py-4 sm:py-5 px-4 sm:px-6 hidden sm:table-cell">
                  <div className="text-gray-500 font-mono text-xs sm:text-sm bg-gray-50 p-2 rounded-xl border border-gray-100 inline-block">
                    {Number(loc.latitude).toFixed(4)}°, {Number(loc.longitude).toFixed(4)}°
                  </div>
                </td>
                <td className="py-4 sm:py-5 px-4 sm:px-8 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => viewDetails(loc.id)} className="p-2 sm:p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100"><Info size={18}/></button>
                    {!loc.deletedAt ? (
                        <button onClick={() => handleDelete(loc.id)} className="p-2 sm:p-2.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"><Trash2 size={18}/></button>
                    ) : (
                        <button onClick={() => handleRestore(loc.id)} className="p-2 sm:p-2.5 text-gray-400 hover:text-green-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-green-100"><RotateCcw size={18}/></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {locations.length === 0 && !loading && (
                <tr><td colSpan="4" className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">No Location Nodes Found</td></tr>
            )}
          </tbody>
        </table>
        </div>

        {/* PAGINATION */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>

      {/* --- ADD LOCATION MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 overflow-hidden relative">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
            <h2 className="text-2xl font-black text-gray-900 mb-2">New Hub Node</h2>
            <p className="text-gray-500 mb-8 font-medium">Add a new city location to the logistics engine.</p>
            
            <form onSubmit={handleAddLocation} className="space-y-4">
              <input required placeholder="City Name" maxLength={100} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              <input required placeholder="Subregion" maxLength={100} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.subregion} onChange={e => setFormData({...formData, subregion: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="any" placeholder="Latitude" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
                <input required type="number" step="any" placeholder="Longitude" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
              </div>
              
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-4">Compile Node</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── LOCATION DETAIL DRAWER ──────────────────────────────────────────── */}
      {(selectedLocation || isDetailLoading) && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedLocation(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-10 flex flex-col animate-slide-in">
            <button onClick={() => setSelectedLocation(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X size={28} /></button>

            {isDetailLoading || !selectedLocation ? (
              <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>
            ) : (
              <>
                <div className="mb-10 pt-10">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black mb-6 shadow-xl shadow-blue-200">
                    <MapPin size={36} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900">{selectedLocation.city}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-blue-600 font-bold uppercase tracking-wider text-xs">Node #{selectedLocation.id}</span>
                    {selectedLocation.deletedAt && <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Deleted</span>}
                  </div>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                  <section>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Geography</h3>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
                      <div className="flex justify-between"><span className="text-gray-500 text-xs font-bold">Subregion</span><span className="font-bold text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{selectedLocation.subregion}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 text-xs font-bold">Latitude</span><span className="font-mono text-sm">{selectedLocation.latitude}°</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 text-xs font-bold">Longitude</span><span className="font-mono text-sm">{selectedLocation.longitude}°</span></div>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
