// CampusLend - Resource Detail & Borrow Request
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Star,
  Tag,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request form state
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review prompt state (for returned unreviewed loans)
  const [unreviewedLoan, setUnreviewedLoan] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const [itemRes, revRes] = await Promise.all([
        api.get(`/items/${id}`),
        api.get(`/reviews/item/${id}`).catch(() => ({ data: { data: [] } }))
      ]);
      setItem(itemRes.data.data);
      setReviews(revRes.data.data || []);

      const maxDays = itemRes.data.data?.maxLoanDays || itemRes.data.data?.category?.maxLoanDays || 7;
      const d = new Date();
      d.setDate(d.getDate() + maxDays);
      setToDate(d.toISOString().split('T')[0]);

      // Check if current student has a returned, unreviewed loan for this item
      if (user?.role === 'STUDENT') {
        try {
          const loansRes = await api.get(`/loans?type=borrowed&limit=50`);
          const myLoans = loansRes.data.data || [];
          const reviewedLoanIds = new Set((revRes.data.data || []).map(r => r.loanId));
          const unreviewed = myLoans.find(
            (ln) =>
              ln.request?.item?.itemId === parseInt(id) &&
              ln.returnedAt &&
              !reviewedLoanIds.has(ln.loanId)
          );
          setUnreviewedLoan(unreviewed || null);
        } catch {
          // silently ignore — not critical
        }
      }
    } catch {
      toast.error('Resource not found in registry');
      navigate('/items');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowRequest = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      toast.error('Please specify both checkout and return dates');
      return;
    }
    if (new Date(toDate) <= new Date(fromDate)) {
      toast.error('Return date must be strictly after checkout date');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/requests', {
        itemId: parseInt(id),
        requestedFrom: fromDate,
        requestedTo: toDate,
        remarks
      });
      toast.success('Borrow request submitted successfully.');
      navigate('/requests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemReview = async (e) => {
    e.preventDefault();
    if (!unreviewedLoan) return;
    try {
      setReviewSubmitting(true);
      await api.post('/reviews', {
        loanId: unreviewedLoan.loanId,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      toast.success('Review submitted! Thank you.');
      setReviewed(true);
      setUnreviewedLoan(null);
      // Refresh reviews list
      const revRes = await api.get(`/reviews/item/${id}`).catch(() => ({ data: { data: [] } }));
      setReviews(revRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#74766F] uppercase tracking-wider">
          Loading Resource Details...
        </p>
      </div>
    );
  }

  const isAvailable = item.status === 'AVAILABLE';

  const conditionColors = {
    NEW: 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]',
    GOOD: 'bg-[#ECEAE3] text-[#242722] border-[#DAD8D0]',
    FAIR: 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE]',
    POOR: 'bg-[#FAECEB] text-[#8A332F] border-[#E8C4C2]',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/items"
        className="inline-flex items-center space-x-1.5 text-xs text-[#74766F] hover:text-[#242722] font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Resource Catalogue</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Resource Specifications (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-md border border-[#DAD8D0] p-6 shadow-subtle">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DAD8D0]">
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                isAvailable ? 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]' : 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE]'
              }`}>
                {item.status.replace('_', ' ')}
              </span>
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${conditionColors[item.itemCondition] || 'bg-[#ECEAE3]'}`}>
                Condition: {item.itemCondition}
              </span>
            </div>

            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#242722] mb-2">
              {item.title}
            </h1>
            <p className="text-xs text-[#74766F] leading-relaxed whitespace-pre-line mb-6">
              {item.description || 'Standard academic hardware with no special caveats.'}
            </p>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#DAD8D0] text-xs">
              <div className="p-3 rounded-md bg-[#ECEAE3]/40 border border-[#DAD8D0]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#74766F] block">
                  Category Classification
                </span>
                <span className="font-medium text-[#242722] mt-1 block">
                  {item.category?.categoryName}
                </span>
              </div>

              <div className="p-3 rounded-md bg-[#ECEAE3]/40 border border-[#DAD8D0]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#74766F] block">
                  Resource Lender
                </span>
                <span className="font-medium text-[#242722] mt-1 block truncate">
                  {item.owner?.fullName}
                </span>
              </div>

              <div className="p-3 rounded-md bg-[#ECEAE3]/40 border border-[#DAD8D0]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#74766F] block">
                  Max Checkout Period
                </span>
                <span className="font-mono font-semibold text-[#242722] mt-1 block">
                  {item.maxLoanDays || item.category?.maxLoanDays || 7} Days
                </span>
              </div>

              <div className="p-3 rounded-md bg-[#ECEAE3]/40 border border-[#DAD8D0]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#74766F] block">
                  Overdue Fine Rate
                </span>
                <span className="font-mono font-semibold text-[#8A332F] mt-1 block">
                  ₹{item.finePerDay || item.category?.finePerDay || 5.00} / day
                </span>
              </div>
            </div>
          </div>

          {/* Borrower Reviews Card */}
          <div className="bg-white rounded-md border border-[#DAD8D0] p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DAD8D0]">
              <div className="flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-[#A47D2E] fill-[#A47D2E]" />
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722]">
                  Borrower Reviews ({reviews.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#74766F]">Verified Returns</span>
            </div>

            {/* Inline review prompt for eligible students */}
            {unreviewedLoan && !reviewed && (
              <div className="mb-4 p-4 rounded-md border border-[#E5D8BE] bg-[#F7F2E7]/80">
                <p className="text-xs font-semibold text-[#785918] mb-3 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-[#A47D2E] text-[#A47D2E]" />
                  You borrowed this item earlier — share your rating & review
                </p>
                <form onSubmit={handleItemReview} className="space-y-3">
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
                          className={`w-5 h-5 transition-colors ${
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
                  <textarea
                    rows={2}
                    placeholder="Share your experience with this item and lender..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="input-archival resize-none text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="btn-primary py-1 px-3 text-xs"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnreviewedLoan(null)}
                      className="btn-secondary py-1 px-3 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </form>
              </div>
            )}
            {reviewed && (
              <div className="mb-3 p-3 rounded-md border border-[#C6D8C8] bg-[#EBF0EC] text-xs text-[#325238] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Your review has been submitted. Thank you!
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-xs text-[#74766F] text-center py-6 font-mono">
                No evaluations recorded for this item yet.
              </p>
            ) : (
              <div className="divide-y divide-[#DAD8D0]/60">
                {reviews.map((rev) => (
                  <div key={rev.reviewId} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#242722]">
                        {rev.reviewer?.fullName || 'Student'}
                      </span>
                      <div className="flex text-[#A47D2E]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating ? 'fill-[#A47D2E]' : 'text-[#DAD8D0]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#74766F] leading-snug">{rev.comment}</p>
                    <p className="text-[10px] font-mono text-[#9A9C94] mt-1">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Borrow Request Slip Panel (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-md border border-[#DAD8D0] p-5 sm:p-6 shadow-subtle sticky top-20">
            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-[#DAD8D0]">
              <FileText className="w-4 h-4 text-[#526B56]" />
              <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722]">
                Borrow Request
              </h2>
            </div>

            {user?.userId === item.ownerId ? (
              <div className="p-4 rounded-md border border-[#DAD8D0] bg-[#ECEAE3]/40 text-xs text-[#242722] space-y-2">
                <p className="font-semibold flex items-center gap-1.5 text-[#242722]">
                  <CheckCircle2 className="w-4 h-4 text-[#325238]" />
                  You Own This Item
                </p>
                <p className="text-xs leading-relaxed text-[#74766F]">
                  You listed this item for lending. When fellow students request to borrow it, their requests will appear under your <strong>Requests → Requests for My Items</strong> tab.
                </p>
                <div className="pt-2">
                  <Link to="/requests" className="btn-secondary w-full text-center text-xs block">
                    View Incoming Requests
                  </Link>
                </div>
              </div>
            ) : !isAvailable ? (
              <div className="p-4 rounded-md border border-[#E5D8BE] bg-[#F7F2E7] text-xs text-[#785918] space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#785918]" />
                  Currently On Loan / Unavailable
                </p>
                <p className="text-xs leading-relaxed text-[#624610]">
                  This resource is currently borrowed by another student. You can check back once returned.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBorrowRequest} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#74766F] mb-1">
                    Lender
                  </label>
                  <p className="text-xs font-medium text-[#242722] bg-[#ECEAE3]/30 p-2 rounded-md border border-[#DAD8D0]">
                    {item.owner?.fullName || 'Campus Peer'} {item.owner?.email ? `(${item.owner.email})` : ''}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#242722] mb-1">
                    Checkout Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="input-archival font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#242722] mb-1">
                    Scheduled Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="input-archival font-mono text-xs"
                  />
                  <p className="text-[10px] text-[#74766F] mt-1 font-mono">
                    Category allowance: max {item.maxLoanDays || item.category?.maxLoanDays} days
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#242722] mb-1">
                    Purpose / Message to Owner
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. For BCSE302P course project or exam preparation"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="input-archival text-xs"
                  />
                </div>

                <div className="p-3 bg-[#ECEAE3]/30 rounded-md border border-[#DAD8D0] text-[11px] text-[#74766F] space-y-1 font-mono">
                  <p className="font-medium text-[#242722] flex items-center gap-1 font-heading">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#526B56]" /> Lending Terms:
                  </p>
                  <p>• Reminder notification sent on due date</p>
                  <p>• ₹{item.finePerDay || item.category?.finePerDay}/day overdue fine if delayed</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-2 text-xs"
                >
                  {submitting ? 'Submitting Request...' : `Request from ${item.owner?.fullName?.split(' ')[0] || 'Lender'}`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
