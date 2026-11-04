import { useState } from 'react';
import '../../styles/ProjectModal.css';

const transferModes = ['Не передавать', 'Передать для истории', 'Передать для информирования'];
const workStatuses = ['Не требуется', 'В работе', 'Готово'];
const communicationModes = ['Еженедельный дайджест', 'Отдельная коммуникация', 'Сообщение в ВС/ВД', 'Нет'];

const descriptionLine = (label, value) => value?.trim() ? `${label}: ${value.trim()}` : '';
const buildDescriptionPreview = form => [
  descriptionLine('КОГДА', form.launchDate),
  descriptionLine('ГЕОГРАФИЯ', (form.geographyRegions || []).join(', ')),
  descriptionLine('ОПИСАНИЕ', form.description),
  descriptionLine('БЫЛО', form.descriptionBefore),
  descriptionLine('СТАЛО', form.descriptionAfter),
  descriptionLine('КАК БУДЕТ ПРОХОДИТЬ ПИЛОТ', form.pilotPlan),
].filter(Boolean).join('\n');

// Shared by the settings page to show readable labels for complexity weights.
// eslint-disable-next-line react-refresh/only-export-components
export const detailFields = [
  { section: 'Подготовка к запуску', key: 'folderStatus', label: 'Папка на ресурсе и перенос материалов', extra: { key: 'folderLink', label: 'Ссылка на папку' } },
  { section: 'Подготовка к запуску', key: 'presentationStatus', label: 'Презентация для РГ Сервиса' },
  { section: 'Подготовка к запуску', key: 'rgCallStatus', label: 'Звонок с РГ Сервиса', options: [...workStatuses, 'Назначен'] },
  { section: 'Подготовка к запуску', key: 'rgCommunicationStatus', label: 'Коммуникация на РГ Сервиса' },
  { section: 'Системы Сервиса', key: 'crmStatus', label: 'CRM', extra: { key: 'crmLinks', label: 'Ссылки CRM' } },
  { section: 'Системы Сервиса', key: 'crmUcStatus', label: 'Создание UC для CRM', when: 'crmStatus' },
  { section: 'Системы Сервиса', key: 'wsStatus', label: 'WS', extra: { key: 'wsLinks', label: 'Ссылки WS' } },
  { section: 'Системы Сервиса', key: 'wsUcStatus', label: 'Создание UC для WS', when: 'wsStatus' },
  { section: 'Системы Сервиса', key: 'gaChatStatus', label: 'ГА / клиентский бот', extra: { key: 'gaChatLinks', label: 'Ссылки' } },
  { section: 'Системы Сервиса', key: 'ivaBotStatus', label: 'Бот для ДС IVA', extra: { key: 'ivaBotLinks', label: 'Ссылки' } },
  { section: 'Информирование абонентов', key: 'subscriberInfoPlanned', label: 'Планируется информирование АБ', options: ['Нет', 'Да'] },
  { section: 'Информирование абонентов', key: 'subscriberInfoVolume', label: 'Объём', type: 'text', when: 'subscriberInfoPlanned' },
  { section: 'Информирование абонентов', key: 'subscriberInfoDate', label: 'Дата', type: 'date', when: 'subscriberInfoPlanned' },
  { section: 'Информирование абонентов', key: 'subscriberInfoChannel', label: 'Канал', type: 'text', when: 'subscriberInfoPlanned' },
  { section: 'KMS', key: 'kmsArticleStatus', label: 'Корректировка / создание статьи', extra: { key: 'kmsArticleTitle', label: 'Название статьи' } },
  { section: 'KMS', key: 'kmsFaqStatus', label: 'Создание FAQ' },
  { section: 'KMS', key: 'kmsDsScenarioStatus', label: 'Сценарии ДС', extra: { key: 'kmsDsScenarioName', label: 'Название алгоритма' }, extraFlag: { key: 'kmsDsCuratorInvolved', label: 'Непосредственное участие куратора' } },
  { section: 'KMS', key: 'kmsRetailScenarioStatus', label: 'Сценарии розница', extra: { key: 'kmsRetailScenarioName', label: 'Название алгоритма' }, extraFlag: { key: 'kmsRetailCuratorInvolved', label: 'Непосредственное участие куратора' } },
  { section: 'KMS', key: 'kmsOutsourceScenarioStatus', label: 'Сценарии аутсорс', extra: { key: 'kmsOutsourceScenarioName', label: 'Название алгоритма' }, extraFlag: { key: 'kmsOutsourceCuratorInvolved', label: 'Непосредственное участие куратора' } },
  { section: 'KMS', key: 'kmsHowToOfferStatus', label: 'Блок «Как предложить»' },
  { section: 'Эскалация', key: 'escalationStatus', label: 'Получение и согласование эскалации с проектной РГ' },
  { section: 'Эскалация', key: 'kopStatus', label: 'Создание КОП' },
  { section: 'Эскалация', key: 'backupProceduresStatus', label: 'Процедуры бэка' },
  { section: 'Эскалация', key: 'massSetupStatus', label: 'Заведение массовой рассылки' },
  { section: 'SMS', key: 'smsTemplatesStatus', label: 'Актуализация SMS-шаблонов', extra: { key: 'smsTemplatesLink', label: 'Ссылка' } },
  { section: 'Обучение', key: 'trainingDs', label: 'ДС', options: ['Требуется', 'Не требуется'] },
  { section: 'Обучение', key: 'trainingOutsource', label: 'Аутсорс', options: ['Требуется', 'Не требуется'] },
  { section: 'Обучение', key: 'trainingRetail', label: 'Розница', options: ['Требуется', 'Не требуется'] },
  { section: 'Коммуникации', key: 'communicationsRemoteService', label: 'Дистанционный сервис', type: 'dateOrNotRequired' },
  { section: 'Коммуникации', key: 'communicationsRetailStatus', label: 'Розница', options: workStatuses },
  ...['МБ и собственная розница', 'ТЕМ/СЕМ', 'LD', 'FD'].flatMap((label, index) => {
    const key = `communicationsRetailChannel${index}`;
    return [
      { section: 'Коммуникации', key, label: `Розница — ${label}`, options: communicationModes, when: 'communicationsRetailStatus' },
      { section: 'Коммуникации', key: `${key}Date`, label: `Дата — ${label}`, type: 'date', when: key, notWhenValue: 'Нет' }
    ];
  }),
  { section: 'Коммуникации', key: 'communicationsPartners', label: 'Партнёры', options: ['Еженедельный дайджест партнёров', 'Отдельная коммуникация', 'Портал дилера', 'Нет'], extra: { key: 'communicationsPartnersDate', label: 'Дата' }, extraUnless: 'Нет' },
  { section: 'Коммуникации', key: 'communicationsInternal', label: 'Внутренние сотрудники', options: ['График проектов', 'Отдельная коммуникация', 'Нет'], extra: { key: 'communicationsInternalDate', label: 'Дата' }, extraUnless: 'Нет' },
  { section: 'Коммуникации', key: 'communicationsMonthlyDigest', label: 'Ежемесячный дайджест', options: ['Нет', 'Да'], extra: { key: 'communicationsMonthlyDigestDate', label: 'Дата' }, extraWhen: 'Да' },
  { section: 'Сайт', key: 'websitePipStatus', label: 'Корректировка ПиП', extra: { key: 'websitePipDetails', label: 'Детали' } },
  { section: 'Сайт', key: 'websiteScreensStatus', label: 'Согласование экранов пользователя' },
  { section: 'Сайт', key: 'websiteNewsStatus', label: 'Согласование новости на сайте' },
  ...['Перешаблонирование SIM', 'POSM', 'Новые шаблоны', 'Интернет-магазин', 'Видеомониторинг по проекту'].map((label, index) => ({
    section: 'Продажи', key: `salesStatus${index}`, label
  })),
  { section: 'Аналитика', key: 'analyticsStatus', label: 'Аналитика по запросу проектной РГ' },
];

