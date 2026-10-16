// CampusLend - Login & Authentication
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LogIn, UserPlus, X, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CampusLogo from '../components/CampusLogo';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'enroll'

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration fields
  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [deptId, setDeptId] = useState('');
  const [phone, setPhone] = useState('');

  // Google SSO Modal fields
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Department metadata
  const [departments, setDepartments] = useState([
    { deptId: 1, deptName: 'Computer Science' },
    { deptId: 2, deptName: 'Electronics' },
    { deptId: 3, deptName: 'Mechanical' },
    { deptId: 4, deptName: 'Chemistry' }
  ]);

  const [loading, setLoading] = useState(false);
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('google_sso') === '1') {
      setShowGoogleModal(true);
    }
  }, [location.search]);

  useEffect(() => {
    api.get('/auth/meta')
      .then((res) => {
        if (res.data?.data?.departments?.length) {
          setDepartments(res.data.data.departments);
          if (!deptId) setDeptId(String(res.data.data.departments[0].deptId));
        }
      })
      .catch(() => {});
  }, []);

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      const userData = res.data?.data?.user || res.data?.data;
      setUser(userData);
      toast.success('Signed in successfully');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        regNo: regNo.trim() || undefined,
        role,
        deptId: deptId ? parseInt(deptId, 10) : undefined,
        phone: phone.trim() || undefined
      };

      const res = await api.post('/auth/register', payload);
      const userData = res.data?.data;
      setUser(userData);
      toast.success('Account created successfully');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await api.get('/auth/google/status');
      if (res.data?.isConfigured) {
        window.location.href = '/api/auth/google';
      } else {
        setShowGoogleModal(true);
      }
    } catch {
      setShowGoogleModal(true);
    }
  };

  const handleGoogleSSOSubmit = async (selectedEmail, selectedName) => {
    const targetEmail = selectedEmail || googleCustomEmail;
    const targetName = selectedName || googleCustomName;

    if (!targetEmail || !targetEmail.trim()) {
      toast.error('Please enter a VIT Google account email');
      return;
    }

    const clean = targetEmail.trim().toLowerCase();
    if (!clean.endsWith('@vitstudent.ac.in') && !clean.endsWith('@vit.ac.in')) {
      toast.error('Please use your institutional VIT account (@vitstudent.ac.in or @vit.ac.in)');
      return;
    }

    try {
      setGoogleSubmitting(true);
      const res = await api.post('/auth/google/sso', {
        email: clean,
        fullName: targetName ? targetName.trim() : undefined,
      });
      const userData = res.data?.data;
      setUser(userData);
      setShowGoogleModal(false);
      toast.success('Signed in with Google successfully');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Sign-In failed');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const presetVITAccounts = [
    { name: 'Amani Yadav', email: 'amani.yadav@vitstudent.ac.in', initial: 'A' },
    { name: 'Sanjana B S', email: 'sanjana.bs@vitstudent.ac.in', initial: 'S' },
    { name: 'Dr. Ramesh Kumar', email: 'ramesh.kumar@vit.ac.in', initial: 'R' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F5F1] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <CampusLogo className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#242722]">
          CampusLend
        </h1>
        <p className="text-xs font-medium text-[#74766F] mt-1">
          VIT Vellore • Student Lending & Resource Exchange
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-subtle border border-[#DAD8D0] rounded-md sm:px-8">
          {mode === 'signin' ? (
            <>
              {/* Google Sign In */}
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-[#DAD8D0] rounded-md text-sm font-medium text-[#242722] bg-white hover:bg-[#ECEAE3] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#DAD8D0]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2.5 text-[#9A9C94]">
                    or
                  </span>
                </div>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleLocalLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#242722]">
                    VIT Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@vitstudent.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-archival mt-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#242722]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-archival mt-1"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-2 text-sm"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode('enroll')}
                  className="text-xs text-[#74766F] hover:text-[#242722]"
                >
                  Don't have an account? <span className="underline font-medium text-[#526B56]">Create one</span>
                </button>
              </div>
            </>
          ) : (
            /* Registration Form */
            <form onSubmit={handleEnrollment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#242722]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-archival mt-1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722]">
                  VIT Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@vitstudent.ac.in or name@vit.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-archival mt-1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722]">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-archival mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#242722]">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input-archival bg-white mt-1"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STAFF">Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#242722]">
                    Reg / ID No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24BCE2516"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="input-archival mt-1 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722]">
                  Department
                </label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="input-archival bg-white mt-1"
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map((d) => (
                    <option key={d.deptId} value={d.deptId}>
                      {d.deptName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Contact number (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-archival mt-1 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2 text-sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span>{loading ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-xs text-[#74766F] hover:text-[#242722]"
                >
                  Already have an account? <span className="underline font-medium text-[#526B56]">Sign in</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Google Account Chooser Modal (SSO) */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-[#242722]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md shadow-modal max-w-sm w-full p-5 border border-[#DAD8D0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DAD8D0]">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <h3 className="font-heading text-sm font-bold text-[#242722]">Sign in with Google</h3>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-[#74766F] hover:text-[#242722] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#74766F] my-3">
              Choose your VIT Google account to continue to <strong>CampusLend</strong>.
            </p>

            <div className="space-y-1.5 mb-4">
              {presetVITAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={googleSubmitting}
                  onClick={() => handleGoogleSSOSubmit(acc.email, acc.name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-md border border-[#DAD8D0] hover:border-[#9A9C94] hover:bg-[#ECEAE3]/40 transition-colors text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#526B56] text-white flex items-center justify-center text-xs font-semibold font-heading">
                      {acc.initial}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#242722] leading-tight">{acc.name}</p>
                      <p className="text-[11px] font-mono text-[#74766F]">{acc.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#9A9C94]" />
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#DAD8D0]">
              <label className="block text-[11px] font-medium text-[#74766F] mb-1">
                Or enter another VIT Google account:
              </label>
              <input
                type="email"
                placeholder="yourname@vitstudent.ac.in"
                value={googleCustomEmail}
                onChange={(e) => setGoogleCustomEmail(e.target.value)}
                className="input-archival text-xs mb-2"
              />
              <button
                type="button"
                disabled={googleSubmitting || !googleCustomEmail}
                onClick={() => handleGoogleSSOSubmit(googleCustomEmail, '')}
                className="w-full btn-primary py-1.5 text-xs"
              >
                {googleSubmitting ? 'Verifying...' : 'Sign In with This Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
