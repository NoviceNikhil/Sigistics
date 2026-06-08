import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Box, MapPin, ShieldAlert, X } from 'lucide-react';

const links = [
  { to: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/admin/agents",    icon: <Users size={18} />,           label: "Agents" },
  { to: "/admin/shipments", icon: <Box size={18} />,             label: "Shipments" },
  { to: "/admin/locations", icon: <MapPin size={18} />,          label: "Locations" },
  { to: "/admin/rules",     icon: <ShieldAlert size={18} />,     label: "Rules Engine" },
];

const NavItems = ({ onClose }) => (
  <>
    {/* Close button shown only inside mobile drawer */}
    {onClose && (
      <div className="flex justify-end px-4 pt-4 pb-2 md:hidden">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    )}

    {/* Navigation links */}
    <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`
          }
        >
          {link.icon}
          {link.label}
        </NavLink>
      ))}
    </nav>

    {/* Footer */}
    <div className="p-4 border-t border-gray-100">
      <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-medium">
        Admin Console v1.0
      </div>
    </div>
  </>
);

// mobileOpen + onMobileClose are controlled by App.jsx so Navbar's hamburger
// can toggle this drawer without prop-drilling through pages.
export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  return (
    <>
      {/* ── Mobile overlay drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer panel */}
          <aside className="relative w-64 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col">
            <NavItems onClose={onMobileClose} />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 flex-col flex-shrink-0 sticky top-0 h-[calc(100vh-57px)]">
        <NavItems />
      </aside>
    </>
  );
}
