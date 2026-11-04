import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../../styles/Layout.css';
import { apiFetch } from '../../api';
import { useAuth } from '../auth/AuthContext';

function Layout() {
  const navigate = useNavigate();
  const { clear } = useAuth();

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to close server session', error);
    }
    clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <Navbar onLogout={handleLogout} />
      <main className="layout__content">
        <Outlet />  {/* сюда подставляются страницы Projects / Settings */}
      </main>
    </div>
  );
}

export default Layout;