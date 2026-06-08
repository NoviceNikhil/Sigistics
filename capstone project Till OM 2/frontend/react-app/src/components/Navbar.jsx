import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fullLogout } from '../store/authSlice';
import { Truck, User as UserIcon, LogOut, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, role, user } = useSelector((state) => state.auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(fullLogout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isAuthPage = ['/login', '/signup', '/staff/login', '/agent/login', '/delivery/signup', '/verify-otp', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 flex items-center justify-between shadow-sm transition-all duration-300">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {onMenuToggle && isAdminPath && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors focus:ring-2 focus:ring-primary/20"
          >
            <Menu size={22} />
          </button>
        )}

        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Truck className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block text-primary">
            Sigistics
          </span>
        </div>
      </div>

      {/* Navigation Space */}
      <div className="flex flex-1 items-center justify-center md:justify-end md:pr-6">
        {isAuthenticated ? (
          <div className="hidden md:flex items-center gap-8">
            {(role === 'user' || role === 'Vendar') && (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>Dashboard</NavLink>
                <NavLink to="/customer/shipments" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>My Shipments</NavLink>
              </>
            )}
            {role === 'admin' && (
              <>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>Analytics</NavLink>
                <NavLink to="/admin/shipments" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>Shipments</NavLink>
              </>
            )}
            {role === 'delivery' && (
              <>
                <NavLink to="/agent/dashboard" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>Dashboard</NavLink>
                <NavLink to="/agent/deliveries" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>Deliveries</NavLink>
              </>
            )}
          </div>
        ) : null}

        {/* Unauthenticated Context Menus */}
        {!isAuthenticated && isAuthPage && (
          <div className="flex items-center gap-3">
            {location.pathname === '/staff/login' || location.pathname === '/delivery/signup' ? (
              <button
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 transition-all font-sans"
              >
                Login as User
              </button>
            ) : (
              <button
                onClick={() => navigate('/staff/login')}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 transition-all font-sans"
              >
                Login as Staff
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions (Login or User Profile + Logout) */}
      <div className="flex items-center gap-4 shrink-0">
        {isAuthenticated ? (
          <div className="relative flex items-center">
            <div
              className="flex items-center gap-3 cursor-pointer select-none hover:bg-muted/50 p-2 rounded-xl transition-all duration-300 border border-transparent hover:border-border"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="capitalize text-foreground font-bold text-sm leading-tight">
                  {user?.name || user?.full_name || role}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary leading-tight">
                  {role}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-sm border border-border">
                <UserIcon size={18} />
              </div>
            </div>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-52 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-4 py-3 border-b border-border/50 mb-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Authenticated as</p>
                    <p className="text-sm font-bold truncate">{user?.email}</p>
                  </div>
                  <div
                    className="px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer flex items-center gap-3 transition-colors font-medium"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (role === 'admin') navigate('/admin/profile');
                      else if (role === 'delivery') navigate('/agent/profile');
                      else navigate('/profile');
                    }}
                  >
                    <UserIcon size={16} />
                    View Profile
                  </div>
                  <div className="h-px bg-border my-1"></div>
                  <div
                    className="px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-3 transition-colors font-medium"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          !isAuthPage && (
            <button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 transition-all transform active:scale-95"
            >
              Get Started
            </button>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;
