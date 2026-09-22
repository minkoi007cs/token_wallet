import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const AppWallet = lazy(() => import('./pages/AppWallet'));
const TokenWallet = lazy(() => import('./pages/TokenWallet'));
const PaymentSchedule = lazy(() => import('./pages/PaymentSchedule'));
const CodeExperience = lazy(() => import('./pages/CodeExperience'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<AppWallet />} />
            <Route path="app-wallet" element={<AppWallet />} />
            <Route path="code-experience" element={<CodeExperience />} />
            <Route path="notes" element={<CodeExperience />} />

            {/* Protected pages */}
            <Route
              path="token-wallet"
              element={
                <ProtectedRoute requiredPermission="can_read_token_wallet">
                  <TokenWallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute requiredPermission="can_read_payments">
                  <PaymentSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment-schedule"
              element={
                <ProtectedRoute requiredPermission="can_read_payments">
                  <PaymentSchedule />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