function initialForm(project, defaultOwner) {
  const defaults = {
    name: project?.name || '',
    owner: project?.owner || defaultOwner || '',
    codeName: project?.codeName || '',
    customer: project?.customer || '',
    orp: project?.orp || '',
    category: project?.category || '',
    curators: project?.curators || [],
    status: project?.status || 'Новый',
    zniLink: project?.zniLink || '',
    description: project?.description || '',
    descriptionBefore: project?.descriptionBefore || '',
    descriptionAfter: project?.descriptionAfter || '',
    pilotPlan: project?.pilotPlan || '',
    graphName: project?.graphName || '',
    launchDate: project?.launchDate || '',
    approved: project?.approved || 'no',
    secrecy: project?.secrecy === true || project?.secrecy === 'Секретно',
    graphInfoDate: project?.graphInfoDate || '',
    graphTransferMode: project?.graphTransferMode || transferModes[0],
    geographyRegions: project?.geographyRegions?.length
      ? project.geographyRegions
      : (project?.geography || '').split(',').map(region => region.trim()).filter(Boolean),
    details: project?.details || {},
  };
  if (!project) return defaults;
  return {
    ...defaults,
    ...project,
    secrecy: project.secrecy === true || project.secrecy === 'Секретно',
    curators: project.curators || [],
    geographyRegions: project.geographyRegions?.length
      ? project.geographyRegions
      : (project.geography || '').split(',').map(region => region.trim()).filter(Boolean),
    details: project.details || {},
    graphTransferMode: project.graphTransferMode || transferModes[0],
  };
}

