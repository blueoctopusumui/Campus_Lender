// CampusLend - Navbar
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React from 'react';
import { Menu, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import CampusLogo from './CampusLogo';
import { Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout } = useAuth();

  const roleBadgeStyle = {
    ADMIN: 'bg-[#242722] text-white border-[#242722]',
    STAFF: 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE]',
    STUDENT: 'bg-[#ECEAE3] text-[#242722] border-[#DAD8D0]'
  };

  return (
    <header className="bg-white border-b border-[#DAD8D0] sticky top-0 z-30 transition-all">
      <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Left branding */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className={`p-1.5 rounded-md transition-colors focus:outline-none ${
              sidebarOpen
                ? 'bg-[#ECEAE3] text-[#242722]'
                : 'text-[#74766F] hover:bg-[#ECEAE3] hover:text-[#242722]'
            }`}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/dashboard" className="flex items-center space-x-2.5 group">
            <CampusLogo className="w-4 h-4 text-white" />
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-bold tracking-tight text-[#242722] group-hover:text-[#526B56] transition-colors">
                CampusLend
              </span>
              <span className="text-xs text-[#DAD8D0] hidden sm:inline">|</span>
              <span className="text-xs font-semibold text-[#74766F] hidden sm:inline">
                VIT Vellore
              </span>
            </div>
          </Link>
        </div>

        {/* Right side user & notifications */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <NotificationBell />

          <div className="h-4 w-px bg-[#DAD8D0]"></div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              to="/profile"
              className="flex items-center space-x-2.5 p-1 rounded-md hover:bg-[#ECEAE3]/70 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-[#526B56] text-white flex items-center justify-center font-heading font-semibold text-xs shadow-subtle">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-[#242722] leading-none">
                  {user?.fullName}
                </p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[10px] font-mono uppercase tracking-wider rounded border ${
                      roleBadgeStyle[user?.role] || 'bg-[#ECEAE3] text-[#242722] border-[#DAD8D0]'
                    }`}
                  >
                    {user?.role}
                  </span>
                  {user?.regNo && (
                    <span className="text-[10px] font-mono text-[#74766F]">
                      {user.regNo}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-[#74766F] hover:text-[#8A332F] rounded-md hover:bg-[#FAECEB] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
