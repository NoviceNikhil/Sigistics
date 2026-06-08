import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchProfile } from '@/store/authSlice';
import { Loader2 } from 'lucide-react';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // The browser has the HttpOnly cookie attached to this request so it will identify the user automatically
    dispatch(fetchProfile()).then((action) => {
      const user = action.payload?.data || action.payload;
      if (user && !action.error) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', user.role || 'user');
        
        // Use a 1 second delay to feel smooth
        setTimeout(() => {
          // Force a full React state reload to route dynamically through App.jsx
          window.location.replace('/');
        }, 1000);
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate('/login');
      }
    });
  }, [dispatch, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">Securing your session...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
