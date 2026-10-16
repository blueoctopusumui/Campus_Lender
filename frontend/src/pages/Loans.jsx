// CampusLend - Loans Registry & Peer Returns
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import {
  RotateCcw, AlertTriangle, Clock, CheckCircle2,
  ArrowUpRight, ArrowDownLeft, Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import api from '../api/axios';

export default function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loanType, setLoanType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Return modal state
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [submitting, setSubmitting] = useState(false);

  // Review modal state
  const [reviewLoan, setReviewLoan] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewedLoanIds, setReviewedLoanIds] = useState(new Set());
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, [filter, loanType, page]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(filter !== 'ALL' && { status: filter }),
        ...(loanType === 'BORROWED' && { type: 'borrowed' }),
        ...(loanType === 'LENT' && { type: 'lent' }),
      });
      const res = await api.get(`/loans?${params.toString()}`);
      setLoans(res.data.data || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load loans registry');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/loans/${selectedLoan.loanId}/return`, {
        condition: returnCondition,
      });
      toast.success(res.data.message || 'Item marked as returned.');
      setSelectedLoan(null);
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewLoan) return;
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error('Please select a star rating between 1 and 5');
      return;
    }
    try {
      setSubmittingReview(true);
      await api.post('/reviews', {
        loanId: reviewLoan.loanId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success('Review submitted! Thank you for your feedback.');
      setReviewedLoanIds((prev) => new Set([...prev, reviewLoan.loanId]));
      setReviewLoan(null);
      setReviewRating(5);
      setReviewComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isStaffOrAdmin = user?.role === 'STAFF' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722]">
            {isStaffOrAdmin ? 'Loan Registry' : 'Circulation Registry'}
          </h1>
          <p className="text-xs text-[#74766F] mt-1">
            {isStaffOrAdmin
              ? 'Track active checkouts, overdue dates, and process returns'
              : 'Track items you borrowed from peers and confirm returns for items you lent out'}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-white p-1 rounded-md border border-[#DAD8D0] shadow-subtle text-xs font-mono">
          {['ALL', 'ACTIVE', 'OVERDUE', 'RETURNED'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setFilter(tab); setPage(1); }}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === tab
                  ? 'bg-[#526B56] text-white font-medium shadow-subtle'
                  : 'text-[#74766F] hover:text-[#242722] hover:bg-[#ECEAE3]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Role-based Type Switcher for Students */}
      {!isStaffOrAdmin && (
        <div className="flex border-b border-[#DAD8D0] gap-6 text-xs font-mono">
          <button
            onClick={() => { setLoanType('ALL'); setPage(1); }}
            className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px ${
              loanType === 'ALL'
                ? 'border-[#526B56] text-[#242722]'
                : 'border-transparent text-[#74766F] hover:text-[#242722]'
            }`}
          >
            All Loans ({loans.length})
          </button>
          <button
            onClick={() => { setLoanType('LENT'); setPage(1); }}
            className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              loanType === 'LENT'
                ? 'border-[#526B56] text-[#242722]'
                : 'border-transparent text-[#74766F] hover:text-[#242722]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#325238]" />
            <span>Items I Lent to Peers</span>
          </button>
          <button
            onClick={() => { setLoanType('BORROWED'); setPage(1); }}
            className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              loanType === 'BORROWED'
                ? 'border-[#526B56] text-[#242722]'
                : 'border-transparent text-[#74766F] hover:text-[#242722]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-[#526B56]" />
            <span>Items I'm Borrowing</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-md border border-[#DAD8D0] overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-[#74766F]">Loading loan records...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center text-[#74766F] text-xs font-mono">
            No loans found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#ECEAE3]/40 border-b border-[#DAD8D0] text-[#74766F] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Loan #</th>
                  <th className="py-3 px-4 font-medium">Item & Role</th>
                  <th className="py-3 px-4 font-medium">Borrower</th>
                  <th className="py-3 px-4 font-medium">Issued On</th>
                  <th className="py-3 px-4 font-medium">Due Date</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DAD8D0]/60 font-sans">
                {loans.map((loan) => {
                  const isOverdue = !loan.returnedAt && new Date(loan.dueDate) < new Date();
                  const isReturned = !!loan.returnedAt;
                  const isOwner = loan.request?.item?.ownerId === user?.userId;
                  const isBorrower = loan.request?.borrowerId === user?.userId;
                  const canProcessReturn = isStaffOrAdmin || isOwner;
                  const alreadyReviewed = reviewedLoanIds.has(loan.loanId) || !!loan.review;

                  return (
                    <tr
                      key={loan.loanId}
                      className={`hover:bg-[#ECEAE3]/30 transition-colors ${isOverdue ? 'bg-[#FAECEB]/40' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-[#74766F]">
                        #{loan.loanId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#242722]">
                          {loan.request?.item?.title || '-'}
                        </div>
                        <div className="mt-0.5">
                          {isOwner && (
                            <span className="inline-block px-1.5 rounded text-[9px] font-mono font-semibold bg-[#EBF0EC] text-[#325238] border border-[#C6D8C8]">
                              You Lent This
                            </span>
                          )}
                          {isBorrower && (
                            <span className="inline-block px-1.5 rounded text-[9px] font-mono font-semibold bg-[#ECEAE3] text-[#242722] border border-[#DAD8D0]">
                              You Borrowed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#242722]">
                          {loan.request?.borrower?.fullName || '-'}
                        </div>
                        <div className="text-[10px] font-mono text-[#74766F]">
                          {loan.request?.borrower?.regNo || loan.request?.borrower?.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#74766F]">
                        {new Date(loan.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`font-mono font-semibold ${isOverdue ? 'text-[#8A332F]' : 'text-[#242722]'}`}>
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </div>
                        {isOverdue && (
                          <div className="text-[10px] font-mono text-[#8A332F] font-semibold flex items-center mt-0.5">
                            <Clock className="w-3 h-3 mr-0.5" /> Overdue
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isReturned ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#EBF0EC] text-[#325238] border border-[#C6D8C8]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> RETURNED
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#FAECEB] text-[#8A332F] border border-[#E8C4C2]">
                            <AlertTriangle className="w-3 h-3 mr-1" /> OVERDUE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F7F2E7] text-[#785918] border border-[#E5D8BE]">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canProcessReturn && !isReturned && (
                          <button
                            onClick={() => setSelectedLoan(loan)}
                            className="btn-primary py-1 px-2.5 text-[11px]"
                            title={isOwner ? 'Confirm peer returned your item' : 'Process return'}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            <span>{isOwner ? 'Confirm Return' : 'Process Return'}</span>
                          </button>
                        )}
                        {!canProcessReturn && !isReturned && (
                          <span className="text-[11px] font-mono text-[#74766F]">
                            {isBorrower ? 'Return to Owner' : 'In Circulation'}
                          </span>
                        )}
                        {isReturned && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-mono text-[#74766F] block">
                              Cond: {loan.returnCondition || 'GOOD'}
                            </span>
                            {isBorrower && !alreadyReviewed && (
                              <button
                                onClick={() => {
                                  setReviewLoan(loan);
                                  setReviewRating(5);
                                  setReviewComment('');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded border border-[#E5D8BE] bg-[#F7F2E7] text-[#785918] hover:bg-[#F2E9D6] transition-colors"
                              >
                                <Star className="w-3 h-3 fill-[#A47D2E] text-[#A47D2E]" />
                                Rate & Review
                              </button>
                            )}
                            {isBorrower && alreadyReviewed && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#325238]">
                                <CheckCircle2 className="w-3 h-3" /> Reviewed
                              </span>
                            )}
                          </div>
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

      {/* Return Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-[#242722]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md shadow-modal max-w-md w-full p-6 border border-[#DAD8D0]">
            <h2 className="font-heading text-base font-bold text-[#242722] tracking-tight mb-1">
              Confirm Item Return
            </h2>
            <p className="text-xs text-[#74766F] mb-4">
              Confirm return of <strong>{selectedLoan.request?.item?.title}</strong>.
            </p>

            <form onSubmit={handleReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Item Physical Condition on Return *
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="input-archival bg-white"
                >
                  <option value="NEW">NEW - Unblemished</option>
                  <option value="GOOD">GOOD - Fully Operational</option>
                  <option value="FAIR">FAIR - Minor Cosmetic Wear</option>
                  <option value="POOR">POOR - Degraded / Needs Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#DAD8D0]">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Confirming...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewLoan && (
        <div className="fixed inset-0 bg-[#242722]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md shadow-modal max-w-md w-full p-6 border border-[#DAD8D0]">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-[#A47D2E] fill-[#A47D2E]" />
              <h2 className="font-heading text-base font-bold text-[#242722] tracking-tight">
                Rate Your Borrowing Experience
              </h2>
            </div>
            <p className="text-xs text-[#74766F] mb-5">
              You borrowed <strong>{reviewLoan.request?.item?.title}</strong>.
              Your review helps other students evaluate item condition and lender reliability.
            </p>

            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242722] mb-2">
                  Overall Rating *
                </label>
                <div className="flex gap-1 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (reviewHover || reviewRating)
                            ? 'fill-[#A47D2E] text-[#A47D2E]'
                            : 'text-[#DAD8D0]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-mono text-[#785918]">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewHover || reviewRating]}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Comments (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe item condition, lender punctuality, etc."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="input-archival resize-none text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#DAD8D0]">
                <button
                  type="button"
                  onClick={() => { setReviewLoan(null); setReviewRating(5); setReviewComment(''); }}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || reviewRating === 0}
                  className="btn-primary text-xs"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