export default function ProjectModal({ onClose, onCreate, onSave, defaultOwner, project, users = [], categories = [], regionOptions = [], customFields = [], mode = 'admin' }) {
  const [form, setForm] = useState(() => initialForm(project, defaultOwner));
  const [saving, setSaving] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [regionsOpen, setRegionsOpen] = useState(false);
  const curatorMode = mode === 'curator';

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const updateDetail = (key, value) => setForm(current => ({
    ...current,
    details: { ...(current.details || {}), [key]: value }
  }));
  const visible = field => {
    if (field.when) {
      const parentValue = form.details?.[field.when];
      if (field.notWhenValue) {
        if (!parentValue || parentValue === field.notWhenValue) return false;
      } else if (parentValue !== 'В работе' && parentValue !== 'Да') {
        return false;
      }
    }
    if (field.notWhenValue && form.details?.[field.key.replace(/Date$/, '')] === field.notWhenValue) return false;
    if (field.extraUnless && form.details?.[field.key] === field.extraUnless) return false;
    if (field.extraWhen && form.details?.[field.key] !== field.extraWhen) return false;
    return true;
  };
  const extraVisible = field => (!field.extraUnless || form.details?.[field.key] !== field.extraUnless)
    && (!field.extraWhen || form.details?.[field.key] === field.extraWhen)
    && (!field.when || form.details?.[field.when] === 'В работе' || form.details?.[field.when] === 'Да');

  const submit = async event => {
    event.preventDefault();
    if (!form.name.trim()) {
      alert('Укажите название проекта');
      return;
    }
    if (!project && !curatorMode && !(form.curators || []).length) {
      alert('Назначьте хотя бы одного куратора.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        secrecy: form.secrecy ? 'Секретно' : 'Стандартная',
        geography: form.geographyRegions.join(', '),
      };
      const saved = project ? await onSave(payload) : await onCreate(payload);
      if (saved) onClose();
    } finally {
      setSaving(false);
    }
  };

  const sections = [...new Set(detailFields.map(field => field.section))];
  const selectedRegions = form.geographyRegions || [];
  const availableRegions = regionOptions
    .filter(region => !selectedRegions.includes(region)
      && region.toLocaleLowerCase('ru-RU').includes(regionSearch.trim().toLocaleLowerCase('ru-RU')))
    .slice(0, 10);
  const descriptionPreview = buildDescriptionPreview(form);
  return (
    <div className="modal-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="modal project-modal">
        <div className="project-modal__header">
          <div>
            <h2>{project ? 'Карточка проекта' : 'Создание и распределение проекта'}</h2>
            <p>Поля со значениями из распределения доступны для просмотра куратору.</p>
          </div>
          <button type="button" className="project-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <section className="project-modal__section">
            <h3>Распределение</h3>
            <div className="project-modal__grid">
              <label>Проект <input value={form.name} onChange={event => update('name', event.target.value)} required disabled={curatorMode} /></label>
              <label>Кодовое название <input value={form.codeName || ''} onChange={event => update('codeName', event.target.value)} disabled={curatorMode} /></label>
              <label>Категория
                <select value={form.category || ''} onChange={event => update('category', event.target.value)} disabled={curatorMode}>
                  <option value="">Не выбрана</option>
                  {categories.map(category => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label>Заказчик <input value={form.customer || ''} onChange={event => update('customer', event.target.value)} disabled={curatorMode} /></label>
              <label>ОРП <input value={form.orp || ''} onChange={event => update('orp', event.target.value)} disabled={curatorMode} /></label>
              <label>Статус проекта
                <select value={form.status || 'Новый'} onChange={event => update('status', event.target.value)} disabled={curatorMode}>
                  {['Новый', 'Закрыто', 'Отменено', 'Hold', 'В работе', 'Перенесена дата', 'Согласование руководителя', 'Выполнено'].map(status => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label>Ссылка на ЗНИ <input type="url" value={form.zniLink || ''} onChange={event => update('zniLink', event.target.value)} disabled={curatorMode} /></label>
              <label>Кураторы
                <select multiple value={form.curators || []} onChange={event => update('curators', [...event.target.selectedOptions].map(option => option.value))} disabled={curatorMode} size={Math.min(Math.max(users.length, 2), 5)}>
                  {users.map(user => <option key={user.id} value={user.username}>{user.username} ({user.role || 'без роли'})</option>)}
                </select>
                <small>Задача создаётся каждому выбранному сотруднику.</small>
              </label>
            </div>
          </section>

          <section className="project-modal__section">
            <h3>Описание проекта для графика</h3>
            <div className="project-modal__grid">
              <label>Название проекта для графика <input value={form.graphName || ''} onChange={event => update('graphName', event.target.value)} /></label>
              <label>Когда — дата запуска проекта <input type="date" value={form.launchDate || ''} onChange={event => update('launchDate', event.target.value)} /></label>
              <label>Дата утверждена?
                <select value={form.approved || 'no'} onChange={event => update('approved', event.target.value)}>
                  <option value="no">Не подтверждена</option><option value="yes">Подтверждена</option>
                </select>
              </label>
              <label>Дата внесения информации в график <input type="date" value={form.graphInfoDate || ''} onChange={event => update('graphInfoDate', event.target.value)} /></label>
              <label>Передать в график
                <select value={form.graphTransferMode || transferModes[0]} onChange={event => update('graphTransferMode', event.target.value)}>
                  {transferModes.map(value => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="project-modal__checkbox"><input type="checkbox" checked={Boolean(form.secrecy)} onChange={event => update('secrecy', event.target.checked)} /> Секретный проект</label>
              <div className="project-modal__full">
                <label htmlFor="project-region-search">География — регионы из справочника</label>
                <div className="project-modal__region-picker" onBlur={event => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setRegionsOpen(false);
                }}>
                  <div className="project-modal__region-tags">
                    {selectedRegions.map(region => (
                      <span className="project-modal__region-tag" key={region}>
                        {region}
                        <button type="button" aria-label={`Убрать регион ${region}`}
                          onClick={() => update('geographyRegions', selectedRegions.filter(value => value !== region))}>
                          ×
                        </button>
                      </span>
                    ))}
                    <input id="project-region-search" type="search" value={regionSearch}
                      placeholder={regionOptions.length ? 'Найти регион…' : 'Справочник регионов пуст'}
                      disabled={!regionOptions.length}
                      onFocus={() => setRegionsOpen(true)}
                      onChange={event => { setRegionSearch(event.target.value); setRegionsOpen(true); }} />
                  </div>
                  {regionsOpen && regionOptions.length > 0 && (
                    <div className="project-modal__region-options" role="listbox" aria-label="Регионы из справочника">
                      {availableRegions.map(region => (
                        <button type="button" role="option" aria-selected="false" key={region}
                          onClick={() => {
                            update('geographyRegions', [...selectedRegions, region]);
                            setRegionSearch('');
                          }}>
                          {region}
                        </button>
                      ))}
                      {availableRegions.length === 0 && <span>Подходящих регионов нет.</span>}
                    </div>
                  )}
                </div>
                <small>Выбранные регионы появятся здесь метками и автоматически попадут в описание графика.</small>
              </div>
              <label className="project-modal__full">Описание <textarea rows={3} value={form.description || ''} onChange={event => update('description', event.target.value)} /></label>
              <label>Было <textarea rows={3} value={form.descriptionBefore || ''} onChange={event => update('descriptionBefore', event.target.value)} /></label>
              <label>Стало <textarea rows={3} value={form.descriptionAfter || ''} onChange={event => update('descriptionAfter', event.target.value)} /></label>
              <label className="project-modal__full">Как будет проходить пилот
                <textarea rows={3} value={form.pilotPlan || ''} onChange={event => update('pilotPlan', event.target.value)} />
              </label>
              <div className="project-modal__description-preview project-modal__full">
                <strong>Так описание будет выглядеть в графике</strong>
                <pre>{descriptionPreview || 'Заполните дату, регионы и текстовые поля — описание соберётся автоматически.'}</pre>
              </div>
            </div>
          </section>

          {sections.map(section => (
            <section className="project-modal__section" key={section}>
              <h3>{section}</h3>
              <div className="project-modal__grid">
                {detailFields.filter(field => field.section === section && visible(field)).map(field => (
                  <div className="project-modal__field" key={field.key}>
                    <label>{field.label}
                      {field.options ? (
                        <select value={form.details?.[field.key] || ''} onChange={event => updateDetail(field.key, event.target.value)}>
                          <option value="">Не указано</option>
                          {field.options.map(value => <option key={value}>{value}</option>)}
                        </select>
                      ) : field.type === 'dateOrNotRequired' ? (
                        <div className="project-modal__date-choice">
                          <input type="date" value={form.details?.[field.key] === 'Не требуется' ? '' : form.details?.[field.key] || ''} onChange={event => updateDetail(field.key, event.target.value)} />
                          <button type="button" onClick={() => updateDetail(field.key, 'Не требуется')}>Не требуется</button>
                        </div>
                      ) : (
                        <input type={field.type || 'text'} value={form.details?.[field.key] || ''} onChange={event => updateDetail(field.key, event.target.value)} />
                      )}
                    </label>
                    {field.extra && extraVisible(field) && (
                      <label>{field.extra.label}<input value={form.details?.[field.extra.key] || ''} onChange={event => updateDetail(field.extra.key, event.target.value)} /></label>
                    )}
                    {field.extraFlag && form.details?.[field.key] === 'В работе' && (
                      <label className="project-modal__checkbox"><input type="checkbox" checked={Boolean(form.details?.[field.extraFlag.key])} onChange={event => updateDetail(field.extraFlag.key, event.target.checked)} /> {field.extraFlag.label}</label>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
          {customFields.length > 0 && (
            <section className="project-modal__section">
              <h3>Дополнительные поля</h3>
              <div className="project-modal__grid">
                {customFields.map(field => {
                  const key = `custom.${field.fieldKey}`;
                  const value = form.details?.[key] ?? (field.type === 'checkbox' ? false : '');
                  return <label key={field.fieldKey}>{field.label}
                    {field.type === 'select' ? (
                      <select value={value} onChange={event => updateDetail(key, event.target.value)}>
                        <option value="">Не указано</option>
                        {(field.options || []).map(option => <option key={option}>{option}</option>)}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <input type="checkbox" checked={Boolean(value)} onChange={event => updateDetail(key, event.target.checked)} />
                    ) : (
                      <input type={['text', 'date', 'url', 'number'].includes(field.type) ? field.type : 'text'} value={value} onChange={event => updateDetail(key, event.target.value)} />
                    )}
                  </label>;
                })}
              </div>
            </section>
          )}
          <section className="project-modal__section">
            <h3>Дополнительные признаки</h3>
            <div className="project-modal__grid">
              <label className="project-modal__checkbox"><input type="checkbox" checked={Boolean(form.details?.scheduleShift)} onChange={event => updateDetail('scheduleShift', event.target.checked)} /> Смещение сроков</label>
              <label className="project-modal__checkbox"><input type="checkbox" checked={Boolean(form.details?.conceptChange)} onChange={event => updateDetail('conceptChange', event.target.checked)} /> Изменение концепта</label>
              {form.details?.scheduleShift && <>
                <label>С даты <input type="date" value={form.details?.shiftFrom || ''} onChange={event => updateDetail('shiftFrom', event.target.value)} /></label>
                <label>На дату <input type="date" value={form.details?.shiftTo || ''} onChange={event => updateDetail('shiftTo', event.target.value)} /></label>
              </>}
            </div>
          </section>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit" disabled={saving}>{saving ? 'Сохраняем…' : project ? 'Сохранить' : 'Создать проект'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
