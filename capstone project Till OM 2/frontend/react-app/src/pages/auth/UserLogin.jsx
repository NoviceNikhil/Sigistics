import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useDispatch } from "react-redux";
import { loginUser } from "@/store/authSlice";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";

// ── helpers ────────────────────────────────────────────────────────────────────
const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ── rate-limit lockout ─────────────────────────────────────────────────────
  const [lockoutSeconds, setLockoutSeconds] = useState(0); // 0 = not locked
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

  // cleanup on unmount
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
      const resultAction = await dispatch(loginUser({ email, password }));

      if (loginUser.fulfilled.match(resultAction)) {
        const payload = resultAction.payload?.data || resultAction.payload;
        if (payload?.isAdmin) {
          import("@/store/authSlice").then(({ clearOtpState }) => {
            dispatch(clearOtpState());
          });
          toast({ title: "Error", description: "User not registered", variant: "destructive" });
        } else {
          toast({ title: "Login successful!" });
          navigate("/dashboard");
        }
      } else {
        // ── check for rate-limit 429 ──────────────────────────────────────
        const errPayload = resultAction.payload;
        if (errPayload?.status === 429 || errPayload?.statusCode === 429) {
          const wait = errPayload?.retryAfter ?? 300; // default 5 min
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
    <AuthLayout title="Welcome Back" subtitle="Login Account">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email ID<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
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
          {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            Password<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLockedOut}
            className="border-l-4 border-l-primary"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="keep-signed" />
            <Label htmlFor="keep-signed" className="text-sm font-normal text-muted-foreground cursor-pointer tracking-tight">
              Keep me signed in
            </Label>
          </div>
          <Link to="/forgot-password" className="text-sm tracking-tight text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full rounded-full transition-all duration-300 disabled:opacity-[0.65] disabled:blur-[0.5px] disabled:shadow-none disabled:cursor-not-allowed"
          disabled={!isFormValid || loading || isLockedOut}
        >
          {loading ? "Signing in..." : "Sign In"}
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

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground tracking-widest">Or</span>
          </div>
        </div>

        <Button
          type="button"
          className="w-full rounded-full transition-all duration-300 bg-[#dbd9d5] hover:bg-[#dbd9d5]/90 text-black"
          onClick={() => {
            import("@/utils/constants").then(({ API_BASE_URL }) => {
              window.location.href = `${API_BASE_URL}/auth/google`;
            });
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center tracking-tight text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Signup
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
export default UserLogin;
