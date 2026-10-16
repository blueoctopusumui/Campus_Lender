// CampusLend - Notifications Center
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, CheckCircle2, CheckCheck, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722]">
            Notifications
          </h1>
          <p className="text-xs text-[#74766F] mt-1">
            Due date reminders, borrow requests, approval updates, and return confirmations.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="btn-secondary self-start text-xs"
        >
          <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-[#526B56]" />
          <span>Mark All as Read</span>
        </button>
      </div>

      <div className="bg-white rounded-md border border-[#DAD8D0] divide-y divide-[#DAD8D0]/60 overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-[#74766F]">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-[#74766F] text-xs font-mono">
            <Bell className="w-8 h-8 mx-auto mb-2 text-[#9A9C94] stroke-[1.5]" />
            <p>No notifications on record.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isDueToday = n.notificationType === 'DUE_TODAY';
            const isOverdue = n.notificationType === 'OVERDUE';
            const isRequestNotif = n.message?.toLowerCase().includes('requested to borrow') || n.message?.toLowerCase().includes('borrow request');
            const isLoanNotif = isDueToday || isOverdue || n.message?.toLowerCase().includes('loan') || n.message?.toLowerCase().includes('returned');

            const handleClick = () => {
              if (!n.isRead) handleMarkAsRead(n.notificationId);
              if (isRequestNotif) {
                navigate('/requests');
              } else if (isLoanNotif) {
                navigate('/loans');
              }
            };

            return (
              <div
                key={n.notificationId}
                onClick={handleClick}
                className={`p-4 flex items-start space-x-3.5 transition-colors cursor-pointer border-l-2 ${
                  isDueToday
                    ? 'border-l-[#785918] bg-[#F7F2E7]/40 hover:bg-[#F7F2E7]/70'
                    : isOverdue
                    ? 'border-l-[#8A332F] bg-[#FAECEB]/40 hover:bg-[#FAECEB]/70'
                    : isRequestNotif
                    ? 'border-l-[#526B56] bg-[#EBF0EC]/30 hover:bg-[#EBF0EC]/60'
                    : 'border-l-transparent hover:bg-[#ECEAE3]/30'
                } ${!n.isRead ? 'font-medium' : 'opacity-80'}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isDueToday ? (
                    <div className="p-1.5 bg-[#F7F2E7] text-[#785918] rounded-md border border-[#E5D8BE]">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : isOverdue ? (
                    <div className="p-1.5 bg-[#FAECEB] text-[#8A332F] rounded-md border border-[#E8C4C2]">
                      <Clock className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-[#EBF0EC] text-[#325238] rounded-md border border-[#C6D8C8]">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                        isDueToday
                          ? 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE]'
                          : isOverdue
                          ? 'bg-[#FAECEB] text-[#8A332F] border-[#E8C4C2]'
                          : isRequestNotif
                          ? 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]'
                          : 'bg-[#ECEAE3] text-[#494B45] border-[#DAD8D0]'
                      }`}
                    >
                      {isRequestNotif ? 'BORROW REQUEST' : n.notificationType}
                    </span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#526B56]"></span>
                    )}
                  </div>
                  <p className="text-xs text-[#242722] mt-1 leading-snug">
                    {n.message}
                  </p>
                  {isRequestNotif && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#526B56] hover:text-[#3F5543] underline">
                        <span>Review & Approve Request</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] font-mono text-[#74766F] mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString()} at{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
