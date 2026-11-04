import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import TableFullscreen from '../common/TableFullscreen';
import '../../styles/ProjectsPage.css';

export default function WorkloadPage() {
  const [period, setPeriod] = useState('day');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch(`/admin/workload?period=${period}`)
      .then(data => {
        if (active) {
          setRows(data);
          setError('');
        }
      })
      .catch(reason => { if (active) setError(`Не удалось загрузить нагрузку: ${reason.message}`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  return (
    <div className="projects">
      <header className="projects__header">
        <div><h1 className="projects__title">Нагрузка сотрудников</h1><p>Активные задачи и расчётная сложность по назначенным проектам.</p></div>
        <label className="workload__period">Период
          <select value={period} onChange={event => setPeriod(event.target.value)}>
            <option value="day">Сегодня</option><option value="month">Текущий месяц</option><option value="year">Текущий год</option>
          </select>
        </label>
      </header>
      {error && <div className="projects__error" role="alert">{error}</div>}
      {loading ? <p>Загрузка отчёта…</p> : (
        <TableFullscreen label="таблицу нагрузки">
          <div className="projects__tableWrap">
            <table className="projects__table">
              <thead><tr><th>Сотрудник</th><th>Активные задачи</th><th>Завершено за период</th><th>Задач в отчёте</th><th>Сложность</th></tr></thead>
              <tbody>
                {rows.map(row => <tr key={row.username}>
                  <td>{row.username}</td><td>{row.activeTasks}</td><td>{row.completedInPeriod}</td>
                  <td>{row.totalTasks}</td><td>{Number(row.complexity || 0).toFixed(1)}</td>
                </tr>)}
                {rows.length === 0 && <tr><td colSpan="5" className="projects__empty">Нет данных для выбранного периода.</td></tr>}
              </tbody>
            </table>
          </div>
        </TableFullscreen>
      )}
    </div>
  );
}
