import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, ClipboardList, LayoutDashboard, UserCircle } from 'lucide-react';

const links = [
  { to: '/agent/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent/deliveries', icon: ClipboardList, label: 'My Deliveries' },
  { to: '/agent/profile', icon: UserCircle, label: 'Profile' },
];

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
    isActive
      ? 'bg-primary text-white shadow-lg shadow-primary/20'
      : 'text-slate-600 hover:bg-white hover:text-slate-900'
  }`;

const AgentLayout = () => {
  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.1),_transparent_25%)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden lg:flex lg:w-72 lg:flex-col">
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
            <div className="mb-6 rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Activity className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Agent Portal</h2>
              <p className="mt-2 text-sm text-slate-300">
                Track assignments, update delivery progress, and manage availability.
              </p>
            </div>

            <nav className="space-y-2">
              {links.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={linkClasses}>
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {links.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AgentLayout;
