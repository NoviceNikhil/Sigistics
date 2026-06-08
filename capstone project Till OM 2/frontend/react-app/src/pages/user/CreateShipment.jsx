import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { createOrder, verifyPayment } from "../../services/paymentService";
import { getPublicLocations } from "../../services/locationService";
import {
  MapPin, Truck, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Plus, Package, Weight, FileText
} from "lucide-react";

const STEPS = [
  { label: "Pickup", icon: MapPin },
  { label: "Delivery", icon: Truck },
  { label: "Review", icon: CheckCircle2 },
];

const packageTypeFromWeight = (kg) => {
  const w = parseFloat(kg);
  if (isNaN(w)) return "";
  if (w < 5) return "small";
  if (w <= 20) return "medium";
  return "large";
};

const PACKAGE_META = {
  small: { emoji: "📦", label: "Small", hint: "< 5 kg" },
  medium: { emoji: "🗃️", label: "Medium", hint: "5–20 kg" },
  large: { emoji: "📫", label: "Large", hint: "> 20 kg" },
};

const calculateDistance = (f) => {
  if (!f.pickup_city || !f.delivery_city) return 0;
  if (f.pickup_city === f.delivery_city && f.pickup_subregion === f.delivery_subregion) return 5;
  if (f.pickup_city === f.delivery_city) return 15;
  return 500;
};

/* ── Shared field components ── */

const Label = ({ children, required }) => (
  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
    {children}
    {required && <span className="text-red-400 ml-1">*</span>}
  </label>
);

const SelectField = ({ value, onChange, onBlur, disabled, error, children }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      className={`w-full bg-white border border-slate-200 text-gray-700 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all appearance-none cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? "ring-2 ring-red-200" : ""}`}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <ChevronRight size={14} className={`transform rotate-90 ${disabled ? "text-slate-300" : "text-slate-400"}`} />
    </div>
  </div>
);

const FieldError = ({ msg }) => msg ? (
  <p className="mt-1.5 text-xs text-red-500 font-bold flex items-center gap-1">
    <AlertCircle size={12} />
    {msg}
  </p>
) : null;

/* ── Main component ── */

