// CampusLend - NotificationBell
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle2, ChevronRight, CheckCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const count = res.data?.data?.unreadCount || 0;
      setUnreadCount((prev) => {
        if (prev !== count) {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
        return count;
      });
    } catch {
      // ignore
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      setNotifications(res.data?.data || []);
    } catch {
      // ignore
    }
  };

  // Re-fetch on mount and on every route navigation
  useEffect(() => {
    fetchUnreadCount();
  }, [location.pathname]);

  // Periodic poll + global sync event
  useEffect(() => {
    const handleSync = () => {
      fetchUnreadCount();
      if (isOpen) fetchRecent();
    };
    window.addEventListener('notificationsUpdated', handleSync);

    // Fast poll (5s) for instant real-time notification alerts
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => {
      window.removeEventListener('notificationsUpdated', handleSync);
      clearInterval(interval);
    };
  }, [isOpen]);

  // When dropdown opens, fetch both unread count and latest list
  useEffect(() => {
    if (isOpen) {
      fetchUnreadCount();
      fetchRecent();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-[#74766F] hover:text-[#242722] rounded-md hover:bg-[#ECEAE3] transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 stroke-[1.8]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 text-[9px] font-mono font-bold text-white bg-[#526B56] rounded-full px-1 shadow-subtle">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-elevated border border-[#DAD8D0] py-1 z-50">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#DAD8D0] bg-[#ECEAE3]/30">
            <div className="flex items-center space-x-2">
              <span className="font-heading font-semibold text-[#242722] text-xs">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#EBF0EC] text-[#325238] border border-[#C6D8C8]">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-[#74766F] hover:text-[#242722] font-medium flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-[11px] text-[#526B56] hover:text-[#3F5543] font-medium flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#DAD8D0]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#74766F]">
                No notifications
              </div>
            ) : (
              notifications.map((n) => {
                const isDueToday = n.notificationType === 'DUE_TODAY';
                const isOverdue = n.notificationType === 'OVERDUE';
                const isRequestNotif = n.message?.toLowerCase().includes('requested to borrow') || n.message?.toLowerCase().includes('borrow request');
                const isLoanNotif = isDueToday || isOverdue || n.message?.toLowerCase().includes('loan') || n.message?.toLowerCase().includes('returned');

                const handleItemClick = () => {
                  if (!n.isRead) markAsRead(n.notificationId);
                  setIsOpen(false);
                  if (isRequestNotif) {
                    navigate('/requests');
                  } else if (isLoanNotif) {
                    navigate('/loans');
                  }
                };

                return (
                  <div
                    key={n.notificationId}
                    onClick={handleItemClick}
                    className={`p-3 text-left transition-colors cursor-pointer border-l-2 ${
                      isDueToday
                        ? 'border-[#785918] bg-[#F7F2E7]/40 hover:bg-[#F7F2E7]/70'
                        : isOverdue
                        ? 'border-[#8A332F] bg-[#FAECEB]/40 hover:bg-[#FAECEB]/70'
                        : isRequestNotif
                        ? 'border-[#526B56] bg-[#EBF0EC]/30 hover:bg-[#EBF0EC]/60'
                        : 'border-transparent hover:bg-[#ECEAE3]/40'
                    } ${!n.isRead ? 'font-medium' : 'opacity-70'}`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5 flex-shrink-0">
                        {isDueToday ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#785918]" />
                        ) : isOverdue ? (
                          <Clock className="w-3.5 h-3.5 text-[#8A332F]" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#526B56]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#242722] leading-snug">
                          {n.message}
                        </p>
                        {isRequestNotif && (
                          <span className="inline-flex items-center text-[10px] font-mono font-medium text-[#526B56] hover:text-[#3F5543] underline mt-1">
                            Review & Approve Request →
                          </span>
                        )}
                        <p className="text-[10px] font-mono text-[#74766F] mt-1">
                          {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
