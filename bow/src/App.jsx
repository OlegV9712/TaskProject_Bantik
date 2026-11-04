import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import LoginPage from './components/auth/LoginPage';
import Layout from './components/layout/Layout';
import ProjectsPage from './components/pages/ProjectsPage';
import SettingsPage from './components/pages/SettingsPage';
import UsersAdmin from './components/pages/UsersAdmin';
import DimaPage from './components/pages/DimaPage';
import CuratorPage from './components/pages/CuratorPage';
import SchedulePage from './components/pages/SchedulePage';
import WorkloadPage from './components/pages/WorkloadPage';
import AdminSettingsPage from './components/pages/AdminSettingsPage';
import AdminTasksPage from './components/pages/AdminTasksPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app__auth-loading">Проверяем сессию…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app__auth-loading">Проверяем сессию…</div>;
  return user?.role === 'Boss' ? children : <Navigate to="/tasks" replace />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app__auth-loading">Проверяем сессию…</div>;
  return user ? <Navigate to={user.role === 'Boss' ? '/projects' : '/tasks'} replace /> : <LoginPage />;
}

function DefaultRoute() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'Boss' ? '/projects' : '/tasks'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DefaultRoute />} />
            <Route path="tasks" element={<CuratorPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="workload" element={<AdminRoute><WorkloadPage /></AdminRoute>} />
            <Route path="admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
            <Route path="admin/tasks" element={<AdminRoute><AdminTasksPage /></AdminRoute>} />
            <Route path="fun" element={<AdminRoute><DimaPage /></AdminRoute>} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin/users" element={<AdminRoute><UsersAdmin /></AdminRoute>} />
          </Route>
          <Route path="*" element={<DefaultRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;