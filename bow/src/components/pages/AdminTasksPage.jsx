import { useCallback, useEffect, useState } from 'react';
import { apiFetch, jsonBody } from '../../api';
import TableFullscreen from '../common/TableFullscreen';
import '../../styles/ProjectsPage.css';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const rows = await apiFetch('/admin/tasks');
      setError('');
      setTasks(rows);
    } catch (reason) {
      setError(`Не удалось загрузить задачи: ${reason.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load and subscribe to the task assignment list.
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
      setError(`Не удалось обновить задачу: ${reason.message}`);
    }
  };

  return (
    <div className="projects">
      <header className="projects__header">
        <div><h1 className="projects__title">Задачи кураторов</h1><p>Администратор может контролировать готовность отдельных назначений.</p></div>
      </header>
      {error && <div className="projects__error" role="alert">{error}</div>}
      {loading ? <p>Загрузка задач…</p> : (
        <TableFullscreen label="таблицу задач кураторов">
          <div className="projects__tableWrap">
            <table className="projects__table">
              <thead><tr><th>Проект</th><th>Куратор</th><th>Замещающий</th><th>Статус задачи</th><th>Действие</th></tr></thead>
              <tbody>
                {tasks.map(task => <tr key={task.id}>
                  <td>{task.project.name}</td>
                  <td>{task.username}</td>
                  <td>{task.substituteUsername || '—'}</td>
                  <td>{task.completed ? 'Готово' : 'В работе'}</td>
                  <td>
                    <button
                      className={`admin-task__action${task.completed ? ' admin-task__action--reopen' : ' admin-task__action--complete'}`}
                      onClick={() => setCompleted(task, !task.completed)}
                    >
                      {task.completed ? 'Вернуть в работу' : 'Отметить готовой'}
                    </button>
                  </td>
                </tr>)}
                {tasks.length === 0 && <tr><td colSpan="5" className="projects__empty">Задач пока нет.</td></tr>}
              </tbody>
            </table>
          </div>
        </TableFullscreen>
      )}
    </div>
  );
}
