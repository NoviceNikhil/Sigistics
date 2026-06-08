import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PasswordMatchInput = ({ password, confirmPassword, onConfirmChange, className }) => {
  const [showStatus, setShowStatus] = useState(false);
  const timerRef = useRef(null);
  
  useEffect(() => {
    setShowStatus(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (confirmPassword.length > 0) {
      timerRef.current = setTimeout(() => setShowStatus(true), 1e3);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [confirmPassword, password]);
  
  const isMatch = password === confirmPassword && password.length > 0;
  
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label>Confirm Password<span className="text-red-500 ml-1">*</span></Label>
      <div className="relative">
        <Input
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => onConfirmChange(e.target.value)}
          required
          className={cn(
            showStatus && confirmPassword.length > 0 ? "pr-[68px]" : "",
            showStatus ? isMatch ? "border-green-500 focus-visible:border-green-500" : "border-red-500 focus-visible:border-red-500" : ""
          )}
        />
        {showStatus && confirmPassword.length > 0 && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
            {isMatch ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
          </div>
        )}
      </div>
      {showStatus && confirmPassword.length > 0 && (
        <p className={`text-xs font-medium ${isMatch ? "text-green-500" : "text-red-500"}`}>
          {isMatch ? "✓ Passwords matched" : "! Passwords do not match"}
        </p>
      )}
    </div>
  );
};

export default PasswordMatchInput;
