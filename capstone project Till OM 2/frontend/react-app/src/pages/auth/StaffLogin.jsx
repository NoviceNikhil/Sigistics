import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDispatch } from "react-redux";
import { loginStaff } from "@/store/authSlice";
import { useToast } from "@/hooks/use-toast";
import { Shield, Truck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

// ── helpers ────────────────────────────────────────────────────────────────────
const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const StaffLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("delivery");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ── rate-limit lockout ─────────────────────────────────────────────────────
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const timerRef = useRef(null);

  const startLockout = (seconds) => {
    setLockoutSeconds(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const isLockedOut = lockoutSeconds > 0;
  // ──────────────────────────────────────────────────────────────────────────

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (e) => {
    const value = e.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const isFormValid = email && password && !emailError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isLockedOut) return;

    setLoading(true);
    try {
      const resultAction = await dispatch(loginStaff({ email, password, role }));

      if (loginStaff.fulfilled.match(resultAction)) {
        const payload = resultAction.payload?.data || resultAction.payload;

        if (payload?.isAdmin) {
          if (role !== "admin") {
            import("@/store/authSlice").then(({ fullLogout }) => dispatch(fullLogout()));
            toast({ title: "Error", description: "Agent not registered", variant: "destructive" });
            return;
          }
          toast({ title: "Admin OTP sent to email" });
          navigate("/verify-otp");
        } else {
          if (role === "admin") {
            import("@/store/authSlice").then(({ fullLogout }) => dispatch(fullLogout()));
            toast({ title: "Error", description: "Admin not registered", variant: "destructive" });
            return;
          }
          toast({ title: `Logged in as Delivery Agent` });
          navigate("/delivery/dashboard");
        }
      } else {
        // ── check for rate-limit 429 ──────────────────────────────────────
        const errPayload = resultAction.payload;
        if (errPayload?.status === 429 || errPayload?.statusCode === 429) {
          const wait = errPayload?.retryAfter ?? 300;
          startLockout(wait);
          toast({
            title: "Too many attempts",
            description: `Account temporarily locked. Try again in ${fmt(wait)}.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: errPayload?.message || "Login failed",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={role === "admin" ? "Welcome Admin" : "Welcome Agent"} subtitle="Staff Login">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Tabs defaultValue="delivery" onValueChange={(v) => setRole(v)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="delivery" className="gap-2">
              <Truck className="h-4 w-4" /> Delivery Agent
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" /> Admin
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label>Email<span className="text-red-500 ml-1">*</span></Label>
          <Input
            type="email"
            placeholder="staff@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            onBlur={validateEmail}
            required
            disabled={isLockedOut}
            className={`border-l-4 ${emailError ? "border-l-destructive border-destructive focus-visible:ring-destructive" : "border-l-primary"}`}
          />
          {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
        </div>

        <div className="space-y-2">
          <Label>Password<span className="text-red-500 ml-1">*</span></Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLockedOut}
            className="border-l-4 border-l-primary"
          />
        </div>

        {role !== "admin" && (
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm tracking-tight text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        )}

        <Button
          type="submit"
          className="w-full rounded-full transition-all duration-300 disabled:opacity-[0.65] disabled:blur-[0.5px] disabled:shadow-none disabled:cursor-not-allowed"
          disabled={!isFormValid || loading || isLockedOut}
        >
          {loading ? "Signing in..." : `Login as ${role === "admin" ? "Admin" : "Delivery Agent"}`}
        </Button>

        {/* ── lockout countdown timer ──────────────────────────────────────── */}
        {isLockedOut && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Too many attempts — try again in{" "}
              <span className="font-semibold tabular-nums">{fmt(lockoutSeconds)}</span>
            </span>
          </div>
        )}
        {/* ─────────────────────────────────────────────────────────────────── */}

        {role === "delivery" && (
          <p className="text-center tracking-tight text-sm text-muted-foreground mt-6">
            Want to work with us as a delivery partner?{" "}
            <Link to="/delivery/signup" className="text-primary font-medium hover:underline">
              Register here
            </Link>
          </p>
        )}
      </form>
    </AuthLayout>
  );
};

export default StaffLogin;
