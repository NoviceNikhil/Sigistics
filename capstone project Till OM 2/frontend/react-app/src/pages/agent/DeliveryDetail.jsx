import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock3, MapPinned, Navigation, Package, Send, ShieldAlert, UserCircle2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  clearSelectedDelivery,
  fetchAgentDeliveryDetail,
  updateAgentDeliveryLocationThunk,
  updateAgentDeliveryStatusThunk,
} from '@/store/agentPortalSlice';
import { getPublicLocations } from '@/services/locationService';

const statusActionLabels = {
  picked: 'Mark as Picked',
  in_transit: 'Mark as In Transit',
  delivered: 'Mark as Delivered',
};

const DeliveryDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    selectedDelivery,
    history,
    allowedNextStatuses,
    detailLoading,
    actionLoading,
  } = useSelector((state) => state.agentPortal);

  const [pendingStatus, setPendingStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const [currentCity, setCurrentCity] = useState('');
  const [currentSubregion, setCurrentSubregion] = useState('');

  useEffect(() => {
    dispatch(fetchAgentDeliveryDetail(id));
    return () => dispatch(clearSelectedDelivery());
  }, [dispatch, id]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await getPublicLocations({ limit: 1000, sort: 'city' });
        setLocationOptions(data.locations || []);
      } catch (error) {
        console.error('Failed to load location options', error);
      }
    };

    loadLocations();
  }, []);

  useEffect(() => {
    setCurrentCity(selectedDelivery?.current_city || '');
    setCurrentSubregion(selectedDelivery?.current_subregion || '');
  }, [selectedDelivery]);

  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    if (!pendingStatus) return;

    const confirmed = window.confirm(
      `Are you sure you want to move this delivery to "${pendingStatus.replace('_', ' ')}"?`,
    );
    if (!confirmed) return;

    const result = await dispatch(
      updateAgentDeliveryStatusThunk({
        id,
        payload: { new_status: pendingStatus, notes },
      }),
    );

    if (updateAgentDeliveryStatusThunk.fulfilled.match(result)) {
      toast.success('Delivery status updated');
      setNotes('');
      setPendingStatus('');
    } else {
      toast.error(result.payload?.message || 'Failed to update delivery status');
    }
  };

  const handleLocationSubmit = async (event) => {
    event.preventDefault();
    if (!currentCity || !currentSubregion) return;

    const result = await dispatch(
      updateAgentDeliveryLocationThunk({
        id,
        payload: {
          current_city: currentCity,
          current_subregion: currentSubregion,
        },
      }),
    );

    if (updateAgentDeliveryLocationThunk.fulfilled.match(result)) {
      toast.success('Checkpoint updated');
    } else {
      toast.error(result.payload?.message || 'Failed to update checkpoint');
    }
  };

  const uniqueCities = [...new Set(locationOptions.map((location) => location.city))];
  const subregionOptions = locationOptions.filter((location) => location.city === currentCity);
  const formatPlace = (value) =>
    value
      ? value
          .split(' ')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      : 'Not updated';

  if (detailLoading || !selectedDelivery) {
    return <div className="mt-20"><LoadingSpinner text="Loading delivery detail..." /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/agent/deliveries" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Back to deliveries
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.28em] text-sky-600">
            {selectedDelivery.shipment_code}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {selectedDelivery.pickup_city} to {selectedDelivery.delivery_city}
          </h1>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-700 shadow-sm">
          {selectedDelivery.status.replace('_', ' ')}
        </span>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-xl font-black text-slate-950">Delivery summary</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <MapPinned className="h-4 w-4 text-sky-600" />
                  Pickup
                </div>
                <p className="text-base font-semibold text-slate-950">{selectedDelivery.pickup_city}</p>
                <p className="text-sm text-slate-500">{selectedDelivery.pickup_subregion || 'Subregion not provided'}</p>
              </div>

              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Send className="h-4 w-4 text-emerald-600" />
                  Delivery
                </div>
                <p className="text-base font-semibold text-slate-950">{selectedDelivery.delivery_city}</p>
                <p className="text-sm text-slate-500">{selectedDelivery.delivery_subregion || 'Subregion not provided'}</p>
              </div>

              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Package className="h-4 w-4 text-amber-600" />
                  Package
                </div>
                <p className="text-base font-semibold text-slate-950 capitalize">{selectedDelivery.package_type}</p>
                <p className="text-sm text-slate-500">
                  {selectedDelivery.weight_kg ? `${selectedDelivery.weight_kg} kg` : 'Weight not provided'}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Clock3 className="h-4 w-4 text-indigo-600" />
                  ETA
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {selectedDelivery.eta_hours ? `${selectedDelivery.eta_hours} hours` : 'Pending'}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedDelivery.expected_delivery_at
                    ? new Date(selectedDelivery.expected_delivery_at).toLocaleString()
                    : 'Expected time not available'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <UserCircle2 className="h-4 w-4 text-slate-700" />
                  Customer
                </div>
                <p className="text-base font-semibold text-slate-950">{selectedDelivery.User?.full_name || 'Unknown'}</p>
                <p className="text-sm text-slate-500">{selectedDelivery.User?.email || 'No email provided'}</p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <ShieldAlert className="h-4 w-4 text-slate-700" />
                  Delay flags
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {selectedDelivery.is_delayed ? 'Delayed' : 'On track'}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedDelivery.delay_reason || 'No delay reason recorded'}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-4 sm:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Navigation className="h-4 w-4 text-slate-700" />
                  Current checkpoint
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {formatPlace(selectedDelivery.current_city)}{selectedDelivery.current_subregion ? `, ${formatPlace(selectedDelivery.current_subregion)}` : ''}
                </p>
                <p className="text-sm text-slate-500">
                  Update this while the parcel is in transit so the latest subregion is visible.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600">Status timeline</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">History</h2>
            </div>

            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="mt-1 h-3 w-3 rounded-full bg-sky-500" />
                    <div className="mt-2 h-full w-px bg-slate-200" />
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {item.previous_status.replace('_', ' ')} to {item.new_status.replace('_', ' ')}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{item.notes || 'No notes added'}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-600">Status actions</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Update this delivery</h2>
            </div>

            {allowedNextStatuses.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                No further agent actions are available for this shipment.
              </div>
            ) : (
              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div className="grid gap-3">
                  {allowedNextStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setPendingStatus(status)}
                      className={`rounded-[1.25rem] border px-4 py-3 text-left text-sm font-bold transition ${
                        pendingStatus === status
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                      }`}
                    >
                      {statusActionLabels[status] || status}
                    </button>
                  ))}
                </div>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Add optional delivery notes, for example: Package collected from reception."
                  className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={!pendingStatus || actionLoading}
                  className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading
                    ? 'Updating delivery...'
                    : pendingStatus
                      ? `${statusActionLabels[pendingStatus]}`
                      : 'Choose a status action'}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600">Transit checkpoint</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Update current location</h2>
            </div>

            {selectedDelivery.status !== 'in_transit' ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Location updates are enabled only while this parcel is in transit.
              </div>
            ) : (
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Current city</label>
                  <select
                    value={currentCity}
                    onChange={(event) => {
                      setCurrentCity(event.target.value);
                      setCurrentSubregion('');
                    }}
                    className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
                  >
                    <option value="">Select city</option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>
                        {formatPlace(city)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Current subregion</label>
                  <select
                    value={currentSubregion}
                    onChange={(event) => setCurrentSubregion(event.target.value)}
                    disabled={!currentCity}
                    className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Select subregion</option>
                    {subregionOptions.map((location) => (
                      <option key={location.id} value={location.subregion}>
                        {formatPlace(location.subregion)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!currentCity || !currentSubregion || actionLoading}
                  className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? 'Updating checkpoint...' : 'Save current location'}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-600">Operational notes</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Only assigned deliveries in your queue can be updated.</li>
              <li>Allowed sequence: assigned → picked → in transit → delivered.</li>
              <li>Checkpoint updates are available only during the in-transit stage.</li>
              <li>Delivered or cancelled shipments are locked from further changes.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeliveryDetail;
