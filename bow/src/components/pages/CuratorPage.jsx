import { useCallback, useEffect, useState } from 'react';
import ProjectModal from './ProjectModal';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, jsonBody } from '../../api';
import '../../styles/ProjectsPage.css';

function isNearDate(value) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delta = Math.round((date - today) / 86400000);
  return delta >= -1 && delta <= 1;
}

function dateLabel(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU') : 'Не указана';
}

export default function CuratorPage() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [archive, setArchive] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const username = user?.username || '';

  const reload = useCallback(async () => {
    if (!username) return;
    try {
      const [rows, categoryRows, fieldRows, userRows, regionRows] = await Promise.all([
        apiFetch(`/tasks?username=${encodeURIComponent(username)}&archived=${archive}`),
        apiFetch('/admin/categories'),
        apiFetch('/admin/fields'),
        apiFetch('/users/curators'),
        apiFetch('/admin/regions'),
      ]);
      setError('');
      setTasks(rows);
      setCategories(categoryRows);
      setCustomFields(fieldRows);
      setUsers(userRows);
      setRegionOptions(regionRows);
    } catch (reason) {
      setError(`Не удалось загрузить задачи: ${reason.message}`);
    } finally {
      setLoading(false);
    }
  }, [archive, username]);

  useEffect(() => {
    // Load and subscribe to data owned by the backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    window.addEventListener('projects-updated', reload);
    return () => window.removeEventListener('projects-updated', reload);
  }, [reload]);

  const setCompleted = async (task, completed) => {
    try {
      await apiFetch(`/tasks/${task.id}`, { method: 'PATCH', body: jsonBody({ completed }) });
      await reload();
      window.dispatchEvent(new Event('projects-updated'));
    } catch (reason) {
      setError(`Не удалось изменить готовность задачи: ${reason.message}`);
    }
  };

  const saveProject = async payload => {
    if (!activeTask?.project?.id) return false;
    try {
      await apiFetch(`/projects/${activeTask.project.id}`, { method: 'PATCH', body: jsonBody(payload) });
      await reload();
      window.dispatchEvent(new Event('projects-updated'));
      return true;
    } catch (reason) {
      setError(`Не удалось сохранить карточку: ${reason.message}`);
      return false;
    }
  };

  return (
    <div className="projects">
      <header className="projects__header">
        <div>
          <h1 className="projects__title">Рабочее место куратора</h1>
          <p>Ваши задачи, даты запуска и передачи информации в график.</p>
        </div>
        <div className="projects__controls">
          <button className={`projects__filterToggle ${!archive ? 'is-selected' : ''}`} onClick={() => setArchive(false)}>Активные</button>
          <button className={`projects__filterToggle ${archive ? 'is-selected' : ''}`} onClick={() => setArchive(true)}>Архив</button>
        </div>
      </header>
      {!username && <div className="projects__error" role="alert">Не найдено имя пользователя. Выйдите и войдите в систему заново.</div>}
      {error && <div className="projects__error" role="alert">{error}</div>}
      {loading && <p>Загрузка задач…</p>}
      {!loading && !error && (
        <div className="curator-task-list">
          {tasks.map(task => {
            const project = task.project;
            return (
              <article className="curator-task" key={task.id}>
                <div className="curator-task__main">
                  <button className="curator-task__title" onClick={() => setActiveTask(task)}>{project.name}</button>
                  <p>{project.curatorStatus || 'Статус куратора не указан'}</p>
                  {project.zniLink && <a href={project.zniLink} target="_blank" rel="noreferrer">Открыть ЗНИ</a>}
                </div>
                <div className={`curator-task__date ${isNearDate(project.launchDate) ? 'curator-task__date--urgent' : ''}`}>
                  <small>Запуск</small><strong>{dateLabel(project.launchDate)}</strong>
                </div>
                <div className={`curator-task__date ${isNearDate(project.graphInfoDate) ? 'curator-task__date--urgent' : ''}`}>
                  <small>Передача в график</small><strong>{dateLabel(project.graphInfoDate)}</strong>
                </div>
                <div className="curator-task__actions">
                  <button onClick={() => setActiveTask(task)}>Открыть карточку</button>
                  <button className="curator-task__complete" onClick={() => setCompleted(task, !archive)}>{archive ? 'Вернуть в работу' : 'Готово'}</button>
                </div>
                {!archive && task.username === username && (
                  <TaskTransfer key={`${task.id}:${task.substituteUsername}:${task.transferUntil}`} task={task} users={users} onError={setError} onChanged={reload} />
                )}
              </article>
            );
          })}
          {tasks.length === 0 && <p className="projects__empty">{archive ? 'В архиве пока нет завершённых задач.' : 'Назначенных активных задач нет.'}</p>}
        </div>
      )}
      {activeTask && (
        <ProjectModal
          project={activeTask.project}
          defaultOwner={username}
          categories={categories}
          regionOptions={regionOptions}
          customFields={customFields}
          mode="curator"
          onClose={() => setActiveTask(null)}
          onSave={saveProject}
          onCreate={saveProject}
        />
      )}
    </div>
  );
}

function TaskTransfer({ task, users, onError, onChanged }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(task.substituteUsername || '');
  const [until, setUntil] = useState(task.transferUntil || '');

  const submit = async event => {
    event.preventDefault();
    try {
      await apiFetch(`/tasks/${task.id}/transfer`, {
        method: 'PATCH',
        body: jsonBody({ username, until }),
      });
      setOpen(false);
      onChanged();
    } catch (reason) {
      onError(`Не удалось передать задачу: ${reason.message}`);
    }
  };

  return (
    <div className="curator-task__transfer">
      {task.substituteUsername && <small>Замещает: {task.substituteUsername} до {dateLabel(task.transferUntil)}</small>}
      <button onClick={() => setOpen(value => !value)}>{task.substituteUsername ? 'Изменить передачу' : 'Передать задачу'}</button>
      {open && <form onSubmit={submit}>
        <select required value={username} onChange={event => setUsername(event.target.value)}>
          <option value="">Выберите сотрудника</option>
          {users.filter(user => user.username !== task.username).map(user => <option key={user.id} value={user.username}>{user.username}</option>)}
        </select>
        <input required type="date" min={new Date().toISOString().slice(0, 10)} value={until} onChange={event => setUntil(event.target.value)} />
        <button type="submit">Передать</button>
        {task.substituteUsername && <button type="button" onClick={async () => {
          try {
            await apiFetch(`/tasks/${task.id}/transfer`, { method: 'PATCH', body: jsonBody({ username: '' }) });
            setOpen(false);
            onChanged();
          } catch (reason) {
            onError(`Не удалось отменить передачу: ${reason.message}`);
          }
        }}>Отменить</button>}
      </form>}
    </div>
  );
}
