// CampusLend - Institutional Emblem
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React from 'react';

export default function CampusLogo({ className = "w-4 h-4", inverted = false }) {
  return (
    <div className={`relative flex items-center justify-center rounded-md p-1.5 transition-colors ${
      inverted ? 'bg-white text-[#526B56] border border-[#DAD8D0]' : 'bg-[#526B56] text-white shadow-subtle'
    }`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
        <path d="M6 14h6" />
        <circle cx="17" cy="15" r="2" fill="currentColor" fillOpacity="0.25" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
