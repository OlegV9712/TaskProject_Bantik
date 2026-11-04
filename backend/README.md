# Bow Backend (Spring Boot)

Minimal Spring Boot skeleton with PostgreSQL for local development.

Prerequisites:
- Java 17+
- Maven
- PostgreSQL running with a database `bowdb` (or edit `application.properties`)

Run:

```bash
cd backend
mvn spring-boot:run
```

Main API endpoints:
- `POST /api/auth/login` and `POST /api/auth/logout` — start/end a server session.
- `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/{id}` — project distribution and cards.
- `GET /api/admin/users` — users available for curator assignment.
- `GET /api/tasks?username=...&archived=false` — curator's active tasks; use `archived=true` for completed tasks.
- `PATCH /api/tasks/{id}` — set `{ "completed": true|false }`; this is separate from project status.
- `PATCH /api/tasks/{id}/transfer` — set `{ "username": "...", "until": "YYYY-MM-DD" }`; use an empty username to cancel.
- `GET /api/projects/schedule` — rows included in the schedule according to the project's transfer mode.
- `PATCH /api/projects/{id}/schedule` — update admin overrides and the schedule's `graphDone` flag.
- `GET /api/projects/schedule/export?from=YYYY-MM-DD&to=YYYY-MM-DD` — `.xlsx` workbook filtered by launch date.
- `GET /api/admin/workload?period=day|month|year` — task counts and calculated workload.
- `GET|PUT /api/admin/categories` — read/update project categories.
- `GET /api/admin/regions`, `PUT /api/admin/regions` — shared region directory; admins maintain it and users read it when selecting project geography.
- `GET|PUT /api/admin/fields` — read/update additional card fields.
- `GET|PUT /api/admin/complexity` — read/update field complexity weights.
- `GET /api/settings` and `PUT /api/settings` — legacy user settings endpoints.

Implementation defaults where the requirements do not prescribe a rule:
- Each selected curator receives a separate task. Removing a curator removes their assignment.
- The task's `Готово` state is independent of the project's business status; the distribution shows `Готово` only when all assigned tasks are complete.
- Both schedule transfer modes are included in the schedule. `Не передавать` is excluded; graph rows marked done are hidden after save.
- Schedule export is a real `.xlsx` workbook filtered by project launch date.
- Each non-empty detail field has a default complexity weight of 1; `Нет`, `Не требуется`, empty values and booleans do not add weight. Admins can adjust weights.
- Workload is counted by curator assignment; a project with multiple curators contributes its full complexity to each curator.
- Schedule descriptions are assembled from launch date, selected regions, description, before/after notes and the pilot plan; only the text fields are entered manually.

Authentication uses an HttpOnly server-side session cookie; the browser does not store a role or bearer token. Role checks are enforced by the backend as well as the frontend. Passwords are BCrypt-hashed, newly created or changed passwords must contain at least 12 characters, and repeated failed logins are rate-limited per client address.

For local development, set `FRONTEND_ORIGIN=http://localhost:5173`. New databases do not receive built-in demo users: configure `BOOTSTRAP_ADMIN_USERNAME` and a private `BOOTSTRAP_ADMIN_PASSWORD` (at least 12 characters) through the local environment when bootstrapping the first admin. For an HTTPS deployment, set `FRONTEND_ORIGIN` to the exact trusted frontend origin and `SESSION_COOKIE_SECURE=true`; use TLS and private credentials before exposing the service publicly.
