import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { verifyUserOtp, verifyAdminOtp, verifyDeliveryOtp, resendOtp } from '@/store/authSlice';
import OtpInput from '@/components/OtpInput';
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";

const VerifyOtp = () => {
  const { otpEmail, otpType, otpRole, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // If accessed directly without an active OTP flow
  if (!otpEmail) {
    return <Navigate to="/login" replace />;
  }

  const handleComplete = async (otpValue) => {
    if (otpValue.length !== 6) return;
    setVerifying(true);
    
    try {
      let resultAction;

      switch (otpRole) {
        case 'user':
          resultAction = await dispatch(verifyUserOtp({ email: otpEmail, otp: otpValue, type: otpType }));
          break;
        case 'admin':
          resultAction = await dispatch(verifyAdminOtp({ email: otpEmail, otp: otpValue }));
          break;
        case 'delivery':
          resultAction = await dispatch(verifyDeliveryOtp({ email: otpEmail, otp: otpValue, type: otpType }));
          break;
        default:
          toast({ title: "Error", description: "Invalid role configuration", variant: "destructive" });
          setVerifying(false);
          return;
      }

      if (resultAction.payload?.success) {
        toast({ title: "Success", description: "Successfully verified" });
        
        if (otpType === 'forgot') {
           navigate('/reset-password');
        } else if (otpRole === 'admin') {
           navigate('/admin');
        } else if (otpRole === 'delivery' && otpType === 'signup') {
           toast({ title: "Success", description: "Registration complete. Please log in." });
           navigate('/staff/login?role=delivery');
        } else {
           navigate('/dashboard');
        }
      } else {
        toast({ title: "Error", description: resultAction.payload?.message || "Verification failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AuthLayout title="Verification" subtitle="Verify OTP">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
           <KeyRound className="w-8 h-8 text-primary shadow-sm" />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to
          </p>
          <p className="font-medium text-foreground">{otpEmail}</p>
        </div>

        <div className="w-full max-w-sm pt-4">
          <OtpInput length={6} onComplete={handleComplete} />
        </div>

        {loading || verifying ? (
          <div className="text-sm text-muted-foreground mt-4">
            Verifying code...
          </div>
        ) : (
           <div className="mt-8 text-sm text-center text-muted-foreground">
             Didn't receive the code?{' '}
             <button 
                type="button"
                className="text-primary font-medium hover:underline transition-colors disabled:opacity-50" 
                onClick={async () => {
                  setResending(true);
                  try {
                    const resultAction = await dispatch(resendOtp({ email: otpEmail, role: otpRole }));
                    if (resendOtp.fulfilled.match(resultAction)) {
                      toast({ title: "Success", description: "OTP resent successfully!" });
                    } else {
                      toast({ title: "Error", description: resultAction.payload?.message || "Failed to resend OTP", variant: "destructive" });
                    }
                  } catch (err) {
                    toast({ title: "Error", description: "An error occurred", variant: "destructive" });
                  } finally {
                    setResending(false);
                  }
                }}
                disabled={resending}
             >
                {resending ? "Sending..." : "Resend"}
             </button>
           </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
