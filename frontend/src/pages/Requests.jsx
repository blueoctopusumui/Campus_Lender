// CampusLend - Peer-to-Peer Requests & Lending Approvals
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { Check, X, Ban, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import api from '../api/axios';

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [requestType, setRequestType] = useState('ALL'); // 'ALL' | 'BORROWING' | 'LENDING'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, requestType, page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(requestType === 'BORROWING' && { type: 'borrowing' }),
        ...(requestType === 'LENDING' && { type: 'lending' }),
      });
      const res = await api.get(`/requests?${params.toString()}`);
      setRequests(res.data.data || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load lending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await api.put(`/requests/${requestId}/approve`);
      toast.success('Request approved.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const remarks = prompt('Enter rejection reason for the borrower:');
    try {
      setProcessingId(requestId);
      await api.put(`/requests/${requestId}/reject`, { remarks });
      toast.success('Request rejected.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this borrow request?')) return;
    try {
      setProcessingId(requestId);
      await api.put(`/requests/${requestId}/cancel`);
      toast.success('Request cancelled.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadge = {
    PENDING: 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE]',
    APPROVED: 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]',
    REJECTED: 'bg-[#FAECEB] text-[#8A332F] border-[#E8C4C2]',
    CANCELLED: 'bg-[#ECEAE3] text-[#494B45] border-[#DAD8D0]',
  };

  const isStaffOrAdmin = user?.role === 'STAFF' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722]">
            {isStaffOrAdmin ? 'Lending Requests' : 'Requests & Approvals'}
          </h1>
          <p className="text-xs text-[#74766F] mt-1">
            {isStaffOrAdmin
              ? 'Review and manage campus lending requests across all departments'
              : 'Approve borrow requests for your items, and track items you requested from peers'}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-white p-1 rounded-md border border-[#DAD8D0] shadow-subtle text-xs font-mono">
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-[#526B56] text-white font-medium shadow-subtle'
                  : 'text-[#74766F] hover:text-[#242722] hover:bg-[#ECEAE3]'
              }`}
            >
              {st || 'ALL'}
            </button>
          ))}
        </div>
      </div>

      {/* Role-based Type Switcher for Students (Borrowing vs Lending) */}
      {!isStaffOrAdmin && (
        <div className="flex border-b border-[#DAD8D0] gap-6 text-xs font-mono">
          <button
            onClick={() => { setRequestType('ALL'); setPage(1); }}
            className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px ${
              requestType === 'ALL'
                ? 'border-[#526B56] text-[#242722]'
                : 'border-transparent text-[#74766F] hover:text-[#242722]'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => { setRequestType('LENDING'); setPage(1); }}
            className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              requestType === 'LENDING'
                ? 'border-[#526B56] text-[#242722]'
                : 'border-transparent text-[#74766F] hover:text-[#242722]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#325238]" />
            <span>Requests for My Items (I'm Lending)</span>
          </button>
          <button
            onClick={() => { setRequestType('BORROWING'); setPage(1); }}
            className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              requestType === 'BORROWING'
                ? 'border-[#526B56] text-[#242722]'
                : 'border-transparent text-[#74766F] hover:text-[#242722]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-[#526B56]" />
            <span>My Borrowing Requests (I'm Borrowing)</span>
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-md border border-[#DAD8D0] overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-[#74766F]">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-[#74766F] text-xs font-mono">
            No lending requests found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#ECEAE3]/40 border-b border-[#DAD8D0] text-[#74766F] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Req #</th>
                  <th className="py-3 px-4 font-medium">Item & Role</th>
                  <th className="py-3 px-4 font-medium">Borrower</th>
                  <th className="py-3 px-4 font-medium">Lender</th>
                  <th className="py-3 px-4 font-medium">Period</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Remarks</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DAD8D0]/60 font-sans">
                {requests.map((r) => {
                  const isOwner = Number(r.item?.ownerId) === Number(user?.userId) || Number(r.item?.owner?.userId) === Number(user?.userId);
                  const isBorrower = Number(r.borrowerId) === Number(user?.userId);
                  const canManage = isStaffOrAdmin || isOwner;

                  return (
                    <tr key={r.requestId} className="hover:bg-[#ECEAE3]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-[#74766F]">
                        #{r.requestId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#242722]">{r.item?.title || '-'}</div>
                        <div className="mt-0.5">
                          {isOwner && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-[#EBF0EC] text-[#325238] border border-[#C6D8C8]">
                              Your Item (You Lend)
                            </span>
                          )}
                          {isBorrower && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-[#ECEAE3] text-[#242722] border border-[#DAD8D0]">
                              You Borrow
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#242722]">{r.borrower?.fullName || '-'}</div>
                        <div className="text-[10px] font-mono text-[#74766F]">{r.borrower?.regNo || r.borrower?.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#242722]">
                          {isOwner ? 'You' : r.item?.owner?.fullName || 'Campus Staff'}
                        </div>
                        <div className="text-[10px] font-mono text-[#74766F]">
                          {r.item?.owner?.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#74766F]">
                        <div>{new Date(r.requestedFrom).toLocaleDateString()}</div>
                        <div className="text-[#9A9C94]">to {new Date(r.requestedTo).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${statusBadge[r.status] || 'bg-[#ECEAE3]'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#74766F] max-w-xs truncate text-[11px]">
                        {r.remarks || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {canManage && r.status === 'PENDING' && (
                          <>
                            <button
                              disabled={processingId === r.requestId}
                              onClick={() => handleApprove(r.requestId)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#526B56] hover:bg-[#3F5543] text-white rounded text-[11px] font-medium transition-colors"
                              title="Approve this borrow request"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              disabled={processingId === r.requestId}
                              onClick={() => handleReject(r.requestId)}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-[#FAECEB] hover:bg-[#F3DDDC] text-[#8A332F] rounded text-[11px] font-medium border border-[#E8C4C2] transition-colors"
                              title="Reject request"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isBorrower && !canManage && r.status === 'PENDING' && (
                          <button
                            disabled={processingId === r.requestId}
                            onClick={() => handleCancel(r.requestId)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#ECEAE3] hover:bg-[#DAD8D0] text-[#242722] rounded text-[11px] font-medium transition-colors"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
