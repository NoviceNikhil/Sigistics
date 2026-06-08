import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Clock3, MapPinned, PackageCheck, Siren, Truck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchProfile } from '@/store/authSlice';
import {
  fetchAgentDeliveries,
  updateAgentAvailabilityThunk,
} from '@/store/agentPortalSlice';

const summaryCards = [
  { key: 'active', label: 'Active Deliveries', icon: Truck, accent: 'from-sky-500 to-cyan-500' },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck, accent: 'from-emerald-500 to-lime-500' },
  { key: 'delayed', label: 'Delayed', icon: Siren, accent: 'from-amber-500 to-orange-500' },
  { key: 'total', label: 'All Assigned', icon: Clock3, accent: 'from-slate-700 to-slate-900' },
];

const AgentDashboard = () => {
  const dispatch = useDispatch();
  const { user, profileLoading } = useSelector((state) => state.auth);
  const { deliveries, summary, loading, actionLoading } = useSelector((state) => state.agentPortal);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchAgentDeliveries({ limit: 5, sort: 'expected_delivery_at' }));
  }, [dispatch]);

  const handleAvailabilityChange = async (event) => {
    const result = await dispatch(
      updateAgentAvailabilityThunk({ availability_status: event.target.value }),
    );

    if (updateAgentAvailabilityThunk.fulfilled.match(result)) {
      toast.success('Availability updated');
    } else {
      toast.error(result.payload?.message || 'Failed to update availability');
    }
  };

  if (profileLoading && !user) {
    return <div className="mt-20"><LoadingSpinner text="Loading agent workspace..." /></div>;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(14,116,144,0.9)_55%,_rgba(22,163,74,0.85))] p-6 text-white shadow-2xl shadow-slate-300/70">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-sky-100">
              Delivery Agent Workspace
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {user?.name || 'Agent'}, here’s your live dispatch snapshot.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100/85 sm:text-base">
              Review your assigned shipments, update your availability, and move each delivery
              through the allowed lifecycle without jumping into the admin console.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/agent/deliveries"
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
              >
                Open Delivery Queue
              </Link>
              <Link
                to="/agent/profile"
                className="rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Manage Profile
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-100/80">On shift</p>
                <h2 className="text-lg font-black">{user?.email}</h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-950/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-100/70">City</p>
                <p className="mt-2 text-lg font-bold">{user?.city || 'Not set'}</p>
                <p className="text-sm text-sky-100/70">{user?.subregion || 'Subregion pending'}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-100/70">Availability</p>
                <select
                  value={user?.availability_status || 'available'}
                  onChange={handleAvailabilityChange}
                  disabled={actionLoading}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none"
                >
                  <option value="available" className="text-slate-900">Available</option>
                  <option value="busy" className="text-slate-900">Busy</option>
                  <option value="offline" className="text-slate-900">Offline</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ key, label, icon: Icon, accent }) => (
          <div key={key} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
            <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-6 text-4xl font-black tracking-tight text-slate-950">
                {summary?.[key] ?? 0}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-600">Priority Queue</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Upcoming deliveries</h2>
            </div>
            <Link to="/agent/deliveries" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading deliveries..." />
          ) : deliveries.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-base font-semibold text-slate-700">No deliveries assigned yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                Once dispatch assigns shipments to you, they will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/agent/deliveries/${delivery.id}`}
                  className="block rounded-[1.5rem] border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                        {delivery.shipment_code}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-950">
                        {delivery.pickup_city} to {delivery.delivery_city}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Customer: {delivery.User?.full_name || 'Unknown'} • Package: {delivery.package_type}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-700">
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600">Route Readiness</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Current field context</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                <MapPinned className="h-4 w-4 text-sky-600" />
                Service zone
              </div>
              <p className="text-sm text-slate-600">
                {user?.city || 'City unavailable'}{user?.subregion ? ` • ${user.subregion}` : ''}
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                <Truck className="h-4 w-4 text-emerald-600" />
                Active workload
              </div>
              <p className="text-sm text-slate-600">
                {user?.active_shipments_count || 0} shipments currently in motion.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                <PackageCheck className="h-4 w-4 text-amber-600" />
                Performance rating
              </div>
              <p className="text-sm text-slate-600">
                {user?.rating || 0} / 5 current service rating.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgentDashboard;
