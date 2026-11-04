import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, jsonBody } from '../../api';
import { useAuth } from './AuthContext';
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
        <div className="login__header">
          <span className="login__icon">🎀</span>
          <h1 className="login__title">Бантик</h1>
          <p className="login__subtitle">Твой милый таск-трекер</p>
        </div>
        <form className="login__form" onSubmit={handleSubmit}>
          <div className="login__field">
            <label className="login__label">Email или имя</label>
            <input
              className="login__input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="например, kitty@t2.ru"
              required
            />
          </div>
          <div className="login__field">
            <label className="login__label">Пароль</label>
            <input
              className="login__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="введи секрет"
              required
            />
          </div>
          {error && <p className="login__error" role="alert">{error}</p>}
          <button className="login__button" type="submit" disabled={submitting}>
            {submitting ? 'Входим…' : 'Войти 🌸'}
          </button>
        </form>
        <div className="login__footer">
          <span>✨ войди и начни управлять задачами с улыбкой</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;