import { useEffect, useState } from 'react';
import { apiFetch, jsonBody } from '../../api';
import TableFullscreen from '../common/TableFullscreen';
import '../../styles/UsersAdmin.css';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'Guest' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [userRows, roleRows] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/roles'),
      ]);
      setUsers(userRows);
      setRoles(roleRows);
      setError('');
    } catch (reason) {
      setError(`Не удалось загрузить пользователей: ${reason.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load the user and role lists when the page is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/users', { method: 'POST', body: jsonBody(form) });
      setForm({ username: '', password: '', role: 'Guest' });
      await load();
    } catch (reason) {
      setError(`Не удалось создать пользователя: ${reason.message}`);
    }
  };

  const startEdit = (u) => setEditing({ ...u, password: '' });
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const id = editing.id;
      const body = { username: editing.username };
      if (editing.password) body.password = editing.password;
      if (editing.role) body.role = editing.role;
      await apiFetch(`/admin/users/${id}`, { method: 'PUT', body: jsonBody(body) });
      setEditing(null);
      await load();
    } catch (reason) {
      setError(`Не удалось сохранить пользователя: ${reason.message}`);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      await load();
    } catch (reason) {
      setError(`Не удалось удалить пользователя: ${reason.message}`);
    }
  };

  return (
    <div className="users-admin">
      <div className="users-admin__top">
        <div>
          <h1>Управление пользователями</h1>
          <p className="users-admin__subtitle">Boss может создавать, редактировать и удалять аккаунты.</p>
        </div>
      </div>

      {error && <div className="projects__error" role="alert">{error}</div>}
      <form className="users-admin__form" onSubmit={createUser}>
        <input className="users-admin__input" placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required />
        <input className="users-admin__input" placeholder="Пароль (не менее 12 символов)" type="password" minLength={12} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
        <select className="users-admin__input" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
          {roles.map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="users-admin__button users-admin__button--primary" type="submit">Создать</button>
      </form>

      {loading ? <p>Загрузка пользователей…</p> : (
        <TableFullscreen label="таблицу пользователей">
          <div className="users-admin__table-wrap">
            <table className="users-admin__table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u=> (
                  <tr key={u.id}>
                    <td>
                      {editing && editing.id===u.id ? (
                        <input className="users-admin__input" value={editing.username} onChange={e=>setEditing({...editing,username:e.target.value})} />
                      ) : u.username}
                    </td>
                    <td>
                      {editing && editing.id===u.id ? (
                        <select className="users-admin__input" value={editing.role} onChange={e=>setEditing({...editing,role:e.target.value})}>{roles.map(r=> <option key={r} value={r}>{r}</option>)}</select>
                      ) : u.role}
                    </td>
                    <td className="users-admin__actions">
                      {editing && editing.id===u.id ? (
                        <>
                          <input className="users-admin__input users-admin__input--small" placeholder="Новый пароль (от 12 символов)" type="password" minLength={12} value={editing.password} onChange={e=>setEditing({...editing,password:e.target.value})} />
                          <button className="users-admin__button users-admin__button--success" type="button" onClick={saveEdit}>Сохранить</button>
                          <button className="users-admin__button" type="button" onClick={cancelEdit}>Отмена</button>
                        </>
                      ) : (
                        <>
                          <button className="users-admin__button" type="button" onClick={()=>startEdit(u)}>Редактировать</button>
                          <button className="users-admin__button users-admin__button--danger" type="button" onClick={()=>deleteUser(u.id)}>Удалить</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="3" className="projects__empty">Пользователи не найдены.</td></tr>}
              </tbody>
            </table>
          </div>
        </TableFullscreen>
      )}
    </div>
  );
}
