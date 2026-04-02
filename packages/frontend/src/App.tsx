import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import TaxInsights from './pages/TaxInsights';
import Settings from './pages/Settings';
import Backup from './pages/Backup';
import Recurring from './pages/Recurring';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Expenses />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/insights" element={<TaxInsights />} />
          <Route path="/settings" element={<Settings />} />          <Route path="/recurring" element={<Recurring />} />            <Route path="/backup" element={<Backup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
