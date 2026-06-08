import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { fetchAgentDeliveries } from '@/store/agentPortalSlice';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'picked', label: 'Picked' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
];

const statusStyles = {
  assigned: 'bg-amber-50 text-amber-700 border-amber-200',
  picked: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  in_transit: 'bg-sky-50 text-sky-700 border-sky-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const AgentDeliveries = () => {
  const dispatch = useDispatch();
  const { deliveries, meta, loading } = useSelector((state) => state.agentPortal);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const page = Number.parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    dispatch(
      fetchAgentDeliveries({
        page,
        limit: 8,
        status: status || undefined,
        search: search || undefined,
        sort: 'expected_delivery_at',
      }),
    );
  }, [dispatch, page, search, status]);

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
      else params.delete(key);
    });
    if (!('page' in next)) params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateParams({ search, page: 1 });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-600">Delivery Queue</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">My deliveries</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review all shipments assigned to you, search by route or shipment code, and open a delivery to update its status.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Showing <span className="font-bold text-slate-950">{meta?.total ?? 0}</span> assigned deliveries
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by shipment code, pickup city, delivery city, or package type"
              className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
            />
          </form>

          <label className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                updateParams({ status: event.target.value, page: 1 });
              }}
              className="h-12 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner text="Loading deliveries..." />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-slate-900">No deliveries match this view</h2>
            <p className="mt-2 text-sm text-slate-500">
              Try clearing the search or switching the status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="p-5 transition hover:bg-slate-50/80">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                        {delivery.shipment_code}
                      </p>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${statusStyles[delivery.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        {delivery.pickup_city} to {delivery.delivery_city}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Customer: {delivery.User?.full_name || 'Unknown'} • Package: {delivery.package_type}
                        {delivery.weight_kg ? ` • ${delivery.weight_kg} kg` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span>Pickup zone: {delivery.pickup_subregion || 'N/A'}</span>
                      <span>Delivery zone: {delivery.delivery_subregion || 'N/A'}</span>
                      <span>ETA: {delivery.eta_hours ? `${delivery.eta_hours} hrs` : 'Pending'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/agent/deliveries/${delivery.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      Open delivery
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={meta?.page || 1}
          totalPages={meta?.totalPages || 1}
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
        />
      </section>
    </div>
  );
};

export default AgentDeliveries;
