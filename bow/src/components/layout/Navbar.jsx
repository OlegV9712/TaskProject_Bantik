import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../../styles/Navbar.css';

function Navbar({ onLogout }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Boss';
  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__icon">🎀</span>
        <span className="navbar__title">Бантик</span>
      </div>
      <ul className="navbar__list">
        <li className="navbar__item">
          <NavLink to="/tasks" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            ✅ Мои задачи
          </NavLink>
        </li>
        <li className="navbar__item">
          <NavLink to="/projects" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            📋 Проекты
          </NavLink>
        </li>
        <li className="navbar__item">
          <NavLink to="/schedule" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            📅 График проектов
          </NavLink>
        </li>
        <li className="navbar__item">
          <NavLink to="/settings" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            ⚙️ Настройки
          </NavLink>
        </li>
        {isAdmin && <>
        <li className="navbar__item">
          <NavLink to="/workload" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            📊 Нагрузка
          </NavLink>
        </li>
        <li className="navbar__item">
          <NavLink to="/admin/settings" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            🧰 Справочники и поля
          </NavLink>
        </li>
        <li className="navbar__item">
          <NavLink to="/admin/tasks" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            🧾 Задачи кураторов
          </NavLink>
        </li>
        </>}
        {isAdmin && <li className="navbar__item">
          <NavLink
            to="/fun"
            className={({ isActive }) =>
              `navbar__link ${isActive ? 'navbar__link--active' : ''}`
            }
          >
            🎲 Димины забавы
          </NavLink>
        </li>}
        {isAdmin && (
          <li className="navbar__item">
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              🛠 Пользователи
            </NavLink>
          </li>
        )}
      </ul>
      <button className="navbar__logout" onClick={onLogout}>
        🚪 Выйти
      </button>
    </nav>
  );
}

export default Navbar;