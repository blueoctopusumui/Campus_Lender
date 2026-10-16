// CampusLend - Application Layout Shell
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F5F1] flex flex-col font-sans antialiased text-[#242722]">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Overlay closes sidebar on click outside */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-[#242722]/30 backdrop-blur-sm z-40"
          />
        )}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
            <Outlet />
          </div>
          <footer className="py-4 px-6 border-t border-[#DAD8D0] bg-[#ECEAE3]/40 text-center text-xs text-[#74766F]">
            <p>
              CampusLend — College Lending & Resource Sharing Platform • VIT Vellore
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
