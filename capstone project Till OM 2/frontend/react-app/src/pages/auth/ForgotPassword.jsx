import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '@/store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState("");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading } = useSelector((state) => state.auth);

  const validateEmail = (e) => {
    const value = e.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const isFormValid = email && !emailError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      return;
    }

    try {
      const resultAction = await dispatch(forgotPassword({ email }));
      if (forgotPassword.fulfilled.match(resultAction)) {
        toast({ title: "Success", description: "OTP sent to your email" });
        navigate('/verify-otp');
      } else {
        toast({ title: "Error", description: resultAction.payload?.message || "Failed to send OTP", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="Account Recovery" subtitle="Reset Password">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-muted-foreground text-center mb-2">
          Enter your email to receive a recovery code
        </p>

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
            className={`border-l-4 ${emailError ? 'border-l-destructive border-destructive focus-visible:ring-destructive' : 'border-l-primary'}`} 
          />
          {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={!isFormValid || loading}
          className="w-full rounded-full transition-all duration-300 disabled:opacity-[0.65] disabled:blur-[0.5px] disabled:shadow-none disabled:cursor-not-allowed"
        >
          {loading ? "Sending code..." : "Send Recovery Code"}
        </Button>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-primary hover:underline transition-colors">
            ← Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
