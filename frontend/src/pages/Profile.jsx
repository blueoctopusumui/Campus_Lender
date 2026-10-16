// CampusLend - Academic User Profile
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user, setUser } = useAuth();

  // Basic Info Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [regNo, setRegNo] = useState(user?.regNo || '');
  const [deptId, setDeptId] = useState(user?.deptId ? String(user.deptId) : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [departments, setDepartments] = useState([
    { deptId: 1, deptName: 'Computer Science' },
    { deptId: 2, deptName: 'Electronics' },
    { deptId: 3, deptName: 'Mechanical' },
    { deptId: 4, deptName: 'Chemistry' }
  ]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Updation Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      setFullName(user.fullName || '');
      setRegNo(user.regNo || '');
      setDeptId(user.deptId ? String(user.deptId) : '');
      setPhone(user.phone || '');

      api.get(`/users/${user.userId}`)
        .then((res) => {
          if (res.data?.data) {
            const fresh = res.data.data;
            setFullName(fresh.fullName || '');
            setRegNo(fresh.regNo || '');
            setDeptId(fresh.deptId ? String(fresh.deptId) : '');
            setPhone(fresh.phone || '');
            setUser(fresh);
          }
        })
        .catch(() => {});
    }
  }, [user?.userId, setUser]);

  useEffect(() => {
    // Fetch departments list
    api.get('/auth/meta')
      .then((res) => {
        if (res.data?.data?.departments?.length) {
          setDepartments(res.data.data.departments);
        }
      })
      .catch(() => {});
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        fullName: fullName.trim(),
        regNo: regNo.trim() || null,
        deptId: deptId ? parseInt(deptId, 10) : null,
        phone: phone.trim() || null,
      };

      const res = await api.put(`/users/${user.userId}`, payload);
      setUser(res.data.data);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    try {
      setSavingPassword(true);
      const payload = {
        currentPassword: currentPassword || undefined,
        newPassword,
      };

      await api.put(`/users/${user.userId}`, payload);
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722]">
          User Profile & Settings
        </h1>
        <p className="text-xs text-[#74766F] mt-1">
          Manage your academic credentials, department affiliation, and account security.
        </p>
      </div>

      {/* Profile Card Header */}
      <div className="bg-white rounded-md border border-[#DAD8D0] shadow-subtle overflow-hidden">
        <div className="bg-[#242722] px-6 py-5 text-white flex items-center justify-between border-b border-[#242722]">
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-md bg-[#526B56] border border-white/10 flex items-center justify-center font-heading font-semibold text-lg text-white">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-white tracking-tight">{user?.fullName}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-white/10 text-white uppercase">
                  {user?.role}
                </span>
                <span className="text-xs text-[#74766F]">•</span>
                <span className="text-xs font-mono text-[#DAD8D0]">
                  {user?.regNo || 'NO REG NO'}
                </span>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#526B56]/20 text-[#C6D8C8] border border-[#526B56]/40 text-[11px] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C6D8C8]" />
            <span>VIT Verified</span>
          </span>
        </div>

        {/* Edit Academic Info Form */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722] flex items-center gap-1.5 pb-2 border-b border-[#DAD8D0]">
              <User className="w-4 h-4 text-[#526B56]" />
              <span>Academic Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-archival text-xs"
                  placeholder="Your Full Name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="input-archival text-xs bg-[#ECEAE3]/40 text-[#74766F] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Registration Index / Reg No.
                </label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="input-archival text-xs font-mono uppercase"
                  placeholder="e.g. 24BCE2516"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Academic Department
                </label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="input-archival text-xs bg-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.deptId} value={d.deptId}>
                      {d.deptName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-archival text-xs font-mono max-w-sm"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary py-1.5 px-4 text-xs"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Password Updation Form */}
          <form onSubmit={handlePasswordUpdate} className="pt-6 border-t border-[#DAD8D0] space-y-4">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#242722] flex items-center gap-1.5 pb-2 border-b border-[#DAD8D0]">
              <KeyRound className="w-4 h-4 text-[#526B56]" />
              <span>Password & Security</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-archival text-xs"
                  placeholder="Enter current password"
                />
                <p className="text-[10px] text-[#74766F] mt-0.5">
                  Leave blank if signed in via Google.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-archival text-xs"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-archival text-xs"
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="btn-primary py-1.5 px-4 text-xs"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
