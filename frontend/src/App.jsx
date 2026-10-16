// CampusLend - App Router
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import Requests from './pages/Requests';
import Loans from './pages/Loans';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Users from './pages/admin/Users';
import Fines from './pages/admin/Fines';
import Reports from './pages/admin/Reports';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/items" element={<Items />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin Only Routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fines"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Fines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Reports />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback: unknown URLs go to login, ProtectedRoute will then redirect to dashboard if already authenticated */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
