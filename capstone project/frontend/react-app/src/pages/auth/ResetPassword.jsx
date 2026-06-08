import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '@/store/authSlice';
import { useNavigate, Navigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import PasswordMatchInput from "@/components/PasswordMatchInput";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, resetToken, resetEmail } = useSelector((state) => state.auth);

  if (!resetToken || !resetEmail) {
    return <Navigate to="/login" replace />;
  }

  const isFormValid = newPassword && confirmPassword && (newPassword === confirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      const resultAction = await dispatch(resetPassword({
        email: resetEmail,
        newPassword,
        token: resetToken
      }));
      
      if (resetPassword.fulfilled.match(resultAction)) {
        toast({ title: "Success", description: "Password reset successfully" });
        navigate('/login');
      } else {
        toast({ title: "Error", description: resultAction.payload?.message || "Failed to reset password", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="Account Recovery" subtitle="New Password">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-muted-foreground mb-4">
          Create a new strong password for your account.
        </p>
        
        <div className="space-y-2">
          <Label>New Password<span className="text-red-500 ml-1">*</span></Label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            required 
            className="border-l-4 border-l-primary" 
          />
        </div>

        <PasswordMatchInput
          password={newPassword}
          confirmPassword={confirmPassword}
          onConfirmChange={setConfirmPassword}
        />

        <Button 
          type="submit" 
          className="w-full rounded-full transition-all duration-300 disabled:opacity-[0.65] disabled:blur-[0.5px] disabled:shadow-none disabled:cursor-not-allowed" 
          disabled={!isFormValid || loading}
        >
          {loading ? "Resetting..." : "Update Password"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;

