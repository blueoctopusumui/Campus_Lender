// CampusLend - StatCard Metric Component
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'brand', subtitle }) {
  const iconTints = {
    brand: 'text-[#242722] bg-[#ECEAE3] border-[#DAD8D0]',
    ivy: 'text-[#325238] bg-[#EBF0EC] border-[#C6D8C8]',
    ochre: 'text-[#785918] bg-[#F7F2E7] border-[#E5D8BE]',
    crimson: 'text-[#8A332F] bg-[#FAECEB] border-[#E8C4C2]',
  };

  return (
    <div className="bg-white rounded-md border border-[#DAD8D0] p-4 sm:p-5 flex flex-col justify-between hover:border-[#9A9C94] transition-colors shadow-subtle">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#74766F]">
          {title}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded-md border ${iconTints[color] || iconTints.brand}`}>
            <Icon className="w-3.5 h-3.5 stroke-[2]" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[#242722]">
          {value ?? '0'}
        </p>
        {subtitle && (
          <p className="text-[11px] text-[#74766F] mt-1.5 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DAD8D0]"></span>
            <span>{subtitle}</span>
          </p>
        )}
      </div>
    </div>
  );
}
