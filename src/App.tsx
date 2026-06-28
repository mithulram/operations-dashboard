import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminKeyProvider } from './context/AdminKeyContext';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MonitorsPage } from './pages/MonitorsPage';
import { PublicStatusPageRoute } from './pages/PublicStatusPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatusPageAdminPage } from './pages/StatusPageAdminPage';
import './App.css';

export default function App() {
  return (
    <AdminKeyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/status/:slug" element={<PublicStatusPageRoute />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/monitors" element={<MonitorsPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/status-page" element={<StatusPageAdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminKeyProvider>
  );
}
