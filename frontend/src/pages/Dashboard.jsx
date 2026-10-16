// CampusLend - Dashboard Page
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  AlertTriangle,
  Clock,
  Package,
  Users as UsersIcon,
  ArrowRight,
  TrendingUp,
  Layers,
  CheckCircle2,
  Check,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import api from '../api/axios';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [dueTodayAlerts, setDueTodayAlerts] = useState([]);
  const [recentLoans, setRecentLoans] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [incomingApprovals, setIncomingApprovals] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [roleMetrics, setRoleMetrics] = useState({
    activeLoans: 0,
    activeLends: 0,
    pendingRequests: 0,
    pendingApprovals: 0,
    completedLoans: 0,
    unpaidFines: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      // Fast polling (5s) ensures live sync when peers submit requests or returns
      const interval = setInterval(loadDashboardData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleSync = () => {
      if (user) loadDashboardData();
    };
    // Refresh when window regains focus (e.g. user comes back from Fines page)
    window.addEventListener('focus', handleSync);
    window.addEventListener('notificationsUpdated', handleSync);
    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('notificationsUpdated', handleSync);
    };
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      // 1. Fetch DUE_TODAY notifications for banner
      const notifRes = await api.get('/notifications?limit=20');
      const dueToday = (notifRes.data.data || []).filter(
        (n) => n.notificationType === 'DUE_TODAY' && !n.isRead
      );
      setDueTodayAlerts(dueToday);

      // 2. Fetch role-specific metrics
      if (user.role === 'ADMIN') {
        const adminRes = await api.get('/admin/dashboard');
        setStats(adminRes.data.data);
      } else if (user.role === 'STAFF') {
        const [pendingReqRes, activeLoansRes, returnedLoansRes, recentLoansRes] = await Promise.all([
          api.get('/requests?status=PENDING&limit=10'),
          api.get('/loans?status=ACTIVE&limit=1'),
          api.get('/loans?status=RETURNED&limit=1'),
          api.get('/loans?limit=5')
        ]);
        const pReqs = pendingReqRes.data.data || [];
        setPendingRequests(pReqs);
        setIncomingApprovals(pReqs);
        setRecentLoans(recentLoansRes.data.data || []);
        setRoleMetrics({
          pendingRequests: pendingReqRes.data.pagination?.total ?? pReqs.length,
          activeLoans: activeLoansRes.data.pagination?.total ?? 0,
          completedLoans: returnedLoansRes.data.pagination?.total ?? 0,
          pendingApprovals: pendingReqRes.data.pagination?.total ?? pReqs.length,
          unpaidFines: 0,
        });
      } else if (user.userId) {
        // STUDENT - Student-to-student peer lending & borrowing metrics
        const [loansRes, reqRes, finesRes] = await Promise.all([
          api.get('/loans?limit=50'),
          api.get('/requests?limit=50'),
          // Fetch only unpaid fines so the total is always accurate
          api.get('/fines?isPaid=false&limit=100').catch(() => ({ data: { data: [] } }))
        ]);
        const loans = loansRes.data.data || [];
        const reqs = reqRes.data.data || [];
        const fines = finesRes.data.data || [];

        const activeBorrows = loans.filter((l) => !l.returnedAt && Number(l.request?.borrowerId) === Number(user.userId)).length;
        const activeLends = loans.filter((l) => !l.returnedAt && (Number(l.request?.item?.ownerId) === Number(user.userId) || Number(l.request?.item?.owner?.userId) === Number(user.userId))).length;
        
        // Incoming requests from peers to borrow items owned by this student
        const incoming = reqs.filter((r) =>
          r.status === 'PENDING' &&
          (Number(r.item?.ownerId) === Number(user.userId) || Number(r.item?.owner?.userId) === Number(user.userId))
        );
        const pendingMyApproval = incoming.length;

        // Outgoing borrow requests made by this student
        const outgoing = reqs.filter((r) => Number(r.borrowerId) === Number(user.userId));
        const pendingMyRequests = outgoing.filter(r => r.status === 'PENDING').length;

        const unpaidFinesTotal = fines
          .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

        setRoleMetrics({
          activeLoans: activeBorrows,
          activeLends: activeLends,
          pendingApprovals: pendingMyApproval,
          pendingRequests: pendingMyRequests,
          unpaidFines: unpaidFinesTotal.toFixed(2),
        });
        setIncomingApprovals(incoming);
        setRecentLoans(loans.slice(0, 5));
        setPendingRequests(outgoing.slice(0, 5));
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await api.put(`/requests/${requestId}/approve`);
      toast.success('Request approved! Loan record created.');
      await loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const remarks = prompt('Enter rejection reason for the borrower:');
    if (remarks === null) return;
    try {
      setProcessingId(requestId);
      await api.put(`/requests/${requestId}/reject`, { remarks });
      toast.success('Request rejected.');
      await loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#74766F] uppercase tracking-wider">
          Loading Overview...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-md border border-[#DAD8D0] p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#526B56]"></span>
            <span className="text-xs font-medium text-[#74766F]">
              VIT Vellore {user?.department?.deptName ? `• ${user.department.deptName}` : ''}
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722] mt-1">
            {user?.fullName}
          </h1>
          <p className="text-xs text-[#74766F] font-mono mt-1">
            Role: <span className="font-medium text-[#242722]">{user?.role}</span>
            {user?.regNo && <> • Reg: <span className="font-medium text-[#242722]">{user.regNo}</span></>}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/items" className="btn-secondary text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5 mr-1.5" />
            <span>Browse Items</span>
          </Link>
          <Link to="/items?action=list" className="btn-primary text-xs sm:text-sm">
            <span>List Item to Lend</span>
          </Link>
        </div>
      </div>

      {/* Due Today Notification Banner */}
      {dueTodayAlerts.length > 0 && (
        <div className="rounded-md border border-[#E5D8BE] bg-[#F7F2E7] p-4 sm:p-5 shadow-subtle text-[#785918]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-md bg-[#785918] text-white mt-0.5 shadow-subtle">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-heading font-semibold text-xs uppercase tracking-wider text-[#785918]">
                    Due Today Reminder
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#F2E9D6] text-[#624610] border border-[#E5D8BE]">
                    {dueTodayAlerts.length} Item{dueTodayAlerts.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {dueTodayAlerts.map((alert) => (
                    <p key={alert.notificationId} className="text-xs text-[#624610] font-medium">
                      • {alert.message}
                    </p>
                  ))}
                </div>
                <p className="text-[11px] text-[#785918] mt-2 font-mono">
                  Please return items on time to keep peer lending fair and avoid late fines.
                </p>
              </div>
            </div>

            <Link
              to="/loans"
              className="btn-ochre whitespace-nowrap text-xs self-start"
            >
              Loan Registry
            </Link>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD VIEW */}
      {user?.role === 'ADMIN' && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Verified Users"
              value={stats.totalUsers}
              icon={UsersIcon}
              color="brand"
              subtitle="Registered accounts"
            />
            <StatCard
              title="Catalogued Items"
              value={stats.totalItems}
              icon={Package}
              color="ivy"
              subtitle={`${stats.availableItems || 0} currently available`}
            />
            <StatCard
              title="Circulating Loans"
              value={stats.activeLoans}
              icon={BookOpen}
              color="ochre"
              subtitle="Items issued across depts"
            />
            <StatCard
              title="Overdue Dues"
              value={stats.overdueLoans}
              icon={Clock}
              color="crimson"
              subtitle={`₹${stats.totalUnpaidFines || 0} pending fines`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Quick Actions (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-md border border-[#DAD8D0] p-5 shadow-subtle">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DAD8D0]">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-[#526B56]" />
                  <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722]">
                    Administrative Operations
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-[#74766F]">System Console</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/admin/reports"
                  className="p-3.5 rounded-md border border-[#DAD8D0] hover:border-[#526B56] hover:bg-[#ECEAE3]/30 transition-all group"
                >
                  <p className="font-heading text-xs font-semibold text-[#242722] group-hover:text-[#526B56] flex items-center justify-between">
                    <span>Analytics & Aggregates</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-[11px] text-[#74766F] mt-1">
                    Top 5 borrowed items, department usage, and unpaid fines.
                  </p>
                </Link>

                <Link
                  to="/admin/fines"
                  className="p-3.5 rounded-md border border-[#DAD8D0] hover:border-[#526B56] hover:bg-[#ECEAE3]/30 transition-all group"
                >
                  <p className="font-heading text-xs font-semibold text-[#242722] group-hover:text-[#526B56] flex items-center justify-between">
                    <span>Fine Settlement Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-[11px] text-[#74766F] mt-1">
                    Review late return penalties and mark fines as settled.
                  </p>
                </Link>

                <Link
                  to="/admin/users"
                  className="p-3.5 rounded-md border border-[#DAD8D0] hover:border-[#526B56] hover:bg-[#ECEAE3]/30 transition-all group"
                >
                  <p className="font-heading text-xs font-semibold text-[#242722] group-hover:text-[#526B56] flex items-center justify-between">
                    <span>User & Role Directory</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-[11px] text-[#74766F] mt-1">
                    Manage students, faculty/staff, and account statuses.
                  </p>
                </Link>

                <Link
                  to="/loans"
                  className="p-3.5 rounded-md border border-[#DAD8D0] hover:border-[#526B56] hover:bg-[#ECEAE3]/30 transition-all group"
                >
                  <p className="font-heading text-xs font-semibold text-[#242722] group-hover:text-[#526B56] flex items-center justify-between">
                    <span>Loan Registry</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-[11px] text-[#74766F] mt-1">
                    Inspect active loans, due dates, and processed returns.
                  </p>
                </Link>
              </div>
            </div>

            {/* Architecture Specifications (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-md border border-[#DAD8D0] p-5 shadow-subtle">
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-[#DAD8D0]">
                <Layers className="w-4 h-4 text-[#526B56]" />
                <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722]">
                  System Architecture
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#DAD8D0]/60">
                  <span className="text-[#74766F]">Database Engine</span>
                  <span className="font-mono font-medium text-[#242722]">MySQL 8.0 (InnoDB)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DAD8D0]/60">
                  <span className="text-[#74766F]">Normalization</span>
                  <span className="font-mono font-medium text-[#325238]">3NF / BCNF Verified</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DAD8D0]/60">
                  <span className="text-[#74766F]">Daily Reminder Job</span>
                  <span className="font-mono font-medium text-[#785918]">node-cron (08:00 IST)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DAD8D0]/60">
                  <span className="text-[#74766F]">Audit Logging</span>
                  <span className="font-mono font-medium text-[#242722]">trg_loan_returned (Active)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[#74766F] font-mono text-[11px]">System Status</span>
                  <span className="font-mono text-[11px] text-[#526B56] font-medium">Online & Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* STAFF & STUDENT VIEW */}
      {user?.role !== 'ADMIN' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title={user?.role === 'STAFF' ? 'Pending Approvals' : "Items I'm Borrowing"}
              value={user?.role === 'STAFF' ? roleMetrics.pendingRequests : roleMetrics.activeLoans}
              icon={user?.role === 'STAFF' ? ClipboardList : BookOpen}
              color="brand"
              subtitle={user?.role === 'STAFF' ? 'Requests awaiting decision' : 'Checked out to you'}
            />
            <StatCard
              title={user?.role === 'STAFF' ? 'Active Circulations' : "Items I Lent to Peers"}
              value={user?.role === 'STAFF' ? roleMetrics.activeLoans : roleMetrics.activeLends}
              icon={user?.role === 'STAFF' ? BookOpen : Package}
              color="ivy"
              subtitle={user?.role === 'STAFF' ? 'Currently on loan' : 'Your items with classmates'}
            />
            <Link to="/requests" className="block hover:opacity-95 transition-opacity">
              <StatCard
                title={user?.role === 'STAFF' ? 'Processed Returns' : 'Awaiting My Approval'}
                value={user?.role === 'STAFF' ? roleMetrics.completedLoans : roleMetrics.pendingApprovals}
                icon={ClipboardList}
                color={roleMetrics.pendingApprovals > 0 ? "brand" : "ochre"}
                subtitle={user?.role === 'STAFF' ? 'Safely returned items' : (roleMetrics.pendingApprovals > 0 ? `${roleMetrics.pendingApprovals} need approval →` : 'Peer borrow requests')}
              />
            </Link>
            <StatCard
              title={user?.role === 'STAFF' ? 'System Status' : 'Outstanding Fines'}
              value={user?.role === 'STAFF' ? 'Online' : `₹${roleMetrics.unpaidFines}`}
              icon={AlertTriangle}
              color={user?.role === 'STAFF' || roleMetrics.unpaidFines === 0 ? 'ivy' : 'crimson'}
              subtitle={user?.role === 'STAFF' ? 'Circulation active' : 'Late return penalties'}
            />
          </div>

          {/* Actionable Incoming Requests (Awaiting Decision) */}
          {incomingApprovals.length > 0 && (
            <div className="bg-[#EBF0EC]/50 border-2 border-[#526B56] rounded-md p-5 shadow-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#C6D8C8] gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#526B56] animate-pulse"></span>
                  <h2 className="font-heading text-sm font-bold text-[#242722]">
                    Action Required: {incomingApprovals.length} Borrow Request{incomingApprovals.length > 1 ? 's' : ''} Awaiting Your Approval
                  </h2>
                </div>
                <Link to="/requests" className="text-xs text-[#526B56] hover:text-[#3F5543] font-medium flex items-center">
                  <span>Open Requests Queue</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>

              <div className="divide-y divide-[#C6D8C8]/80">
                {incomingApprovals.map((req) => (
                  <div key={req.requestId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#242722]">{req.item?.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#526B56]/15 text-[#325238] font-semibold border border-[#C6D8C8]">
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[#74766F] mt-1">
                        Borrower: <strong className="text-[#242722]">{req.borrower?.fullName}</strong> ({req.borrower?.regNo || req.borrower?.email})
                        {' • '}
                        Requested: {new Date(req.requestedFrom).toLocaleDateString()} to {new Date(req.requestedTo).toLocaleDateString()}
                      </p>
                      {req.remarks && (
                        <p className="text-[11px] text-[#74766F] italic mt-0.5">"{req.remarks}"</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        disabled={processingId === req.requestId}
                        onClick={() => handleApprove(req.requestId)}
                        className="btn-primary py-1 px-3 text-xs flex items-center space-x-1"
                        title="Approve borrow request"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span>{processingId === req.requestId ? 'Approving...' : 'Approve'}</span>
                      </button>
                      <button
                        disabled={processingId === req.requestId}
                        onClick={() => handleReject(req.requestId)}
                        className="btn-secondary py-1 px-3 text-xs text-[#8A332F] hover:bg-[#FAECEB] flex items-center space-x-1 border-[#E8C4C2]"
                        title="Decline request"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Active / Recent Loans */}
            <div className="bg-white rounded-md border border-[#DAD8D0] p-5 shadow-subtle">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DAD8D0]">
                <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722]">
                  {user?.role === 'STAFF' ? 'Recent Active Loans' : 'My Current Loans'}
                </h2>
                <Link to="/loans" className="text-xs text-[#526B56] hover:text-[#3F5543] font-medium flex items-center">
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>

              {recentLoans.length === 0 ? (
                <p className="text-xs text-[#74766F] py-8 text-center font-mono">
                  No active loan records found.
                </p>
              ) : (
                <div className="divide-y divide-[#DAD8D0]/60">
                  {recentLoans.slice(0, 4).map((loan) => (
                    <div key={loan.loanId} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-[#242722]">
                          {loan.request?.item?.title || `Loan #${loan.loanId}`}
                        </p>
                        <p className="text-[11px] font-mono text-[#74766F] mt-0.5">
                          Due: {new Date(loan.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                          loan.returnedAt
                            ? 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]'
                            : new Date(loan.dueDate) < new Date()
                            ? 'bg-[#FAECEB] text-[#8A332F] border-[#E8C4C2]'
                            : 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE]'
                        }`}
                      >
                        {loan.returnedAt ? 'RETURNED' : new Date(loan.dueDate) < new Date() ? 'OVERDUE' : 'ACTIVE'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Requests */}
            <div className="bg-white rounded-md border border-[#DAD8D0] p-5 shadow-subtle">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DAD8D0]">
                <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722]">
                  {user?.role === 'STAFF' ? 'Requests Awaiting Decision' : 'My Requests'}
                </h2>
                <Link to="/requests" className="text-xs text-[#526B56] hover:text-[#3F5543] font-medium flex items-center">
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-[#74766F] py-8 text-center font-mono">
                  No pending lending requests.
                </p>
              ) : (
                <div className="divide-y divide-[#DAD8D0]/60">
                  {pendingRequests.slice(0, 4).map((req) => (
                    <div key={req.requestId} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-[#242722]">
                          {req.item?.title || `Request #${req.requestId}`}
                        </p>
                        <p className="text-[11px] font-mono text-[#74766F] mt-0.5">
                          {req.borrower?.fullName ? `${req.borrower.fullName} • ` : ''}
                          Until: {new Date(req.requestedTo).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                          req.status === 'APPROVED'
                            ? 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]'
                            : req.status === 'REJECTED'
                            ? 'bg-[#FAECEB] text-[#8A332F] border-[#E8C4C2]'
                            : 'bg-[#ECEAE3] text-[#494B45] border-[#DAD8D0]'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