const CreateShipment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [cities, setCities] = useState([]);
  const [citySubregions, setCitySubregions] = useState({});

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getPublicLocations({ limit: 1000 });
        const locs = data.locations || [];
        
        const locCities = [...new Set(locs.map(l => l.city))].filter(Boolean);
        const map = {};
        locCities.forEach(c => {
          map[c] = locs.filter(l => l.city === c && l.subregion).map(l => l.subregion);
        });
        setCities(locCities);
        setCitySubregions(map);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocations();
  }, []);

  const [touched, setTouched] = useState({
    pickup_subregion: false,
    delivery_subregion: false,
  });

  const [form, setForm] = useState({
    pickup_city: "", pickup_subregion: "",
    delivery_city: "", delivery_subregion: "",
    package_type: "", weight_kg: "", notes: "",
  });

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const touch = (f) => setTouched((p) => ({ ...p, [f]: true }));
  const updateCity = (cf, sf, v) => {
    setForm((p) => ({ ...p, [cf]: v, [sf]: "" }));
    setTouched((p) => ({ ...p, [sf]: false }));
  };
  const updateWeight = (v) =>
    setForm((p) => ({ ...p, weight_kg: v, package_type: packageTypeFromWeight(v) }));

  const isStepValid = (s, f) => {
    if (s === 0) return !!f.pickup_city && !!f.pickup_subregion;
    if (s === 1) {
      if (!f.delivery_city || !f.delivery_subregion || !f.weight_kg) return false;
      const w = parseFloat(f.weight_kg);
      return w >= 0.1 && w <= 50;
    }
    return true;
  };

  const handleContinue = () => {
    if (step === 0) touch("pickup_subregion");
    if (step === 1) touch("delivery_subregion");
    if (isStepValid(step, form)) {
      setStep((s) => s + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        setError("Razorpay SDK failed to load. Are you online?");
        setLoading(false);
        return;
      }

      const orderOptions = {
        amountrs: paymentAmount * 100,
        userId: "customer"
      };

      const order = await createOrder(orderOptions);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummy",
        amount: order.amount,
        currency: "INR",
        name: "Logistics App",
        description: "Payment for Shipment",
        order_id: order.id,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const payload = { ...form };
            if (!payload.notes) delete payload.notes;

            const res = await api.post("/api/customer/shipments", payload);
            navigate(`/customer/shipments/${res.data.data.id}`);
          } catch (err) {
            setError("Payment verification or shipment creation failed.");
            setLoading(false);
          }
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        setError("Payment Failed! Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to initiate payment.");
      setLoading(false);
    }
  };

  const weightVal = parseFloat(form.weight_kg);
  const weightError = form.weight_kg !== "" && (weightVal < 0.1 || weightVal > 50);
  const stepValid = isStepValid(step, form);

  const distance = calculateDistance(form);
  const paymentAmount = distance > 0 ? (distance * 5 + 20) : 0;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 min-h-screen font-sans relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-[50px] right-[-50px] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto">

        {/* ── HEADER ── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 sm:gap-3">
            <Plus className="text-indigo-600" size={24} /> Create Shipment
          </h1>
          <p className="text-[10px] font-black text-slate-400 mt-1 tracking-widest uppercase">
            New Booking · Fast, reliable delivery with real-time agent assignment
          </p>
        </div>

        {/* ── STEP INDICATOR ── */}
        <div className="admin-minimal-card p-5 mb-5">
          <div className="flex items-center">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              return (
                <div key={s.label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                      ${idx < step
                        ? "bg-slate-900 text-white shadow-md"
                        : idx === step
                          ? "bg-indigo-50 text-indigo-600 ring-4 ring-indigo-100 border border-indigo-200"
                          : "bg-gray-100 text-slate-300"}`}
                    >
                      {idx < step ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <StepIcon size={18} />
                      )}
                    </div>
                    <span className={`text-[10px] mt-2 font-black uppercase tracking-widest
                      ${idx === step ? "text-indigo-600" : idx < step ? "text-slate-600" : "text-slate-300"}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 mx-3 mb-5">
                      <div className={`h-0.5 rounded-full transition-all duration-500
                        ${idx < step ? "bg-slate-900" : "bg-slate-100"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FORM CARD ── */}
        <div className="admin-minimal-card overflow-hidden mb-5">
          <div className={`h-1 transition-all duration-500 ${step === 0 ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
            step === 1 ? "bg-gradient-to-r from-indigo-500 to-purple-500" :
              "bg-gradient-to-r from-emerald-400 to-teal-500"
            }`} />

          <div className="p-6 sm:p-8">

            {/* ── Step 0: Pickup ── */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Pickup Location</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Where should we collect the package?</p>
                  </div>
                </div>

                <div>
                  <Label required>Pickup City</Label>
                  <SelectField
                    value={form.pickup_city}
                    onChange={(e) => updateCity("pickup_city", "pickup_subregion", e.target.value)}
                  >
                    <option value="">— Select city —</option>
                    {cities.map((c) => <option key={c}>{c}</option>)}
                  </SelectField>
                </div>

                <div>
                  <Label required>Pickup Area / Subregion</Label>
                  <SelectField
                    value={form.pickup_subregion}
                    onChange={(e) => { update("pickup_subregion", e.target.value); touch("pickup_subregion"); }}
                    onBlur={() => touch("pickup_subregion")}
                    disabled={!form.pickup_city}
                    error={touched.pickup_subregion && !form.pickup_subregion}
                  >
                    <option value="">— Select area —</option>
                    {(citySubregions[form.pickup_city] || []).map((s) => <option key={s}>{s}</option>)}
                  </SelectField>
                  {!form.pickup_city
                    ? <p className="mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select a city first to see areas</p>
                    : touched.pickup_subregion && !form.pickup_subregion
                      ? <FieldError msg="Please select an area to continue" />
                      : form.pickup_subregion
                        ? <p className="mt-1.5 text-xs text-emerald-600 font-black flex items-center gap-1">
                          <CheckCircle2 size={12} /> {form.pickup_subregion}
                        </p>
                        : null
                  }
                </div>

                <div className="flex items-start gap-2.5 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <span className="font-black">Agent auto-assigned</span> — the best available agent in your pickup area will be assigned after submission.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 1: Delivery ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Delivery Details</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Where and what are we delivering?</p>
                  </div>
                </div>

                <div>
                  <Label required>Delivery City</Label>
                  <SelectField
                    value={form.delivery_city}
                    onChange={(e) => updateCity("delivery_city", "delivery_subregion", e.target.value)}
                  >
                    <option value="">— Select city —</option>
                    {cities.map((c) => <option key={c}>{c}</option>)}
                  </SelectField>
                </div>

                <div>
                  <Label required>Delivery Area / Subregion</Label>
                  <SelectField
                    value={form.delivery_subregion}
                    onChange={(e) => { update("delivery_subregion", e.target.value); touch("delivery_subregion"); }}
                    onBlur={() => touch("delivery_subregion")}
                    disabled={!form.delivery_city}
                    error={touched.delivery_subregion && !form.delivery_subregion}
                  >
                    <option value="">— Select area —</option>
                    {(citySubregions[form.delivery_city] || []).map((s) => {
                      const isSameAsPickup = form.pickup_city === form.delivery_city && form.pickup_subregion === s;
                      return (
                        <option key={s} value={s} disabled={isSameAsPickup} style={isSameAsPickup ? { color: '#cbd5e1' } : {}}>
                          {s}{isSameAsPickup ? ' (same as pickup)' : ''}
                        </option>
                      );
                    })}
                  </SelectField>
                  {!form.delivery_city
                    ? <p className="mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select a city first</p>
                    : touched.delivery_subregion && !form.delivery_subregion
                      ? <FieldError msg="Please select an area to continue" />
                      : form.delivery_subregion
                        ? <p className="mt-1.5 text-xs text-emerald-600 font-black flex items-center gap-1">
                          <CheckCircle2 size={12} /> {form.delivery_subregion}
                        </p>
                        : null
                  }
                </div>

                <div className="border-t border-slate-100 pt-1" />

                <div>
                  <Label required>Weight (kg)</Label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g. 2.5"
                      min="0.1" max="50" step="0.1"
                      value={form.weight_kg}
                      onChange={(e) => updateWeight(e.target.value)}
                      className={`w-full bg-white border border-slate-200 text-gray-700 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 text-sm transition-all pr-14 cursor-text
                        ${weightError ? "ring-2 ring-red-200 focus:ring-red-400" : "focus:ring-blue-500"}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">kg</span>
                  </div>
                  {weightError
                    ? <FieldError msg="Weight must be between 0.1 kg and 50 kg" />
                    : <p className="mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {form.weight_kg ? "Package size auto-selected below" : "Enter weight — package size sets automatically"}
                    </p>
                  }
                </div>

                <div>
                  <Label required>Package Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(PACKAGE_META).map(([type, meta]) => {
                      const selected = form.package_type === type;
                      return (
                        <div key={type}
                          className={`relative rounded-xl border-2 py-4 text-center transition-all duration-200 select-none
                            ${selected
                              ? "border-slate-900 bg-slate-50 shadow-md"
                              : "border-slate-100 bg-gray-50 opacity-40"}`}
                        >
                          {selected && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                              <CheckCircle2 size={10} className="text-white" />
                            </div>
                          )}
                          <div className="text-2xl mb-1">{meta.emoji}</div>
                          <div className={`text-[10px] font-black uppercase tracking-widest ${selected ? "text-slate-900" : "text-slate-400"}`}>{meta.label}</div>
                          <div className={`text-[9px] mt-0.5 font-bold ${selected ? "text-slate-500" : "text-slate-300"}`}>{meta.hint}</div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auto-selected based on weight entered above</p>
                </div>

                <div>
                  <Label>Notes <span className="text-slate-400 font-bold">(optional)</span></Label>
                  <textarea
                    rows={2}
                    placeholder="Any special handling instructions…"
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    className="w-full bg-white border border-slate-200 text-gray-700 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all resize-none cursor-text"
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Review ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Review & Confirm</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Check everything before submitting</p>
                  </div>
                </div>

                <div className="admin-minimal-card overflow-hidden">
                  <div className="flex items-stretch">
                    <div className="flex-1 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Pickup</p>
                      <p className="text-sm font-black text-slate-900">{form.pickup_city}</p>
                      <p className="text-xs text-blue-600 font-bold mt-0.5">{form.pickup_subregion}</p>
                    </div>
                    <div className="flex items-center px-4">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-md">
                        <ChevronRight size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 p-4 text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Delivery</p>
                      <p className="text-sm font-black text-slate-900">{form.delivery_city}</p>
                      <p className="text-xs text-indigo-600 font-bold mt-0.5">{form.delivery_subregion}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="admin-minimal-card p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Package</p>
                    <p className="text-sm font-black text-slate-800 capitalize">
                      {PACKAGE_META[form.package_type]?.emoji} {form.package_type}
                    </p>
                  </div>
                  <div className="admin-minimal-card p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Weight</p>
                    <p className="text-sm font-black text-slate-800">
                      {form.weight_kg} <span className="text-slate-400 font-bold text-xs">kg</span>
                    </p>
                  </div>
                </div>

                <div className="admin-minimal-card overflow-hidden divide-y divide-slate-50 mt-3">
                  {[
                    { icon: "📍", label: "Est. Distance", value: `${distance} km`, muted: false },
                    { icon: "💵", label: "Amount to Pay", value: `₹${paymentAmount}`, muted: false },
                    { icon: "🕐", label: "Expected Delivery", value: "Auto-calculated after submission", muted: true },
                    { icon: "👤", label: "Delivery Agent", value: "Auto-assigned after submission", muted: true },
                    ...(form.notes ? [{ icon: "📝", label: "Notes", value: form.notes, muted: false }] : []),
                  ].map(({ icon, label, value, muted }) => (
                    <div key={label} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-base">{icon}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-36 shrink-0">{label}</span>
                      <span className={`text-xs ml-auto text-right ${muted ? "text-slate-400 italic font-bold" : "font-black text-slate-700"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="font-bold">{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── NAVIGATION ── */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => step === 0 ? navigate(-1) : setStep((s) => s - 1)}
            className="admin-secondary-btn flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft size={14} />
            {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < 2 ? (
            <button
              onClick={handleContinue}
              className={`flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-sm hover:bg-black transition-all font-black uppercase text-xs tracking-widest cursor-pointer
                ${!stepValid ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-900 text-white px-7 py-3 rounded-xl shadow-sm hover:bg-black transition-all font-black uppercase text-xs tracking-widest cursor-pointer
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Pay ₹{paymentAmount} and Create
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;