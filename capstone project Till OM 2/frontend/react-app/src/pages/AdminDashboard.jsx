import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import * as agentService from '../services/agentService';
import KPICard from '../components/dashboard/KPICard';
import StatusChart from '../components/dashboard/StatusChart';
import TimelineChart from '../components/dashboard/TimeLineChart';
import CityPieChart from '../components/dashboard/CityPieChart';
import CityVolumeBar from '../components/dashboard/CityVolumeBar';
import AgentLeaderboard from '../components/dashboard/AgentLeaderboard';
import PackagePieChart from '../components/dashboard/PackagePieChart';
import TagAnalyticsChart from '../components/dashboard/TagAnalyticsChart';
import {
  Download, Filter, Eye, Activity, Package, CheckCircle2,
  Users, AlertCircle, AlertTriangle, TrendingUp, Compass, MapPin,
  Clock, Zap, Target, BarChart3, RefreshCw, Loader2
} from 'lucide-react';
import CustomSelect from '../components/ui/CustomSelect';

// ─── AGENT AUTOCOMPLETE ────────────────────────────────────────────────────────
const AgentAutocomplete = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAgentName, setSelectedAgentName] = useState(null);

  useEffect(() => {
    if (!searchTerm) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { agents } = await agentService.getAgents({ search: searchTerm, limit: 5 });
        setResults(agents || []);
      } catch { /* ignore */ } finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSelect = (agent) => {
    setSelectedAgentName(agent.name);
    setSearchTerm('');
    setIsOpen(false);
    onChange(agent.id);
  };
  const clearSelection = () => { setSelectedAgentName(null); setSearchTerm(''); onChange(''); };

  return (
    <div className="relative">
      {selectedAgentName ? (
        <div className="flex items-center justify-between border-2 border-blue-400 bg-blue-50 text-blue-700 font-bold px-4 py-2.5 rounded-xl text-sm">
          <span>{selectedAgentName}</span>
          <button onClick={clearSelection} className="text-blue-400 hover:text-blue-600">×</button>
        </div>
      ) : (
        <input
          type="text"
          placeholder="🔎 Search Agents..."
          maxLength={100}
          className="w-full border-none bg-gray-100 text-gray-700 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      )}
      {isOpen && searchTerm && (
        <div className="absolute z-[999] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-xs font-black uppercase text-gray-400">Scanning...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map(agent => (
                <li key={agent.id} onClick={() => handleSelect(agent)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                  <div className="font-bold text-gray-900 text-sm">{agent.name}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{agent.city}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-xs font-black uppercase text-gray-400">No Agents Match</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── ON-TIME CITY TABLE ────────────────────────────────────────────────────────
const OnTimeCityTable = ({ data = [] }) => (
  <div className="admin-minimal-card p-6 h-full flex flex-col">
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-5">
      <Target size={14} className="text-slate-400" /> On-Time Rate by City
    </h3>
    {data.length === 0 ? (
      <div className="flex-1 flex items-center justify-center text-gray-300 font-black text-xs uppercase tracking-widest">
        No delivered shipments in scope
      </div>
    ) : (
      <div className="flex-1 overflow-auto space-y-2">
        {data.map((row) => (
          <div key={row.city} className="flex items-center gap-3">
            <div className="w-20 text-[10px] font-black text-gray-600 uppercase truncate flex-shrink-0">
              {row.city}
            </div>
            <div className="flex-1 min-w-0">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${row.on_time_rate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : row.on_time_rate >= 60 ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                        : 'bg-gradient-to-r from-rose-400 to-red-500'
                    }`}
                  style={{ width: `${row.on_time_rate}%` }}
                />
              </div>
            </div>
            <div className={`text-xs font-black w-10 text-right flex-shrink-0 ${row.on_time_rate >= 80 ? 'text-emerald-600' : row.on_time_rate >= 60 ? 'text-amber-600' : 'text-rose-600'
              }`}>
              {row.on_time_rate}%
            </div>
            <div className="text-[9px] text-gray-400 font-bold w-12 text-right flex-shrink-0">
              {row.total} del
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── DELAYED SHIPMENTS TABLE ───────────────────────────────────────────────────
const DelayedTable = ({ data = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="admin-minimal-card p-6 sm:p-8">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
        <AlertTriangle size={14} className="text-rose-500" /> Critical Delay Anomalies
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[480px]">
          <thead>
            <tr className="border-b-2 border-red-100 text-red-400 text-[10px] uppercase tracking-widest font-black">
              <th className="pb-4 px-3">Parcel</th>
              <th className="pb-4 px-3">Agent</th>
              <th className="pb-4 px-3">Reason</th>
              <th className="pb-4 px-3 text-right">View</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.map((s, i) => (
              <tr key={s.id || i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/30 transition-colors">
                <td className="py-4 px-3">
                  <div className="font-bold text-rose-600 text-sm">{s.shipment_code}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.User?.full_name || 'System User'}</div>
                </td>
                <td className="py-4 px-3 font-medium text-gray-700 text-sm">
                  {s.Agent?.name || <span className="text-gray-300 italic text-xs">Unassigned</span>}
                </td>
                <td className="py-4 px-3">
                  <div className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg inline-block">
                    {s.delay_reason || 'Rule Engine Flag'}
                  </div>
                </td>
                <td className="py-4 px-3 text-right">
                  <button
                    onClick={() => navigate(`/admin/shipments?search=${encodeURIComponent(s.shipment_code || '')}`)}
                    className="inline-flex p-2 bg-white text-gray-400 hover:text-rose-600 rounded-xl shadow-sm border border-gray-100 hover:border-rose-200 transition-all"
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan="4" className="py-10 text-center text-gray-300 font-black tracking-widest uppercase text-xs">All Systems Green ✓</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD PAGE ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    region: '', days: '', agent: '', status: '', package_type: ''
  });
  const { data, meta, loading, error } = useDashboard(filters);

  const {
    summary, statusData, timelineData, agentData, delayedData,
    cityAnalytics, agentLeaderboard, packageAnalytics, tagAnalytics, onTimeByCity,
  } = data;

  // ─── EXPORT HANDLER ─────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const rows = [];
      const sep = [''];
      const now = new Date().toLocaleString();

      rows.push([`LOGISTICS COMMAND — ANALYTICS REPORT`]);
      rows.push([`Generated: ${now}`]);
      rows.push([`Filter: ${filters.days ? `Last ${filters.days} days` : 'All Time'} | Region: ${filters.region || 'All'} | Status: ${filters.status || 'All'} | Package: ${filters.package_type || 'All'}`]);
      rows.push(sep);

      // Section 1: KPIs
      rows.push(['=== SUMMARY METRICS ===']);
      rows.push(['Metric', 'Value']);
      rows.push(['Total Shipments', summary?.total_shipments ?? 0]);
      rows.push([`Today's Shipments`, summary?.todays_shipments ?? 0]);
      rows.push(['Active Shipments', summary?.active_shipments ?? 0]);
      rows.push(['Delivered Today', summary?.delivered_today ?? 0]);
      rows.push(['Total Delivered (Period)', summary?.total_delivered ?? 0]);
      rows.push(['Total Cancelled (Period)', summary?.total_cancelled ?? 0]);
      rows.push(['Delay Rate %', `${summary?.delay_rate ?? 0}%`]);
      rows.push(['On-Time Rate %', `${summary?.on_time_rate ?? 0}%`]);
      rows.push(['Total Agents', summary?.total_agents ?? 0]);
      rows.push(['Available Agents', summary?.available_agents ?? 0]);
      rows.push(['Overloaded Agents (>5 jobs)', summary?.overloaded_agents ?? 0]);
      rows.push(['Active Delayed Shipments', summary?.active_delayed_shipments ?? 0]);
      rows.push(sep);

      // Section 2: Status breakdown
      rows.push(['=== SHIPMENT STATUS BREAKDOWN ===']);
      rows.push(['Status', 'Count']);
      (statusData || []).forEach(s => rows.push([s.name, s.value]));
      rows.push(sep);

      // Section 3: Agent Leaderboard
      rows.push(['=== AGENT LEADERBOARD ===']);
      rows.push(['Rank', 'Name', 'City', 'Rating', 'Delivered', 'Delayed', 'On-Time Rate %', 'Status']);
      (agentLeaderboard || []).forEach(a => rows.push([
        a.rank, a.name, a.city, a.rating, a.delivered_count, a.delayed_count, `${a.on_time_rate}%`, a.availability_status
      ]));
      rows.push(sep);

      // Section 4: Package analytics
      rows.push(['=== PACKAGE ANALYTICS ===']);
      rows.push(['Package Type', 'Count', 'Avg Weight (kg)', 'Delayed Count']);
      (packageAnalytics || []).forEach(p => rows.push([p.name, p.value, p.avg_weight, p.delayed_count]));
      rows.push(sep);

      // Section 5: City analytics
      rows.push(['=== TOP PICKUP CITIES ===']);
      rows.push(['City', 'Shipment Count']);
      (cityAnalytics?.pickup_cities || []).forEach(c => rows.push([c.name, c.value]));
      rows.push(sep);

      rows.push(['=== TOP DELIVERY CITIES ===']);
      rows.push(['City', 'Shipment Count']);
      (cityAnalytics?.delivery_cities || []).forEach(c => rows.push([c.name, c.value]));
      rows.push(sep);

      // Section 6: On-time by city
      rows.push(['=== ON-TIME RATE BY DELIVERY CITY ===']);
      rows.push(['City', 'Total Delivered', 'On-Time', 'On-Time Rate %']);
      (onTimeByCity || []).forEach(c => rows.push([c.city, c.total, c.on_time, `${c.on_time_rate}%`]));
      rows.push(sep);

      // Section 7: Tag analytics (Rule Engine)
      rows.push(['=== RULE ENGINE TAG ANALYTICS ===']);
      rows.push(['Tag', 'Total Occurrences', 'Delayed Shipments', 'Delay Rate %']);
      (tagAnalytics || []).forEach(t => rows.push([t.name.replace(/_/g, ' '), t.count, t.delayed, `${t.delay_rate}%`]));
      rows.push(sep);

      // Section 8: Delayed shipments list
      rows.push(['=== DELAYED SHIPMENTS DETAIL ===']);
      rows.push(['Shipment Code', 'Agent', 'User', 'Delay Reason', 'Current Status']);
      (delayedData || []).forEach(s => rows.push([
        s.shipment_code, s.Agent?.name || 'Unassigned',
        s.User?.full_name || 'System User', s.delay_reason || 'Rule Engine Flag', s.status
      ]));

      // Build CSV
      const csvContent = 'data:text/csv;charset=utf-8,' +
        rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `logistics_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export report.');
    }
  };

  // ─── LOADING / ERROR ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
      <Loader2 className="animate-spin text-indigo-500" size={36} />
      <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse tracking-widest uppercase">
        Loading Analytics Engine...
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-500 font-bold tracking-wider">
      Critical Data Error: {error}
    </div>
  );

  // ─── DERIVED METRICS ──────────────────────────────────────────────────────────
  const delayRateColor = (summary?.delay_rate ?? 0) > 20
    ? 'from-rose-500 to-red-500'
    : (summary?.delay_rate ?? 0) > 10
      ? 'from-amber-400 to-orange-500'
      : 'from-emerald-400 to-teal-500';

  const onTimeColor = (summary?.on_time_rate ?? 100) < 70
    ? 'from-rose-500 to-red-500'
    : (summary?.on_time_rate ?? 100) < 85
      ? 'from-amber-400 to-orange-500'
      : 'from-emerald-400 to-teal-500';

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 min-h-screen font-sans relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-[50px] right-[-50px] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-[40%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full max-w-[1700px] mx-auto">


        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 sm:gap-3">
              <Compass className="text-indigo-600" size={24} /> Operations Command
            </h1>
            <p className="text-[10px] font-black text-slate-400 mt-1 tracking-widest uppercase">
              Real-Time Logistics Analytics · Rule Engine Integrated
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-sm hover:bg-black transition-all font-black uppercase text-xs tracking-widest w-full sm:w-auto justify-center"
          >
            <Download size={16} /> Export CSV Report
          </button>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="admin-minimal-card p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-2 text-slate-800 mb-4">
            <Filter size={14} className="text-indigo-500" />
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Global Telemetry Scopes</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <CustomSelect
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              options={[
                { value: '', label: '🗺️ All Regions' },
                ...(meta?.regions?.map(reg => ({ value: reg, label: reg })) || [])
              ]}
              placeholder="🗺️ All Regions"
            />
            <CustomSelect
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: e.target.value })}
              options={[
                { value: '', label: '📊 All Time' },
                { value: '7', label: '⏱️ Last 7 Days' },
                { value: '15', label: '⏱️ Last 15 Days' },
                { value: '30', label: '⏱️ Last 30 Days' },
                { value: '90', label: '⏱️ Last 90 Days' },
              ]}
              placeholder="⏱️ Time Range"
            />
            <AgentAutocomplete value={filters.agent} onChange={(id) => setFilters({ ...filters, agent: id })} />
            <CustomSelect
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={[
                { value: '', label: '⚙️ All Statuses' },
                { value: 'created', label: 'Created' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'picked', label: 'Picked' },
                { value: 'in_transit', label: 'In Transit' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              placeholder="⚙️ All Statuses"
            />
            <CustomSelect
              value={filters.package_type}
              onChange={(e) => setFilters({ ...filters, package_type: e.target.value })}
              options={[
                { value: '', label: '📦 All Packages' },
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ]}
              placeholder="📦 All Packages"
            />
          </div>
        </div>

        {/* ── KPI ROW 1: Core Shipment Metrics ── */}
        <div className="mb-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <BarChart3 size={12} /> Core Shipment Metrics
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard title="Total Shipments" value={summary?.total_shipments ?? 0} icon={Package} colorClass="from-blue-500 to-indigo-500" />
            <KPICard title="Delivered Today" value={summary?.delivered_today ?? 0} icon={CheckCircle2} colorClass="from-emerald-400 to-teal-500" />
            <KPICard title="Active in Transit" value={summary?.active_shipments ?? 0} icon={Activity} colorClass="from-amber-400 to-orange-500" />
            <KPICard title="Total Cancelled" value={summary?.total_cancelled ?? 0} icon={AlertCircle} colorClass="from-rose-400 to-red-500" />
          </div>
        </div>

        {/* ── KPI ROW 2: Operations Health ── */}
        <div className="mb-8">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Zap size={12} /> Operations Health
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard
              title="Delay Rate"
              value={`${summary?.delay_rate ?? 0}%`}
              icon={AlertTriangle}
              colorClass={delayRateColor}
              subtitle="Active delayed / total"
            />
            <KPICard
              title="On-Time Rate"
              value={`${summary?.on_time_rate ?? 0}%`}
              icon={TrendingUp}
              colorClass={onTimeColor}
              subtitle="Delivered on schedule"
            />
            <KPICard title="Total Agents" value={summary?.total_agents ?? 0} icon={Users} colorClass="from-purple-500 to-pink-500" subtitle={`${summary?.available_agents ?? 0} available`} />
            <KPICard title="Overloaded Agents" value={summary?.overloaded_agents ?? 0} icon={AlertCircle} colorClass="from-orange-400 to-rose-500" subtitle="> 5 active jobs" />
          </div>
        </div>

        {/* ── CHARTS ROW 1: Status + Timeline ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="h-[300px] sm:h-[340px]">
            <StatusChart data={statusData} />
          </div>
          <div className="lg:col-span-2 h-[300px] sm:h-[340px]">
            <TimelineChart data={timelineData} />
          </div>
        </div>

        {/* ── CHARTS ROW 2: City Pie Charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <div className="h-[380px]">
            <CityPieChart
              data={cityAnalytics?.pickup_cities || []}
              title="🗺️ Top Pickup Cities"
              subtitle="Origin volume distribution"
            />
          </div>
          <div className="h-[380px]">
            <CityPieChart
              data={cityAnalytics?.delivery_cities || []}
              title="📍 Top Delivery Cities"
              subtitle="Destination volume distribution"
            />
          </div>
          <div className="h-[380px]">
            <PackagePieChart data={packageAnalytics || []} />
          </div>
        </div>

        {/* ── CHARTS ROW 3: City Volume Bar ── */}
        <div className="h-[340px] mb-6">
          <CityVolumeBar data={cityAnalytics?.city_status_matrix || []} />
        </div>

        {/* ── SECTION ROW 4: Leaderboard + On-Time City + Tags ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <div className="h-[520px]">
            <AgentLeaderboard data={agentLeaderboard || []} />
          </div>
          <div className="h-[520px]">
            <OnTimeCityTable data={onTimeByCity || []} />
          </div>
          <div className="h-[520px]">
            <TagAnalyticsChart data={tagAnalytics || []} />
          </div>
        </div>

        {/* ── SECTION ROW 5: Fleet Utilization + Delayed ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-10">

          {/* Agent Fleet Utilization */}
          <div className="admin-minimal-card p-6 sm:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-500" /> Fleet Utilization
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[400px]">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                    <th className="pb-4 px-3">Agent</th>
                    <th className="pb-4 px-3 text-center">Load</th>
                    <th className="pb-4 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {agentData.map((agent, i) => (
                    <tr key={agent.id || i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-3">
                        <div className="font-bold text-gray-900 text-sm">{agent.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-1">
                          <MapPin size={8} />{agent.city}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center gap-1.5 w-full max-w-[120px] mx-auto">
                          <div className="flex justify-between w-full text-[10px] font-black text-gray-400">
                            <span>{agent.active_shipments_count} active</span>
                            <span className={agent.load_percentage > 80 ? 'text-rose-500' : 'text-blue-500'}>
                              {agent.load_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${agent.load_percentage > 80 ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                              style={{ width: `${Math.min(agent.load_percentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded ${agent.availability_status === 'available' ? 'bg-green-100 text-green-700' :
                            agent.availability_status === 'offline' ? 'bg-gray-200 text-gray-600' :
                              'bg-amber-100 text-amber-700'
                          }`}>
                          {agent.availability_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {agentData.length === 0 && (
                    <tr><td colSpan="3" className="py-10 text-center text-gray-300 font-black tracking-widest uppercase text-xs">No active agents in scope</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DelayedTable data={delayedData || []} />
        </div>

      </div>
    </div>
  );
}