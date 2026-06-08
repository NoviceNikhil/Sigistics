import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { loginStaff } from '@/store/authSlice';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const formatWait = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const AgentLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startLockout = (seconds) => {
    setLockoutSeconds(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLockoutSeconds((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password || lockoutSeconds > 0) return;

    setLoading(true);
    try {
      const resultAction = await dispatch(
        loginStaff({ email, password, role: 'delivery' }),
      );

      if (loginStaff.fulfilled.match(resultAction)) {
        toast({
          title: 'Delivery agent login successful',
          description: 'Your assigned deliveries are ready.',
        });
        navigate('/agent/dashboard');
        return;
      }

      const payload = resultAction.payload;
      if (payload?.status === 429 || payload?.statusCode === 429) {
        const retryAfter = payload?.retryAfter ?? 300;
        startLockout(retryAfter);
        toast({
          title: 'Too many attempts',
          description: `Try again in ${formatWait(retryAfter)}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Login failed',
        description: payload?.message || 'Access restricted to delivery agents.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Delivery Agent Login"
      subtitle="Access your delivery queue and update shipment progress"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-[1.75rem] border border-sky-100 bg-sky-50/70 p-4 text-slate-700">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-700">
            <Truck className="h-4 w-4" />
            Agent access only
          </div>
          <p className="text-sm leading-6">
            Sign in with the email and password assigned to your delivery-agent account.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="agent@example.com"
            disabled={lockoutSeconds > 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            disabled={lockoutSeconds > 0}
            required
          />
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
          <Link to="/staff/login" className="text-slate-500 hover:text-slate-900 hover:underline">
            Admin login
          </Link>
        </div>

        <Button type="submit" className="w-full rounded-full" disabled={loading || lockoutSeconds > 0}>
          {loading ? 'Signing in...' : 'Open Agent Portal'}
        </Button>

        {lockoutSeconds > 0 && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            Too many attempts. Try again in {formatWait(lockoutSeconds)}.
          </p>
        )}
      </form>
    </AuthLayout>
  );
};

export default AgentLogin;
