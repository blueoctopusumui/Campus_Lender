// CampusLend - Admin Analytics & Reports
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { Award, AlertTriangle, Play, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

export default function Reports() {
  const [topItems, setTopItems] = useState([]);
  const [deptFines, setDeptFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringReminder, setTriggeringReminder] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [itemsRes, finesRes] = await Promise.all([
        api.get('/admin/reports/top-items').catch(() => ({ data: { data: [] } })),
        api.get('/admin/reports/dept-fines').catch(() => ({ data: { data: [] } })),
      ]);
      setTopItems(itemsRes.data.data || []);
      setDeptFines(finesRes.data.data || []);
    } catch {
      toast.error('Failed to load analytical reports');
    } finally {
      setLoading(false);
    }
  };

  const handleRunReminders = async () => {
    try {
      setTriggeringReminder(true);
      const res = await api.post('/admin/run-reminders');
      toast.success(
        res.data.message || 'Scheduled reminder job executed! Due today alerts dispatched.'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger job');
    } finally {
      setTriggeringReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#74766F] uppercase tracking-wider">
          Evaluating Analytical Reports...
        </p>
      </div>
    );
  }

  const maxBorrowCount =
    topItems.length > 0
      ? Math.max(...topItems.map((i) => Number(i.timesBorrowed ?? i.borrowCount ?? 1)))
      : 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722]">
            Analytics & Reports
          </h1>
          <p className="text-xs text-[#74766F] mt-1">
            Circulation metrics, checkout distribution, and department fines summaries.
          </p>
        </div>

        {/* Scheduled Job Trigger Action */}
        <button
          onClick={handleRunReminders}
          disabled={triggeringReminder}
          className="btn-primary text-xs"
        >
          {triggeringReminder ? (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
          )}
          <span>Run Reminder Job (08:00 IST)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Top 5 Most Borrowed Items */}
        <div className="bg-white rounded-md border border-[#DAD8D0] p-5 sm:p-6 shadow-subtle">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DAD8D0]">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#A47D2E]" />
              <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722]">
                Top 5 Most Borrowed Items
              </h2>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#DAD8D0] bg-[#ECEAE3]/50 text-[#74766F]">
              Checkout Frequency
            </span>
          </div>

          <p className="text-xs text-[#74766F] mb-5">
            Frequency of circulation checkouts across textbooks, equipment, and lab kits.
          </p>

          {topItems.length === 0 ? (
            <p className="text-xs text-[#74766F] text-center py-8 font-mono">No circulation data recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {topItems.map((item, idx) => {
                const count = Number(item.timesBorrowed ?? item.borrowCount ?? 0);
                const pct = Math.round((count / Math.max(maxBorrowCount, 1)) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#242722] truncate max-w-xs">
                        <span className="font-mono text-[#74766F] mr-1.5">{idx + 1}.</span>
                        {item.title}
                      </span>
                      <span className="font-mono font-semibold text-[#242722]">
                        {count} {count === 1 ? 'checkout' : 'checkouts'}
                      </span>
                    </div>
                    <div className="w-full bg-[#ECEAE3] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#526B56] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 12)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unpaid Fines per Department */}
        <div className="bg-white rounded-md border border-[#DAD8D0] p-5 sm:p-6 shadow-subtle">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DAD8D0]">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#8A332F]" />
              <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722]">
                Outstanding Fines by Department
              </h2>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#E8C4C2] bg-[#FAECEB] text-[#8A332F]">
              Unsettled Dues
            </span>
          </div>

          <p className="text-xs text-[#74766F] mb-5">
            Cumulative pending fines calculated via stored procedure for overdue item returns.
          </p>

          {deptFines.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#325238] bg-[#EBF0EC] rounded-md border border-[#C6D8C8] font-mono">
              All outstanding fines settled across all departments!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DAD8D0] text-[#74766F] font-mono text-[10px] uppercase">
                    <th className="py-2.5 font-medium">Department / School</th>
                    <th className="py-2.5 font-medium text-right">Outstanding Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DAD8D0]/60 font-sans">
                  {deptFines.map((df, i) => (
                    <tr key={i} className="hover:bg-[#ECEAE3]/30">
                      <td className="py-3 font-medium text-[#242722]">
                        {df.deptName || df.dept_name || df.department || 'Department'}
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-[#8A332F]">
                        ₹{parseFloat(df.pendingFines ?? df.pending_fines ?? df.totalAmount ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
