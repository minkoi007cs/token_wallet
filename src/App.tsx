import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import TokenWallet from './pages/TokenWallet';
import AppWallet from './pages/AppWallet';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TokenWallet />} />
          <Route path="app-wallet" element={<AppWallet />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
