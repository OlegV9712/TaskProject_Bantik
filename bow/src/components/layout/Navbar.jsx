import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Icon from '../common/Icon';
import '../../styles/Navbar.css';

function Navbar({ onLogout }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Boss';
  const sections = [
    {
      label: 'Работа',
      items: [
        { to: '/tasks', label: 'Мои задачи', icon: 'tasks' },
        { to: '/projects', label: 'Проекты', icon: 'projects' },
        { to: '/schedule', label: 'График проектов', icon: 'schedule' },
        { to: '/settings', label: 'Настройки', icon: 'settings' },
      ],
    },
    ...(isAdmin ? [{
      label: 'Управление',
      items: [
        { to: '/workload', label: 'Нагрузка', icon: 'workload' },
        { to: '/admin/settings', label: 'Справочники и поля', icon: 'directory' },
        { to: '/admin/tasks', label: 'Задачи кураторов', icon: 'adminTasks' },
        { to: '/admin/users', label: 'Пользователи', icon: 'users' },
        { to: '/fun', label: 'Димины забавы', icon: 'fun' },
      ],
    }] : []),
  ];

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__mark"><Icon name="bow" size={23} strokeWidth={1.7} /></span>
        <span className="navbar__brand-copy">
          <span className="navbar__title">Бантик</span>
          <span className="navbar__caption">ПРОЕКТНЫЙ ОФИС</span>
        </span>
      </div>
      <div className="navbar__navigation">
        {sections.map(section => (
          <section className="navbar__section" key={section.label}>
            <h2 className="navbar__section-title">{section.label}</h2>
            <ul className="navbar__list">
              {section.items.map(item => (
                <li className="navbar__item" key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
                    <Icon name={item.icon} className="navbar__link-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="navbar__footer">
        <div className="navbar__account">
          <span className="navbar__avatar">{user?.username?.slice(0, 1)?.toLocaleUpperCase('ru-RU') || 'П'}</span>
          <span className="navbar__account-copy">
            <strong>{user?.username || 'Пользователь'}</strong>
            <small>{isAdmin ? 'Администратор' : 'Куратор'}</small>
          </span>
        </div>
        <button className="navbar__logout" onClick={onLogout}>
          <Icon name="logout" className="navbar__link-icon" />
          <span>Выйти</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;