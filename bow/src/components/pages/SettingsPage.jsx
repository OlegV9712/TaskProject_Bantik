import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../common/Icon';
import { apiFetch, jsonBody } from '../../api';
import '../../styles/SettingsPage.css';

function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState({ visible: false, text: '' });
  const [settingsError, setSettingsError] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const username = user?.username;
      const query = username ? `?username=${encodeURIComponent(username)}` : '';
      const data = await apiFetch(`/settings${query}`);
      setSettings(data);
      setSettingsError('');
    } catch (err) {
      setSettingsError(`Не удалось загрузить настройки: ${err.message}`);
    }
  }, [user]);

  useEffect(() => {
    // Load settings after the authenticated user changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    // Saving disabled in current dev version
    setToast({ visible: true, text: 'Сохранение отключено в этой версии' });
    setTimeout(() => setToast({ visible: false, text: '' }), 2500);
  };

  const fileInputRef = useRef(null);

  const showToast = (text) => {
    setToast({ visible: true, text });
    setTimeout(() => setToast({ visible: false, text: '' }), 3500);
  };

  const handleThemeClick = () => {
    showToast('Пока у нас доступна только розовая тему — напишите нам, если хотите больше!');
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

  const projectsToCsv = (projects) => {
    if (!projects.length) return '';
    const headerKeys = [
      'id', 'name', 'owner', 'status', 'launchDate', 'category', 'geography', 'volume', 'description',
      'descriptionBefore', 'descriptionAfter', 'pilotPlan', 'teamProject', 'approved'
    ];
    const escape = (value) => {
      if (value == null) return '';
      const normalized = String(value).replace(/"/g, '""');
      return `"${normalized}"`;
    };
    const lines = [headerKeys.map(escape).join(',')];
    for (const project of projects) {
      lines.push(headerKeys.map((key) => escape(project[key])).join(','));
    }
    return lines.join('\r\n');
  };

  const buildExcelHtml = (projects) => {
    const rows = projects.map((project) => `
      <tr>
        <td>${project.id ?? ''}</td>
        <td>${project.name ?? ''}</td>
        <td>${project.owner ?? ''}</td>
        <td>${project.status ?? ''}</td>
        <td>${project.launchDate ?? ''}</td>
        <td>${project.category ?? ''}</td>
        <td>${project.geography ?? ''}</td>
        <td>${project.volume ?? ''}</td>
        <td>${(project.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td>${(project.descriptionBefore || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td>${(project.descriptionAfter || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td>${(project.pilotPlan || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
      </tr>
    `).join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr><th>ID</th><th>Название</th><th>Владелец</th><th>Статус</th><th>Дата запуска</th><th>Категория</th><th>География</th><th>Объем</th><th>Описание</th><th>Было</th><th>Стало</th><th>Как будет проходить пилот</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  };

  const handleExportProjects = async () => {
    try {
      const projects = await apiFetch('/projects');
      const csv = projectsToCsv(projects);
      downloadFile('projects-export.csv', csv, 'text/csv;charset=utf-8;');
      const xls = buildExcelHtml(projects);
      downloadFile('projects-export.xls', xls, 'application/vnd.ms-excel');
      showToast('Экспорт завершён. Скачаны файлы CSV и XLS.');
    } catch (err) {
      console.error(err);
      showToast('Не удалось экспортировать проекты');
    }
  };

  const parseCsv = (text) => {
    const separator = /,(?=(?:[^"]*"[^"]*")*(?![^"]*"))/;
    const lines = text.trim().split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) return [];
    const headers = lines[0].split(separator).map((h) => h.replace(/^"|"$/g, '').trim());
    return lines.slice(1).map((line) => {
      const values = line.split(separator).map((value) => value.replace(/^"|"$/g, '').trim());
      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] ?? '';
      });
      return item;
    });
  };

  const parseFile = async (file) => {
    const text = await file.text();
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.json')) {
      return JSON.parse(text);
    }
    if (lowerName.endsWith('.csv')) {
      return parseCsv(text);
    }
    if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) {
      if (text.trim().startsWith('<')) {
        const rows = Array.from(text.matchAll(/<tr>(.*?)<\/tr>/gs)).slice(1).map((m) => m[1]);
        const headers = Array.from(rows[0].matchAll(/<t[dh]>(.*?)<\/t[dh]>/gs)).map((m) => m[1].replace(/<.*?>/g, '').trim());
        return rows.slice(1).map((row) => {
          const values = Array.from(row.matchAll(/<t[dh]>(.*?)<\/t[dh]>/gs)).map((m) => m[1].replace(/<.*?>/g, '').trim());
          const item = {};
          headers.forEach((header, idx) => { item[header] = values[idx] ?? ''; });
          return item;
        });
      }
      throw new Error('Неподдерживаемый формат Excel');
    }
    throw new Error('Поддерживаются только JSON, CSV и HTML/XLS');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseFile(file);
      if (!Array.isArray(imported)) throw new Error('Формат должен быть массивом проектов');
      let importedCount = 0;
      for (const rawItem of imported) {
        const item = {
          name: rawItem.name || rawItem['Название'] || rawItem['name'] || rawItem['Name'] || '',
          owner: rawItem.owner || rawItem['Владелец'] || rawItem['owner'] || rawItem['Owner'] || user?.username || 'unknown',
          description: rawItem.description || rawItem['Описание'] || rawItem['description'] || rawItem['Description'] || '',
          descriptionBefore: rawItem.descriptionBefore || rawItem['Было'] || '',
          descriptionAfter: rawItem.descriptionAfter || rawItem['Стало'] || '',
          pilotPlan: rawItem.pilotPlan || rawItem['Как будет проходить пилот'] || '',
          sendFlag: rawItem.sendFlag || rawItem['sendFlag'] || rawItem['Отправляем?'] || 'no',
          level: rawItem.level || rawItem['Уровень'] || rawItem['level'] || '',
          secrecy: rawItem.secrecy || rawItem['Секретность'] || rawItem['secrecy'] || 'Стандартная',
          category: rawItem.category || rawItem['Категория'] || rawItem['category'] || '',
          launchDate: rawItem.launchDate || rawItem['Дата запуска'] || rawItem['launchDate'] || rawItem['LaunchDate'] || '',
          approved: rawItem.approved || rawItem['approved'] || rawItem['Дата утверждена?'] || 'no',
          geography: rawItem.geography || rawItem['География'] || rawItem['geography'] || '',
          typeField: rawItem.typeField || rawItem['Тип'] || rawItem['typeField'] || '',
          dateField: rawItem.dateField || rawItem['Дата'] || rawItem['dateField'] || '',
          volume: rawItem.volume || rawItem['Объем'] || rawItem['volume'] || '',
          abBaseVolume: rawItem.abBaseVolume || rawItem['abBaseVolume'] || rawItem['Объем затрагиваемой абон. базы'] || '',
          kms: rawItem.kms || rawItem['KMS'] || '',
          wt: rawItem.wt || rawItem['WT'] || '',
          ivr: rawItem.ivr || rawItem['IVR'] || '',
          smsTemplates: rawItem.smsTemplates || rawItem['SMS шаблоны WD/CRM'] || '',
          cmsArticleTitle: rawItem.cmsArticleTitle || rawItem['Название статьи в KMS'] || '',
          website: rawItem.website || rawItem['Сайт'] || '',
          sellerTask: rawItem.sellerTask || rawItem['sellerTask'] || '',
          ownerProject: rawItem.ownerProject || rawItem['ownerProject'] || '',
          curator: rawItem.curator || rawItem['curator'] || '',
          status: rawItem.status || rawItem['status'] || 'New',
          teamProject: rawItem.teamProject === 'true' || rawItem.teamProject === true || rawItem['TeamProject'] === 'true',
        };
        await apiFetch('/projects', {
          method: 'POST',
          body: jsonBody(item),
        });
        importedCount += 1;
      }
      showToast(`Импортировано ${importedCount} проекта(ов)`);
      await fetchSettings();
    } catch (err) {
      console.error(err);
      showToast('Не удалось импортировать файл — проверьте формат CSV/JSON');
    } finally {
      e.target.value = '';
    }
  };

  if (settingsError) return <div className="settings" role="alert">{settingsError}</div>;
  if (!settings) return <div className="settings">Загрузка...</div>;

  return (
    <div className="settings">
      <h1 className="settings__title"><Icon name="settings" size={25} />Настройки</h1>
      <form className="settings__form" onSubmit={handleSave}>
        <div className="settings__section">
          <h2 className="settings__subtitle">Профиль</h2>
          <label className="settings__label">Имя пользователя</label>
          <div className="settings__field">{settings.username}</div>
          <label className="settings__label">Email</label>
          <div className="settings__field">{settings.email}</div>
        </div>
        <div className="settings__section">
          <h2 className="settings__subtitle">Внешний вид</h2>
          <label className="settings__label">Тема</label>
          <button type="button" className="settings__themebtn" onClick={handleThemeClick}>Розовая тема</button>
        </div>
        <div className="settings__section">
          <h2 className="settings__subtitle">Роль</h2>
          <label className="settings__label">Роль пользователя</label>
          <div className="settings__field">{settings.role}</div>
        </div>
        {settings.role === 'Boss' && (
          <div className="settings__section">
            <h2 className="settings__subtitle">Управление задачами</h2>
            <button type="button" className="settings__button" onClick={handleExportProjects}>Экспорт проектов</button>
            <button type="button" className="settings__button settings__button--secondary" onClick={handleImportClick}>Импорт проектов</button>
            <input
              type="file"
              accept=".json,.csv,.xls,.xlsx"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
        )}
        <button className="settings__save" type="submit" disabled>
          Сохранение отключено
        </button>
      </form>

      <div className={`settings__toast ${toast.visible ? 'show' : ''}`}>{toast.text}</div>
    </div>
  );
}

export default SettingsPage;