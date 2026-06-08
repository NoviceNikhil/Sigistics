import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fullLogout } from '@/store/authSlice';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

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

  // Determine if we are on Auth-related public paths
  const isAuthPage = ['/login', '/signup', '/staff/login', '/delivery/signup', '/verify-otp', '/forgot-password', '/reset-password'].includes(location.pathname);

  const Logo = () => (
    <div 
      className="flex items-center gap-2 cursor-pointer group"
      onClick={() => navigate('/')}
    >
      <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-blue-500/30 transition-all">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      </div>
      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 tracking-tight hidden sm:block">
        Sigistics
      </span>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm px-4 md:px-6 py-3 flex items-center justify-between transition-all">
      {/* Left: Brand / Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {onMenuToggle && location.pathname.startsWith('/admin') && (
          <button 
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors focus:ring-2 focus:ring-blue-100"
          >
            <Menu size={22} />
          </button>
        )}
        <Logo />
      </div>

      {/* Right: Actions / Links */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {/* Context Navigation Roles */}
            <div className="hidden md:flex items-center gap-6 mr-2">
              {(role === 'user' || role === 'Vendar') && (
                <NavLink to="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">Dashboard</NavLink>
              )}
              {role === 'delivery' && (
                <NavLink to="/delivery/dashboard" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">Dashboard</NavLink>
              )}
              {role === 'admin' && (
                <>
                  <NavLink to="/admin/shipments" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">Shipments</NavLink>
                  <NavLink to="/admin/dashboard" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">Analytics</NavLink>
                </>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative flex items-center">
              <div 
                className="flex items-center gap-2.5 cursor-pointer hover:bg-blue-50 py-1.5 px-3 rounded-full transition-colors border border-transparent hover:border-blue-100"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-800 capitalize leading-none mb-1">
                    {user?.name || user?.full_name || role}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 leading-none">
                    {role}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm relative overflow-hidden">
                  <UserIcon size={18} strokeWidth={2.5}/>
                </div>
              </div>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div 
                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center gap-2 transition-colors font-medium"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (role === 'admin') navigate('/admin/profile');
                        else if (role === 'delivery') navigate('/delivery/profile');
                        else navigate('/profile');
                      }}
                    >
                      <UserIcon size={16} /> Profile
                    </div>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <div 
                      className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2 transition-colors font-medium"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut size={16} /> Logout
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* Unauthenticated Logic (Auth Pages) */
          <div className="flex items-center gap-3">
            {location.pathname === '/staff/login' || location.pathname === '/delivery/signup' ? (
              <Button variant="ghost" onClick={() => navigate('/login')} className="text-gray-600 font-semibold hover:text-blue-600 hover:bg-blue-50 hidden sm:flex">
                Login as User
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => navigate('/staff/login')} className="text-gray-600 font-semibold hover:text-blue-600 hover:bg-blue-50 hidden sm:flex">
                Login as Staff
              </Button>
            )}
            
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold rounded-lg px-5 hidden sm:flex"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </Button>
            
            {/* Mobile fallback for generic unauth */}
            <div className="sm:hidden flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="text-blue-600 border-blue-200 rounded-lg">Login</Button>
              <Button size="sm" onClick={() => navigate('/signup')} className="bg-blue-600 text-white rounded-lg">Signup</Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
