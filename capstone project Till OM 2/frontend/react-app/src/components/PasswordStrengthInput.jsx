import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Inject SHM keyframe once ─────────────────────────────────────────────────
const SHM_STYLE_ID = "pw-shm-style";
if (typeof document !== "undefined" && !document.getElementById(SHM_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = SHM_STYLE_ID;
  style.textContent = `
    @keyframes pw-shm {
      0%   { transform: translateX(-12px); opacity: 0; }
      12%  { transform: translateX(0px);   opacity: 1; }
      24%  { transform: translateX(3px);  }
      36%  { transform: translateX(-3px); }
      48%  { transform: translateX(2px);  }
      60%  { transform: translateX(-2px); }
      72%  { transform: translateX(1px);  }
      84%  { transform: translateX(-1px); }
      92%  { transform: translateX(0.5px);}
      100% { transform: translateX(0px);  opacity: 1; }
    }
    .pw-shm-error {
      animation: pw-shm 1.4s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}

// ─── Criteria ─────────────────────────────────────────────────────────────────
const CRITERIA = [
  { id: "length",  label: "At least 8 characters",        test: (pw) => pw.length >= 8 },
  { id: "upper",   label: "One uppercase letter (A–Z)",    test: (pw) => /[A-Z]/.test(pw) },
  { id: "number",  label: "One number (0–9)",              test: (pw) => /[0-9]/.test(pw) },
  { id: "special", label: "One special character (!@#$…)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export const isPasswordStrong = (pw) => CRITERIA.every((c) => c.test(pw));

// ─── Component ────────────────────────────────────────────────────────────────
const PasswordStrengthInput = ({
  value = "",
  onChange,
  onStrongChange,          // (isStrong: boolean) => void
  placeholder = "••••••••",
  required,
  className,
  inputClassName,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint]         = useState(false);
  const [popupPos, setPopupPos]         = useState({ top: 0, left: 0 });
  // errorKey changes every time the error message should re-animate
  const [errorKey, setErrorKey]         = useState(0);
  const prevWasStrong                   = useRef(true);

  const inputRef     = useRef(null);
  const containerRef = useRef(null);

  // ── Strength ──────────────────────────────────────────────────────────────────
  const passedCount = CRITERIA.filter((c) => c.test(value)).length;
  const strong      = passedCount === 4;
  const showError   = value.length > 0 && !strong;   // show error only after typing started

  // Notify parent when strength changes
  useEffect(() => {
    onStrongChange?.(strong);
  }, [strong, onStrongChange]);

  // Re-trigger animation whenever user types while error is showing
  useEffect(() => {
    if (showError) {
      // Only bump key if it just became "not strong" (was strong before)
      if (prevWasStrong.current) {
        setErrorKey((k) => k + 1);
      }
    }
    prevWasStrong.current = strong;
  }, [showError, strong]);

  // ── Popup positioning ────────────────────────────────────────────────────────
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setPopupPos({
      top:  rect.top  + window.scrollY + rect.height / 2,
      left: rect.right + window.scrollX + 14,
    });
  }, []);

  useEffect(() => {
    if (showHint) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showHint, updatePosition]);

  // Close popup when clicking outside
  useEffect(() => {
    const handler = (e) => {
      const portal = document.getElementById("pw-hint-portal");
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        (!portal || !portal.contains(e.target))
      ) {
        setShowHint(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Shared strength bar colour ───────────────────────────────────────────────
  const barColor =
    passedCount <= 1 ? "#ef4444"
    : passedCount === 2 ? "#fb923c"
    : passedCount === 3 ? "#eab308"
    : "#16a34a";

  const strengthLabel =
    passedCount <= 1 ? "Weak"
    : passedCount === 2 ? "Fair"
    : passedCount === 3 ? "Good"
    : "Strong ✓";

  // ── Portal popup ─────────────────────────────────────────────────────────────
  const popup = showHint ? createPortal(
    <div
      id="pw-hint-portal"
      style={{
        position: "absolute",
        top:  popupPos.top,
        left: popupPos.left,
        transform: "translateY(-50%)",
        zIndex: 9999,
        width: 240,
      }}
    >
      {/* Arrow → left */}
      <div style={{
        position: "absolute", left: -7, top: "50%", transform: "translateY(-50%)",
        width: 0, height: 0,
        borderTop: "7px solid transparent",
        borderBottom: "7px solid transparent",
        borderRight: "7px solid rgba(0,0,0,0.10)",
      }} />

      {/* Card */}
      <div style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,0,0,0.40)", marginBottom: 10 }}>
          Password must have
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {CRITERIA.map((c) => {
            const passed = c.test(value);
            return (
              <li key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {passed
                  ? <CheckCircle2 style={{ width: 14, height: 14, color: "#16a34a", flexShrink: 0 }} />
                  : <XCircle      style={{ width: 14, height: 14, color: "#dc2626", flexShrink: 0 }} />
                }
                <span style={{ fontSize: 12, lineHeight: 1.4, color: passed ? "#16a34a" : "#dc2626", fontWeight: passed ? 500 : 400 }}>
                  {c.label}
                </span>
              </li>
            );
          })}
        </ul>

        {value.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2,3].map((i) => (
                <div key={i} style={{
                  height: 4, flex: 1, borderRadius: 99,
                  background: i < passedCount ? barColor : "rgba(0,0,0,0.08)",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: barColor }}>
              {strengthLabel}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Outer div — ref for outside-click detection */}
      <div ref={containerRef} className={cn(className)}>
        
        <div className="relative">
          <input
            ref={inputRef}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => { updatePosition(); setShowHint(true); }}
            required={required}
            style={showError ? { borderColor: "#f87171", borderLeftColor: "#f87171" } : undefined}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
              "transition-colors placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "pr-[68px]",
              inputClassName,
            )}
          />

          {/* Buttons — centred on the input row only */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Eye toggle */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="h-6 w-6 flex items-center justify-center rounded bg-transparent border-none text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>

            {/* ! hint toggle */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { updatePosition(); setShowHint((p) => !p); }}
              className={cn(
                "h-6 w-6 flex items-center justify-center rounded font-bold text-xs",
                "bg-transparent border transition-colors",
                showHint
                  ? "border-primary text-primary"
                  : "border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary"
              )}
              aria-label="Password requirements"
            >
              !
            </button>
          </div>
        </div>

        {/* Error message — sibling of the inner wrapper, NOT inside it.
            Adding/removing this never affects the button row's position. */}
        {showError && (
          <p
            key={errorKey}
            className="pw-shm-error"
            style={{
              marginTop: 4,
              fontSize: 12,
              fontWeight: 500,
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <XCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
            Password must be strong
          </p>
        )}
      </div>

      {/* Portal popup — renders on document.body, never clipped */}
      {popup}
    </>
  );
};

export default PasswordStrengthInput;

