import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import TokenWallet from './pages/TokenWallet';
import AppWallet from './pages/AppWallet';
import PaymentSchedule from './pages/PaymentSchedule';
import UserManagement from './pages/UserManagement';
import Notes from './pages/Notes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* App Wallet — public read, no login required */}
            <Route index element={<AppWallet />} />
            <Route path="app-wallet" element={<AppWallet />} />

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

            {/* Admin only */}
            <Route path="users" element={<UserManagement />} />

            {/* Notes — public */}
            <Route path="notes" element={<Notes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
