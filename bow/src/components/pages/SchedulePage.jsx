import { useCallback, useEffect, useState } from 'react';
import { apiFetch, jsonBody } from '../../api';
import TableFullscreen from '../common/TableFullscreen';
import '../../styles/ProjectsPage.css';

const columns = [
  'Проект', 'Описание', 'Отправляем?', 'Категория', 'Дата запуска', 'Дата утверждена?', 'География',
  'Название статьи в KMS', 'Информирование Розница Т2', 'Информирование Партнёры',
  'Информирование Розница ФД', 'Информирование ЛД', 'Информирование ДС',
  'Информирование Внутренние', 'Ежемесячный дайджест'
];
const communicationColumns = columns.slice(7);

export default function SchedulePage() {
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const reload = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (showDone) params.set('includeDone', 'true');
      const data = await apiFetch(`/projects/schedule?${params}`);
      setError('');
      setRows(data);
      setDrafts(Object.fromEntries(data.map(row => [row.id, { ...row.graphOverrides }])));
    } catch (reason) {
      setError(`Не удалось загрузить график: ${reason.message}`);
    } finally {
      setLoading(false);
    }
  }, [from, to, showDone]);

  useEffect(() => {
    // Load the schedule whenever the selected date range changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const updateDraft = (row, key, value) => {
    setDrafts(current => ({
      ...current,
      [row.id]: { ...(current[row.id] || {}), [key]: value }
    }));
  };

  const save = async row => {
    try {
      await apiFetch(`/projects/${row.id}/schedule`, {
        method: 'PATCH',
        body: jsonBody({ graphOverrides: drafts[row.id] || {}, graphDone: Boolean(row.graphDone) }),
      });
      setNotice(`Изменения для «${row['Проект']}» сохранены.`);
      await reload();
    } catch (reason) {
      setError(`Не удалось сохранить строку графика: ${reason.message}`);
    }
  };

  const setDone = async (row, graphDone) => {
    try {
      await apiFetch(`/projects/${row.id}/schedule`, {
        method: 'PATCH',
        body: jsonBody({ graphOverrides: drafts[row.id] || {}, graphDone }),
      });
      await reload();
    } catch (reason) {
      setError(`Не удалось изменить признак «Готово»: ${reason.message}`);
    }
  };

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (showDone) params.set('includeDone', 'true');
      const response = await apiFetch(`/projects/schedule/export?${params}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'project-schedule.xlsx';
      link.click();
      URL.revokeObjectURL(url);
      setNotice('График выгружен в формате Excel.');
    } catch (reason) {
      setError(`Не удалось выгрузить график: ${reason.message}`);
    }
  };

  const copyTable = async () => {
    const text = [
      columns.join('\t'),
      ...rows.map(row => columns.map(key => drafts[row.id]?.[key] ?? row[key] ?? '').join('\t'))
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Таблица скопирована. Её можно вставить в письмо.');
    } catch (reason) {
      setError(`Не удалось скопировать таблицу: ${reason.message}`);
    }
  };

  return (
    <div className="projects">
      <header className="projects__header">
        <div><h1 className="projects__title">График проектов</h1><p>Автоматически сформированные данные карточек. Редактируйте график перед выгрузкой.</p></div>
        <div className="projects__controls schedule__controls">
          <label>С запуска <input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
          <label>По <input type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
          <label><input type="checkbox" checked={showDone} onChange={event => setShowDone(event.target.checked)} /> Показать готовые</label>
          <button className="schedule__action" onClick={exportExcel}>Выгрузить Excel</button>
          <button className="schedule__action schedule__action--secondary" onClick={copyTable}>Копировать для письма</button>
        </div>
      </header>
      {error && <div className="projects__error" role="alert">{error}</div>}
      {notice && <p className="schedule__notice" role="status">{notice}</p>}
      {loading ? <p>Загрузка графика…</p> : (
        <TableFullscreen
          label="таблицу графика проектов"
          fullscreenContent={
            <div className="schedule-fullscreen">
              <header className="schedule-fullscreen__header">
                <div>
                  <span className="schedule-fullscreen__eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</span>
                  <h2>График проектов</h2>
                  <p>{rows.length} {rows.length === 1 ? 'проект' : 'проекта'} · Изменения можно сохранить отдельно для каждого проекта</p>
                </div>
                <div className="schedule-fullscreen__actions">
                  <button className="schedule__action schedule__action--secondary" onClick={copyTable}>Копировать для письма</button>
                  <button className="schedule__action" onClick={exportExcel}>Выгрузить Excel</button>
                </div>
              </header>
              <div className="schedule-fullscreen__filters">
                <label>С запуска <input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
                <label>По <input type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
                <label className="schedule-fullscreen__done-filter">
                  <input type="checkbox" checked={showDone} onChange={event => setShowDone(event.target.checked)} />
                  Показать готовые
                </label>
              </div>
              {rows.length === 0 ? (
                <p className="projects__empty">За выбранный период проектов нет.</p>
              ) : (
                <div className="schedule-fullscreen__list">
                  {rows.map(row => (
                    <article className="schedule-card" key={row.id}>
                      <header className="schedule-card__header">
                        <div>
                          <span className="schedule-card__eyebrow">ПРОЕКТ</span>
                          <h3>{drafts[row.id]?.['Проект'] ?? row['Проект'] ?? 'Без названия'}</h3>
                        </div>
                        <div className="schedule-card__actions">
                          <label className="schedule-card__done">
                            <input type="checkbox" checked={Boolean(row.graphDone)}
                              onChange={event => setDone(row, event.target.checked)} />
                            Готово
                          </label>
                          <button className="schedule__action" onClick={() => save(row)}>Сохранить</button>
                        </div>
                      </header>
                      <div className="schedule-card__fields">
                        {columns.map(column => {
                          const value = drafts[row.id]?.[column] ?? row[column] ?? '';
                          const wide = column === 'Описание' || communicationColumns.includes(column);
                          return (
                            <label className={`schedule-card__field${wide ? ' schedule-card__field--wide' : ''}`} key={column}>
                              <span>{column}</span>
                              {column === 'Описание' ? (
                                <textarea rows={5} value={value}
                                  onChange={event => updateDraft(row, column, event.target.value)} />
                              ) : (
                                <input value={value}
                                  onChange={event => updateDraft(row, column, event.target.value)} />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          }
        >
          <div className="projects__tableWrap">
            <p className="schedule__scroll-hint">Прокрутите таблицу по горизонтали, чтобы увидеть все поля</p>
            <table className="schedule__table">
              <thead><tr>{columns.map(column => <th key={column}>{column}</th>)}<th>Готово</th><th>Действие</th></tr></thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    {columns.map(column => (
                      <td key={column}>
                        {column === 'Описание' ? (
                          <textarea value={drafts[row.id]?.[column] ?? row[column] ?? ''} onChange={event => updateDraft(row, column, event.target.value)} />
                        ) : (
                          <input value={drafts[row.id]?.[column] ?? row[column] ?? ''} onChange={event => updateDraft(row, column, event.target.value)} />
                        )}
                      </td>
                    ))}
                    <td><input aria-label={`Готово: ${row['Проект']}`} type="checkbox" checked={Boolean(row.graphDone)} onChange={event => setDone(row, event.target.checked)} /></td>
                    <td><button onClick={() => save(row)}>Сохранить</button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={columns.length + 2} className="projects__empty">
                  За выбранный период проектов нет. В график попадают проекты, для которых в карточке выбран режим «Передать для истории» или «Передать для информирования».
                </td></tr>}
              </tbody>
            </table>
          </div>
        </TableFullscreen>
      )}
    </div>
  );
}
