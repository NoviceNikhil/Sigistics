import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { useDispatch } from "react-redux";
import { signupDelivery } from "@/store/authSlice";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import PasswordMatchInput from "@/components/PasswordMatchInput";
import PasswordStrengthInput from "@/components/PasswordStrengthInput";
import CustomSelect from "@/components/ui/CustomSelect";
import { API_BASE_URL } from "@/utils/constants";

const DeliverySignup = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", city: "", subregion: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [locationsDB, setLocationsDB] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/public`);
        const data = await res.json();
        if (data.success) {
          setLocationsDB(data.data.locations || []);
        }
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    };
    fetchLocations();
  }, []);

  const cities = [...new Set(locationsDB.map(loc => loc.city))].map(city => ({ value: city, label: city }));
  const subregions = locationsDB
    .filter(loc => loc.city === form.city && loc.subregion)
    .map(loc => ({ value: loc.subregion, label: loc.subregion }));

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const validateEmail = (e) => {
    const value = e.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const validatePhone = (rawNumberString) => {
    if (rawNumberString && rawNumberString.length !== 10) {
      setPhoneError("Number must be exactly 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const isFormValid = form.name && form.email && form.phone && form.phone.length > 10 && form.password && confirmPassword && (form.password === confirmPassword) && form.city && (!emailError) && (!phoneError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const resultAction = await dispatch(signupDelivery(form));
      if (signupDelivery.fulfilled.match(resultAction)) {
        toast({ title: "OTP sent!", description: "Check your email for verification code." });
        navigate("/verify-otp");
      } else {
        toast({ title: "Error", description: resultAction.payload?.message || "Signup failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Delivery Partner" subtitle="Delivery Agent Signup">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name<span className="text-red-500 ml-1">*</span></Label>
            <Input
              placeholder="Your name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              className="border-l-4 border-l-primary"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone<span className="text-red-500 ml-1">*</span></Label>
            <PhoneInput
              value={form.phone}
              onChange={(val) => {
                update("phone", val);
                if (phoneError) setPhoneError("");
              }}
              onBlur={validatePhone}
              error={!!phoneError}
              required
              className="border-l-4 border-l-primary"
            />
            {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Email<span className="text-red-500 ml-1">*</span></Label>
          <Input
            type="email"
            placeholder="agent@example.com"
            value={form.email}
            onChange={(e) => {
              update("email", e.target.value);
              if (emailError) setEmailError("");
            }}
            onBlur={validateEmail}
            required
            className={`border-l-4 ${emailError ? 'border-l-destructive border-destructive focus-visible:ring-destructive' : 'border-l-primary'}`}
          />
          {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
        </div>

        <div className="space-y-2">
          <Label>Password<span className="text-red-500 ml-1">*</span></Label>
          <PasswordStrengthInput
            value={form.password}
            onChange={(val) => update("password", val)}
            required
            inputClassName="border-l-4 border-l-primary"
          />
        </div>
        <PasswordMatchInput
          password={form.password}
          confirmPassword={confirmPassword}
          onConfirmChange={setConfirmPassword}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>City<span className="text-red-500 ml-1">*</span></Label>
            <CustomSelect
              options={cities}
              value={form.city}
              onChange={(e) => {
                update("city", e.target.value);
                update("subregion", "");
              }}
              placeholder="Select City"
              searchable
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Subregion</Label>
            <CustomSelect
              options={subregions}
              value={form.subregion}
              onChange={(e) => update("subregion", e.target.value)}
              placeholder="Select Subregion"
              searchable
              disabled={!form.city || subregions.length === 0}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2 rounded-full transition-all duration-300 disabled:opacity-[0.65] disabled:blur-[0.5px] disabled:shadow-none disabled:cursor-not-allowed"
          disabled={!isFormValid || loading}
        >
          {loading ? "Registering..." : "Register as Agent"}
        </Button>
        <div className="flex items-center justify-between tracking-tight text-sm text-muted-foreground mt-4">
          <p>
            Already registered? <Link to="/staff/login?role=delivery" className="text-primary font-medium hover:underline">Staff Login</Link>
          </p>
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">Forgot Password?</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default DeliverySignup;
