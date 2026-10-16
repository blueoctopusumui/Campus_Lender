// CampusLend - Sidebar Navigation
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  BookOpen,
  Bell,
  User,
  Users,
  AlertCircle,
  BarChart3,
  X,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;

  const baseLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/items', label: 'Resource Catalogue', icon: Package },
    { to: '/items?action=list', label: 'List Item to Lend', icon: PlusCircle },
    { to: '/requests', label: role === 'STUDENT' ? 'My Requests' : 'Lending Requests', icon: ClipboardList },
    { to: '/loans', label: role === 'STUDENT' ? 'Active Loans' : 'Loan Registry', icon: BookOpen },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Academic Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/fines', label: 'Fine Settlement', icon: AlertCircle },
    { to: '/admin/reports', label: 'Analytics & Aggregates', icon: BarChart3 },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
      isActive
        ? 'bg-[#526B56] text-white font-medium shadow-subtle'
        : 'text-[#74766F] hover:bg-[#ECEAE3] hover:text-[#242722] font-normal'
    }`;

  return (
    <>
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#DAD8D0] flex flex-col transition-transform duration-200 ease-in-out shadow-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-[#DAD8D0] bg-[#F6F5F1]">
          <span className="font-heading font-semibold text-xs uppercase tracking-wider text-[#242722]">
            Navigation
          </span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[#ECEAE3] text-[#74766F]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* VIT Vellore institution banner */}
        <div className="px-4 py-3.5 border-b border-[#DAD8D0] bg-[#ECEAE3]/35">
          <h2 className="font-heading text-sm font-bold text-[#242722] tracking-tight">
            VIT Vellore
          </h2>
          {user?.department?.deptName && (
            <p className="text-xs text-[#74766F] truncate mt-0.5">
              {user.department.deptName}
            </p>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2.5 pb-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#9A9C94]">
              Circulation
            </p>
          </div>

          {baseLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={linkClass}
              >
                <Icon className="w-4 h-4 flex-shrink-0 stroke-[1.8]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {role === 'ADMIN' && (
            <>
              <div className="pt-4 px-2.5 pb-1.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#9A9C94]">
                  Administration
                </p>
              </div>
              {adminLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={linkClass}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 stroke-[1.8]" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-[#DAD8D0] text-xs bg-[#ECEAE3]/20">
          <p className="font-heading font-medium text-[#242722] text-xs">CampusLend</p>
          <p className="text-[11px] text-[#74766F]">Peer Resource Lending</p>
        </div>
      </aside>
    </>
  );
}
