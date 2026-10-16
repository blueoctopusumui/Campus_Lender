// CampusLend - Admin User Directory (RBAC)
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import api from '../../api/axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search })
      });
      const res = await api.get(`/users?${params.toString()}`);
      setUsers(res.data.data || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await api.delete(`/users/${userId}`);
        toast.success('User account deactivated');
      } else {
        await api.put(`/users/${userId}`, { isActive: true });
        toast.success('User account activated');
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const roleStyles = {
    ADMIN: 'bg-[#242722] text-white border-[#242722] font-semibold',
    STAFF: 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE] font-medium',
    STUDENT: 'bg-[#ECEAE3] text-[#242722] border-[#DAD8D0] font-medium',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722]">
            User Directory
          </h1>
          <p className="text-xs text-[#74766F] mt-1">
            Manage students, faculty/staff and administrators registered in the system.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#74766F]" />
          <input
            type="text"
            placeholder="Search by name, email, reg no..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-archival pl-9 w-64 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-md border border-[#DAD8D0] overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-[#74766F]">Loading user records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-[#74766F] text-xs font-mono">
            No users found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#ECEAE3]/40 border-b border-[#DAD8D0] text-[#74766F] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Registration #</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Department</th>
                  <th className="py-3 px-4 font-medium">Account Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DAD8D0]/60 font-sans">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-[#ECEAE3]/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#242722]">{u.fullName}</div>
                      <div className="text-[11px] font-mono text-[#74766F]">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#74766F]">
                      {u.regNo || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${
                          roleStyles[u.role?.roleName || u.role] || 'bg-[#ECEAE3] text-[#242722]'
                        }`}
                      >
                        {u.role?.roleName || u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#74766F]">
                      {u.department?.deptName || 'Campus Wide'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-[#526B56]' : 'bg-[#8A332F]'}`}></span>
                        <span className="text-[11px] font-mono text-[#242722]">
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleActive(u.userId, u.isActive)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            u.isActive
                              ? 'bg-[#FAECEB] text-[#8A332F] hover:bg-[#F3DDDC] border border-[#E8C4C2]'
                              : 'bg-[#EBF0EC] text-[#325238] hover:bg-[#DFE7E0] border border-[#C6D8C8]'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <Ban className="w-3 h-3" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
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
