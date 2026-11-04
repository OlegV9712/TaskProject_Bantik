import { useEffect, useState } from 'react';
import TableFullscreen from '../common/TableFullscreen';
import '../../styles/DimaPage.css';

function DimaPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8081/api/projects', { credentials: 'include' });
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh the page data and subscribe to project changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();

    const interval = setInterval(fetchProjects, 10000);
    const handleUpdated = () => fetchProjects();

    window.addEventListener('projects-updated', handleUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('projects-updated', handleUpdated);
    };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) {
      return '—';
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }

    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const downloadFile = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const buildCommunicationHtml = (projectsForExport) => {
    const safe = (value) => value || '—';

    const rows = projectsForExport
      .map(
        (project) => `
          <tr>
            <td>${safe(project.name)}</td>
            <td>${safe(project.owner)}</td>
            <td>${safe(project.status)}</td>
            <td>${formatDate(project.launchDate)}</td>
            <td>${safe(project.category)}</td>
            <td>${safe(project.geography)}</td>
            <td>${safe(project.volume)}</td>
            <td>${safe(project.sendFlag === 'yes' ? 'Да' : 'Нет')}</td>
            <td>${safe(project.description)}</td>
          </tr>
        `,
      )
      .join('');

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f8f1f8; }
          </style>
        </head>
        <body>
          <h1>Коммуникации проектов</h1>
          <table>
            <thead>
              <tr>
                <th>Проект</th>
                <th>Владелец</th>
                <th>Статус</th>
                <th>Дата запуска</th>
                <th>Категория</th>
                <th>География</th>
                <th>Объем</th>
                <th>Отправляем</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>`;
  };

  const handleExportCommunications = () => {
    const projectsForExport = projects.filter((project) => project.sendFlag === 'yes');

    if (!projectsForExport.length) {
      alert('Сначала отметьте проекты для отправки, затем экспортируйте коммуникации.');
      return;
    }

    const html = buildCommunicationHtml(projectsForExport);
    downloadFile('communications.doc', html, 'application/msword');
    downloadFile('communications.xls', html, 'application/vnd.ms-excel');
  };

  const handleToggleSendFlag = async (project, value) => {
    const payload = { sendFlag: value ? 'yes' : 'no' };

    try {
      const res = await fetch(`http://localhost:8081/api/projects/${project.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setProjects((current) =>
          current.map((item) =>
            item.id === project.id ? { ...item, sendFlag: payload.sendFlag } : item,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="dima-page">
      <div className="dima-page__header">
        <div>
          <h1>Димины забавы</h1>
          <p>Здесь Дима видит все проекты и отмечает, какие из них отправлять.</p>
        </div>
        <button className="dima-page__export-button" type="button" onClick={handleExportCommunications}>
          Выгрузить коммуникации
        </button>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <TableFullscreen label="таблицу проектов для коммуникаций">
          <div className="dima-page__table-wrap">
          <table className="dima-page__table">
            <thead>
              <tr>
                <th>Отправляем</th>
                <th>Проект</th>
                <th>Статус</th>
                <th>Дата запуска</th>
                <th>Владелец</th>
                <th>Категория</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <label className="dima-page__checkbox-label">
                      <input
                        type="checkbox"
                        checked={project.sendFlag === 'yes'}
                        onChange={(event) => handleToggleSendFlag(project, event.target.checked)}
                      />
                    </label>
                  </td>
                  <td>{project.name}</td>
                  <td>{project.status || 'New'}</td>
                  <td>{formatDate(project.launchDate)}</td>
                  <td>{project.owner}</td>
                  <td>{project.category}</td>
                  <td>{project.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </TableFullscreen>
      )}
    </div>
  );
}

export default DimaPage;
