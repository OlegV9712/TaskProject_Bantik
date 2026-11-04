import { useEffect, useState } from 'react';
import '../../styles/TableFullscreen.css';

export default function TableFullscreen({ children, fullscreenContent, label = 'таблицу' }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <section className={`table-fullscreen${isFullscreen ? ' table-fullscreen--active' : ''}`}>
      <div className="table-fullscreen__toolbar">
        <button
          className="table-fullscreen__toggle"
          type="button"
          aria-label={isFullscreen ? `Закрыть полноэкранный режим ${label}` : `Открыть ${label} на весь экран`}
          onClick={() => setIsFullscreen(value => !value)}
        >
          {isFullscreen ? 'Свернуть таблицу' : 'На весь экран'}
        </button>
      </div>
      <div className="table-fullscreen__content">
        {isFullscreen && fullscreenContent ? fullscreenContent : children}
      </div>
    </section>
  );
}
