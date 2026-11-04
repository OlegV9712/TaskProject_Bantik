# Бантик

Веб-приложение для управления проектами, задачами, расписанием и нагрузкой кураторов.

Проект состоит из:
- frontend на React + Vite в папке `bow/`
- backend на Spring Boot в папке `backend/`
- PostgreSQL для хранения данных
- Docker Compose для локального запуска всей инфраструктуры

## Что умеет приложение

- управлять каталогом проектов и их статусами
- распределять задачи между кураторами
- отслеживать выполнение задач и их переносы по датам
- формировать расписание и экспортировать его в Excel
- рассчитывать нагрузку по куратору/периоду
- поддерживать настройки администратора, категории, регионы и поля карточек
- использовать серверную сессию с HttpOnly cookie для авторизации

## Технологический стек

- Backend: Java 17, Spring Boot, Spring Security, Spring Data JPA, PostgreSQL
- Frontend: React 19, Vite, React Router
- Инфраструктура: Docker, Docker Compose

## Структура репозитория

```text
.
├── README.md
├── .env.example
├── .env
├── docker-compose.yml
├── backend/         # Spring Boot backend
├── bow/             # React frontend
└── ...
```

## Требования

Для локального запуска через Docker достаточно:
- Docker
- Docker Compose

Для запуска отдельных сервисов вручную:
- Java 17+
- Maven
- Node.js 18+
- npm
- PostgreSQL (если запускаете backend локально вне Docker)

## Быстрый старт через Docker Compose

1. Скопируйте пример окружения:

```bash
cp .env.example .env
```

2. Отредактируйте `.env`:
- задайте `POSTGRES_PASSWORD` — локальный пароль для PostgreSQL
- при первом запуске на пустой БД можно указать `BOOTSTRAP_ADMIN_USERNAME` и `BOOTSTRAP_ADMIN_PASSWORD` (минимум 12 символов)
- при необходимости измените `FRONTEND_ORIGIN` и `SESSION_COOKIE_SECURE`

3. Запустите контейнеры:

```bash
docker compose up --build -d
```

4. Откройте приложение:
- frontend: http://localhost:5173
- backend API: http://localhost:8081
- PostgreSQL: localhost:5433

## Проверка состояния

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## Остановка и очистка

```bash
docker compose stop
```

Останавливает контейнеры, сохраняя данные БД.

```bash
docker compose down
```

Останавливает и удаляет сеть, но сохраняет том PostgreSQL.

```bash
docker compose down -v
```

Удаляет том с данными БД. Используйте только если вы хотите полностью сбросить локальную базу.

## Запуск без Docker

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd bow
npm install
npm run dev
```

## Проверки и сборка

Для backend:

```bash
cd backend
mvn test
```

Для frontend:

```bash
cd bow
npm ci
npm run build
npm run lint
```

## Полезные переменные окружения

См. файл `.env.example`.

Ключевые переменные:
- `POSTGRES_DB` — имя базы данных
- `POSTGRES_USER` — пользователь PostgreSQL
- `POSTGRES_PASSWORD` — пароль базы данных
- `BOOTSTRAP_ADMIN_USERNAME` — логин первого администратора для пустой БД
- `BOOTSTRAP_ADMIN_PASSWORD` — пароль первого администратора для пустой БД
- `FRONTEND_ORIGIN` — trusted origin для CORS и session cookie
- `SESSION_COOKIE_SECURE` — включать `Secure` для cookie в продакшене/HTTPS

## Безопасность и локальная разработка

- `.env` должен содержать только локальные значения и не попадать в Git
- в продакшене не используйте демонстрационные пароли
- для HTTPS задайте публичный origin в `FRONTEND_ORIGIN` и используйте `SESSION_COOKIE_SECURE=true`
- пароли хранятся в хэше BCrypt, а требования к длине проверяются на сервере

## Ссылки на подробные описания

- [backend/README.md](backend/README.md) — детали API и логики backend
- [bow/README.md](bow/README.md) — описание frontend-проекта и шаблона Vite

## Поддержка и разработка

Для локальной разработки удобно держать два терминала:
- один для backend (`mvn spring-boot:run`)
- один для frontend (`npm run dev`)

Если проект запускается в контейнерах, вся инфраструктура поднимается одной командой через Docker Compose.
