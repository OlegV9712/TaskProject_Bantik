import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, jsonBody } from '../../api';
import { useAuth } from './AuthContext';
import Icon from '../common/Icon';
import '../../styles/LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const authenticatedUser = await apiFetch('/auth/login', {
        method: 'POST',
        body: jsonBody({ email, password }),
      });
      const sessionUser = await refresh();
      if (!sessionUser) throw new Error('The server session could not be verified.');
      navigate(authenticatedUser.role === 'Boss' ? '/projects' : '/tasks', { replace: true });
    } catch (reason) {
      setError(reason.message.includes('too_many_login_attempts')
        ? 'Слишком много попыток. Попробуйте войти через 15 минут.'
        : 'Не удалось войти. Проверьте имя пользователя и пароль.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="login__container">
        <aside className="login__intro">
          <div className="login__brand">
            <span className="login__mark"><Icon name="bow" size={23} /></span>
            <span>Бантик</span>
          </div>
          <div className="login__intro-copy">
            <span className="login__eyebrow">ПРОЕКТНЫЙ ОФИС</span>
            <h1>Работа над проектами — в одном месте.</h1>
            <p>Задачи, команда и сроки запуска собраны в едином рабочем пространстве.</p>
          </div>
          <div className="login__intro-decoration" aria-hidden="true">
            <span /><span /><span />
          </div>
        </aside>
        <section className="login__panel">
          <div className="login__header">
            <span className="login__eyebrow">С ВОЗВРАЩЕНИЕМ</span>
            <h2 className="login__title">Войти в систему</h2>
            <p className="login__subtitle">Используйте имя пользователя и пароль.</p>
          </div>
          <form className="login__form" onSubmit={handleSubmit}>
            <div className="login__field">
              <label className="login__label" htmlFor="login-username">Имя пользователя</label>
              <input
                id="login-username"
                className="login__input"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите имя пользователя"
                required
              />
            </div>
            <div className="login__field">
              <label className="login__label" htmlFor="login-password">Пароль</label>
              <input
                id="login-password"
                className="login__input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
              />
            </div>
            {error && <p className="login__error" role="alert">{error}</p>}
            <button className="login__button" type="submit" disabled={submitting}>
              {submitting ? 'Входим…' : 'Войти'}
              {!submitting && <Icon name="arrow" size={18} />}
            </button>
          </form>
          <p className="login__footer">Доступ предоставляется администратором системы.</p>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;