import { useCallback, useEffect, useState } from 'react';
import ProjectModal from './ProjectModal';
import TableFullscreen from '../common/TableFullscreen';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, jsonBody } from '../../api';
import '../../styles/ProjectsPage.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'Boss';

  const reload = useCallback(async () => {
    try {
      const [projectRows, categoryRows, userRows, fieldRows, regionRows] = await Promise.all([
        apiFetch('/projects'),
        apiFetch('/admin/categories'),
        apiFetch(isAdmin ? '/admin/users' : '/users/curators'),
        apiFetch('/admin/fields'),
        apiFetch('/admin/regions'),
      ]);
      setError('');
      setProjects(projectRows);
      setCategories(categoryRows);
      setUsers(userRows);
      setCustomFields(fieldRows);
      setRegionOptions(regionRows);
    } catch (reason) {
      setError(`Не удалось загрузить данные распределения: ${reason.message}`);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    // Load and subscribe to the shared project data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    window.addEventListener('projects-updated', reload);
    return () => window.removeEventListener('projects-updated', reload);
  }, [reload]);

  const save = async payload => {
    try {
      const path = activeProject ? `/projects/${activeProject.id}` : '/projects';
      await apiFetch(path, {
        method: activeProject ? 'PATCH' : 'POST',
        body: jsonBody(payload),
      });
      setModalOpen(false);
      setActiveProject(null);
      await reload();
      window.dispatchEvent(new Event('projects-updated'));
      return true;
    } catch (reason) {
      setError(`Не удалось сохранить проект: ${reason.message}`);
      return false;
    }
  };

  const approveProject = async (event, project) => {
    event.stopPropagation();
    try {
      await apiFetch(`/projects/${project.id}/status`, {
        method: 'PATCH',
        body: jsonBody({ status: 'Выполнено' }),
      });
      await reload();
      window.dispatchEvent(new Event('projects-updated'));
    } catch (reason) {
      setError(`Не удалось подтвердить выполнение проекта: ${reason.message}`);
    }
  };

  const currentUser = user?.username || '';
  const visibleProjects = projects.filter(project => {
    if (filter === 'mine') return project.owner === currentUser || project.curators?.includes(currentUser);
    if (filter === 'team') return project.teamProject;
    return true;
  });

  return (
    <div className="projects">
      <header className="projects__header">
        <div>
          <h1 className="projects__title">Распределение проектов</h1>
          <p>Когда кураторы завершат все задачи, проект перейдёт на согласование руководителя. Администратор подтверждает выполнение отдельно.</p>
        </div>
        <div className="projects__controls">
          <label className="projects__filterLabel">Показать
            <select value={filter} onChange={event => setFilter(event.target.value)}>
              <option value="all">Все проекты</option>
              <option value="mine">Мои проекты</option>
              <option value="team">Проекты команды</option>
            </select>
          </label>
          {isAdmin && <button className="projects__createButton" onClick={() => { setActiveProject(null); setModalOpen(true); }}>＋ Создать проект</button>}
        </div>
      </header>

      {error && <div className="projects__error" role="alert">{error}</div>}
      {loading && <p>Загрузка проектов…</p>}
      {!loading && !error && (
        <TableFullscreen label="таблицу проектов">
          <div className="projects__tableWrap">
            <table className="projects__table">
              <thead>
                <tr><th>Проект</th><th>Категория</th><th>Заказчик</th><th>ОРП</th><th>Кураторы</th><th>Статус проекта</th><th>Статус куратора</th><th>Сложность</th></tr>
              </thead>
              <tbody>
                {visibleProjects.map(project => (
                  <tr key={project.id} onClick={() => { setActiveProject(project); setModalOpen(true); }}>
                    <td><strong>{project.name}</strong>{project.codeName && <small>{project.codeName}</small>}</td>
                    <td>{project.category || '—'}</td>
                    <td>{project.customer || '—'}</td>
                    <td>{project.orp || '—'}</td>
                    <td>{project.curators?.join(', ') || project.owner || '—'}</td>
                    <td>
                      <span className={`projects__pill${project.status === 'Согласование руководителя' ? ' projects__pill--approval' : ''}`}>
                        {project.status || 'Новый'}
                      </span>
                      {isAdmin && project.status === 'Согласование руководителя' && (
                        <button className="projects__approveButton" type="button" onClick={event => approveProject(event, project)}>
                          Подтвердить
                        </button>
                      )}
                    </td>
                    <td>{project.curatorStatus || '—'}</td>
                    <td>{project.status === 'Новый' ? 'Не определено' : Number(project.complexity || 0).toFixed(1)}</td>
                  </tr>
                ))}
                {visibleProjects.length === 0 && <tr><td colSpan="8" className="projects__empty">Проекты не найдены.</td></tr>}
              </tbody>
            </table>
          </div>
        </TableFullscreen>
      )}
      {modalOpen && (
        <ProjectModal
          project={activeProject}
          users={users}
          categories={categories}
          regionOptions={regionOptions}
          customFields={customFields}
          defaultOwner={currentUser}
          mode={isAdmin ? 'admin' : 'curator'}
          onClose={() => { setModalOpen(false); setActiveProject(null); }}
          onCreate={save}
          onSave={save}
        />
      )}
    </div>
  );
}
