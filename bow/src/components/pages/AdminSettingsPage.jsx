import { useEffect, useMemo, useState } from 'react';
import { apiFetch, jsonBody } from '../../api';
import { projectComplexityFieldKeys } from './projectComplexityFields';
import { detailFields } from './ProjectModal';
import '../../styles/ProjectsPage.css';

const slugify = value => value.toLocaleLowerCase('ru-RU')
  .replace(/[^a-zа-яё0-9]+/gi, '_').replace(/^_+|_+$/g, '');

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState([]);
  const [categoryText, setCategoryText] = useState('');
  const [regions, setRegions] = useState([]);
  const [regionText, setRegionText] = useState('');
  const [fields, setFields] = useState([]);
  const [weights, setWeights] = useState({});
  const [newField, setNewField] = useState({ label: '', type: 'text', options: '' });
  const [weightSearch, setWeightSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const weightKeys = useMemo(() => [
    ...projectComplexityFieldKeys,
    ...fields.map(field => `custom.${field.fieldKey}`),
  ], [fields]);

  const complexityGroups = useMemo(() => {
    const metadata = new Map();
    detailFields.forEach(field => {
      metadata.set(field.key, { label: field.label, section: field.section });
      if (field.extra) metadata.set(field.extra.key, { label: field.extra.label, section: field.section });
      if (field.extraFlag) metadata.set(field.extraFlag.key, { label: field.extraFlag.label, section: field.section });
    });
    const groups = new Map();
    const add = (section, item) => {
      if (!groups.has(section)) groups.set(section, []);
      groups.get(section).push(item);
    };
    projectComplexityFieldKeys.forEach(key => {
      const field = metadata.get(key);
      const label = field?.label || key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/(\D)(\d)/g, '$1 $2')
        .replace(/^./, char => char.toLocaleUpperCase('ru-RU'));
      add(field?.section || 'Прочие поля карточки', { key, label });
    });
    fields.forEach(field => add('Дополнительные поля', {
      key: `custom.${field.fieldKey}`,
      label: field.label,
    }));
    return [...groups].map(([section, items]) => ({ section, items }));
  }, [fields]);

  const visibleComplexityGroups = useMemo(() => {
    const normalizedSearch = weightSearch.trim().toLocaleLowerCase('ru-RU');
    return complexityGroups.map(group => ({
      ...group,
      items: group.items.filter(field =>
        `${field.label} ${field.key}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)),
    })).filter(group => group.items.length > 0);
  }, [complexityGroups, weightSearch]);

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/categories'),
      apiFetch('/admin/regions'),
      apiFetch('/admin/fields'),
      apiFetch('/admin/complexity'),
    ]).then(([categoryRows, regionRows, fieldRows, weightRows]) => {
      setCategories(categoryRows);
      setCategoryText(categoryRows.join('\n'));
      setRegions(regionRows);
      setRegionText(regionRows.join('\n'));
      setFields(fieldRows);
      setWeights(weightRows);
    }).catch(reason => setError(`Не удалось загрузить настройки: ${reason.message}`))
      .finally(() => setLoading(false));
  }, []);

  const saveRegions = async () => {
    try {
      const saved = await apiFetch('/admin/regions', {
        method: 'PUT',
        body: jsonBody({ regions: regionText.split(/\r?\n/).map(value => value.trim()).filter(Boolean) }),
      });
      setRegions(saved);
      setRegionText(saved.join('\n'));
      setNotice('Справочник регионов сохранён.');
    } catch (reason) {
      setError(`Не удалось сохранить регионы: ${reason.message}`);
    }
  };

  const saveCategories = async () => {
    try {
      const saved = await apiFetch('/admin/categories', {
        method: 'PUT',
        body: jsonBody({ categories: categoryText.split(/\r?\n/).map(value => value.trim()).filter(Boolean) }),
      });
      setCategories(saved);
      setCategoryText(saved.join('\n'));
      setNotice('Справочник категорий сохранён.');
    } catch (reason) {
      setError(`Не удалось сохранить категории: ${reason.message}`);
    }
  };

  const addField = () => {
    const label = newField.label.trim();
    const fieldKey = slugify(label);
    if (!label || !fieldKey) {
      setError('Введите название дополнительного поля.');
      return;
    }
    if (fields.some(field => field.fieldKey === fieldKey)) {
      setError('Поле с таким ключом уже существует.');
      return;
    }
    setFields(current => [...current, {
      fieldKey,
      label,
      type: newField.type,
      options: newField.type === 'select'
        ? newField.options.split(',').map(value => value.trim()).filter(Boolean)
        : [],
    }]);
    setNewField({ label: '', type: 'text', options: '' });
    setError('');
  };

  const saveFields = async () => {
    try {
      const saved = await apiFetch('/admin/fields', { method: 'PUT', body: jsonBody(fields) });
      setFields(saved);
      setNotice('Дополнительные поля сохранены.');
    } catch (reason) {
      setError(`Не удалось сохранить поля: ${reason.message}`);
    }
  };

  const deleteField = async fieldKey => {
    if (!window.confirm('Удалить поле из карточки? Уже сохранённые значения в проектах останутся в данных.')) return;
    const updatedFields = fields.filter(field => field.fieldKey !== fieldKey);
    try {
      const saved = await apiFetch('/admin/fields', { method: 'PUT', body: jsonBody(updatedFields) });
      setFields(saved);
      setNotice('Поле удалено из карточки.');
    } catch (reason) {
      setError(`Не удалось удалить поле: ${reason.message}`);
    }
  };

  const saveWeights = async () => {
    const invalid = weightKeys.find(key => !Number.isFinite(Number(weights[key] ?? 1)) || Number(weights[key] ?? 1) < 0);
    if (invalid) {
      const label = complexityGroups.flatMap(group => group.items).find(field => field.key === invalid)?.label || invalid;
      setError(`Для поля «${label}» требуется неотрицательное число.`);
      return;
    }
    try {
      const saved = await apiFetch('/admin/complexity', {
        method: 'PUT',
        body: jsonBody(Object.fromEntries(weightKeys.map(key => [key, Number(weights[key] ?? 1)]))),
      });
      setWeights(saved);
      setNotice('Значения сложности сохранены.');
    } catch (reason) {
      setError(`Не удалось сохранить сложность: ${reason.message}`);
    }
  };

  return (
    <div className="projects admin-settings">
      <header className="projects__header">
        <div><h1 className="projects__title">Администрирование</h1><p>Настройка справочников, полей карточки и весов сложности.</p></div>
      </header>
      {error && <div className="projects__error" role="alert">{error}</div>}
      {notice && <p className="schedule__notice" role="status">{notice}</p>}
      {loading ? <p>Загрузка настроек…</p> : <>
        <section className="admin-settings__section">
          <h2>Справочник регионов</h2>
          <label>Одно название в строке
            <textarea rows={9} value={regionText} onChange={event => setRegionText(event.target.value)} />
          </label>
          <button onClick={saveRegions}>Сохранить регионы</button>
          <small>Доступно в выборе регионов карточки проекта: {regions.length} регионов.</small>
        </section>

        <section className="admin-settings__section">
          <h2>Категории проектов</h2>
          <label>Одно значение в строке
            <textarea rows={9} value={categoryText} onChange={event => setCategoryText(event.target.value)} />
          </label>
          <button onClick={saveCategories}>Сохранить категории</button>
          <small>Загружено: {categories.length} категорий.</small>
        </section>

        <section className="admin-settings__section">
          <h2>Поля карточки</h2>
          <div className="admin-settings__new-field">
            <label>Название <input value={newField.label} onChange={event => setNewField(current => ({ ...current, label: event.target.value }))} /></label>
            <label>Тип
              <select value={newField.type} onChange={event => setNewField(current => ({ ...current, type: event.target.value }))}>
                <option value="text">Текст</option><option value="date">Дата</option><option value="url">Ссылка</option>
                <option value="number">Число</option><option value="checkbox">Флажок</option><option value="select">Список</option>
              </select>
            </label>
            {newField.type === 'select' && <label>Значения через запятую
              <input value={newField.options} onChange={event => setNewField(current => ({ ...current, options: event.target.value }))} />
            </label>}
            <button type="button" onClick={addField}>Добавить поле</button>
          </div>
          <div className="admin-settings__field-list">
            {fields.map((field, index) => <div className="admin-settings__field-row" key={field.fieldKey}>
              <label>Название
                <input value={field.label} onChange={event => setFields(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} />
              </label>
              <label>Тип
                <select value={field.type} onChange={event => setFields(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value } : item))}>
                  <option value="text">Текст</option><option value="date">Дата</option><option value="url">Ссылка</option>
                  <option value="number">Число</option><option value="checkbox">Флажок</option><option value="select">Список</option>
                </select>
              </label>
              {field.type === 'select' && <label>Значения
                <input value={(field.options || []).join(', ')} onChange={event => setFields(current => current.map((item, itemIndex) => itemIndex === index ? {
                  ...item,
                  options: event.target.value.split(',').map(value => value.trim()).filter(Boolean),
                } : item))} />
              </label>}
              <div className="admin-settings__field-actions">
                <small>Ключ: {field.fieldKey}</small>
                <button className="admin-settings__delete-field" type="button" onClick={() => deleteField(field.fieldKey)}>
                  Удалить поле
                </button>
              </div>
            </div>)}
            {fields.length === 0 && <p>Дополнительные поля пока не созданы.</p>}
          </div>
          <button onClick={saveFields}>Сохранить поля</button>
          <small>Удаление поля скрывает его из формы, ранее сохранённые значения карточек остаются в данных.</small>
        </section>

        <section className="admin-settings__section">
          <h2>Сложность полей карточки</h2>
          <p>Вес показывает вклад заполненного поля в общую сложность проекта. «Нет» и «Не требуется» не учитываются; стандартное значение — 1 балл.</p>
          <label className="admin-settings__weight-search">Найти поле
            <input type="search" value={weightSearch} onChange={event => setWeightSearch(event.target.value)} placeholder="Например, CRM или дата запуска" />
          </label>
          <div className="admin-settings__weights">
            {visibleComplexityGroups.map((group, index) => {
              return (
                <details className="admin-settings__weight-group" key={group.section} open={index === 0 || Boolean(weightSearch.trim())}>
                  <summary><span>{group.section}</span><small>{group.items.length} полей</small></summary>
                  <div className="admin-settings__weight-list">
                    {group.items.map(field => <label className="admin-settings__weight-row" key={field.key}>
                      <span>{field.label}</span>
                      <span className="admin-settings__weight-control">
                        <input aria-label={`Вес сложности: ${field.label}`} type="number" min="0" step="0.5" value={weights[field.key] ?? 1}
                          onChange={event => setWeights(current => ({ ...current, [field.key]: event.target.value }))} />
                        <small>балла</small>
                      </span>
                    </label>)}
                  </div>
                </details>
              );
            })}
            {visibleComplexityGroups.length === 0 && <p className="admin-settings__no-results">По этому запросу поля не найдены.</p>}
          </div>
          <button onClick={saveWeights}>Сохранить веса сложности</button>
        </section>
      </>}
    </div>
  );
}
