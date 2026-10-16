// CampusLend - Admin Fine Settlement Ledger
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import api from '../../api/axios';

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFines();
  }, [filter, page]);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(filter === 'UNPAID' && { isPaid: 'false' }),
        ...(filter === 'PAID' && { isPaid: 'true' })
      });
      const res = await api.get(`/fines?${params.toString()}`);
      setFines(res.data.data || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load fines ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (fineId) => {
    try {
      await api.put(`/fines/${fineId}/pay`);
      toast.success('Fine marked as settled / paid in ledger');
      fetchFines();
      // Notify dashboard to refresh outstanding fines total
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722]">
            Fine Settlement Ledger
          </h1>
          <p className="text-xs text-[#74766F] mt-1">
            Track overdue penalties assessed for late returns and record settlements.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex bg-white p-1 rounded-md border border-[#DAD8D0] shadow-subtle text-xs font-mono">
          {['ALL', 'UNPAID', 'PAID'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === f
                  ? 'bg-[#526B56] text-white font-medium shadow-subtle'
                  : 'text-[#74766F] hover:text-[#242722] hover:bg-[#ECEAE3]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-md border border-[#DAD8D0] overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-[#74766F]">Loading fines...</p>
          </div>
        ) : fines.length === 0 ? (
          <div className="p-12 text-center text-[#74766F] text-xs font-mono">
            No fines found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#ECEAE3]/40 border-b border-[#DAD8D0] text-[#74766F] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Fine #</th>
                  <th className="py-3 px-4 font-medium">Item & Loan</th>
                  <th className="py-3 px-4 font-medium">Borrower</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Assessed Date</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DAD8D0]/60 font-sans">
                {fines.map((fine) => (
                  <tr key={fine.fineId} className="hover:bg-[#ECEAE3]/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#74766F]">
                      #{fine.fineId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#242722]">
                        {fine.loan?.request?.item?.title || '-'}
                      </div>
                      <div className="text-[10px] font-mono text-[#74766F]">Loan #{fine.loanId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#242722]">{fine.loan?.request?.borrower?.fullName || '-'}</div>
                      <div className="text-[10px] font-mono text-[#74766F]">
                        {fine.loan?.request?.borrower?.regNo}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#242722] text-sm">
                      ₹{parseFloat(fine.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                          fine.isPaid
                            ? 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]'
                            : 'bg-[#FAECEB] text-[#8A332F] border-[#E8C4C2]'
                        }`}
                      >
                        {fine.isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#74766F]">
                      {new Date(fine.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!fine.isPaid ? (
                        <button
                          onClick={() => handleMarkPaid(fine.fineId)}
                          className="btn-primary py-1 px-2.5 text-[11px]"
                          title="Mark fine as settled"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-[#325238]">
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
