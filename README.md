# DJ's Tasks - AI Assisted

A React calendar and Express API for planning tasks by day. The first version uses PostgreSQL and is designed so tasks belong to a user, while sign-in and multi-user support remain future work.

## What works today

- Daily schedule with previous/next day navigation and a jump-to-today control
- Create, edit, complete, and delete scheduled tasks
- Task title, optional notes, start time, and end time
- PostgreSQL storage through an Express API
- A user relationship on each task, ready for authentication to be added later

The current local setup seeds one `Local User` and assigns all requests to that account. There is no login yet, so this is a single-user development app rather than a multi-user deployment.

## Visual design notes

The landing page aims to make planning feel calm and approachable, while keeping the schedule and its controls easy to scan.

- **Warm, quiet canvas:** A soft warm-gray page background (`#f7f6f2`), a subtle sand-colored glow, and a white calendar card create separation without strong contrast or a stark white screen.
- **Muted green accent:** The sage green (`#61745b`) is reserved for the brand mark and primary actions. Lighter green task surfaces connect scheduled items to those actions without making every element compete for attention.
- **Typography with distinct jobs:** Georgia-style serif headings bring a little warmth and character. System sans-serif text is used for controls and details, where quick reading matters more.
- **Clear information hierarchy:** A small uppercase eyebrow labels the page; the date gets the main calendar heading; task counts and hour labels are quieter; task titles remain the strongest text inside the schedule.
- **Comfortable spacing and restrained surfaces:** Consistent padding, thin borders, rounded corners, and a low-contrast shadow separate the header, calendar, and task form without adding heavy decoration.
- **Useful empty state:** When a day has no plans, the page says so and offers a direct way to add one. This makes the initial screen feel intentional instead of unfinished.
- **Responsive, usable controls:** The layout narrows on smaller screens, form fields stack when needed, and date navigation, completion, and form actions have accessible labels and visible keyboard focus.

These are design notes for the current page rather than a formal design system. As the weekly and monthly views are added, reusing the same palette, typography, spacing, and interaction patterns should help keep the app coherent.

## Requirements

- Node.js 20.19+ or 22.12+
- Docker Desktop with Docker Compose

## Run locally

1. Start PostgreSQL from the project root:

   ```sh
   docker compose up -d db
   ```

2. Configure and migrate the API:

   ```sh
   cd server
   cp .env.example .env
   npm install
   npm run db:migrate
   npm run dev
   ```

   The API runs at `http://localhost:5000`. `GET /api/health` checks the database connection.

3. In a second terminal, start the React app:

   ```sh
   cd client
   npm install
   npm run dev
   ```

   Open the Vite URL printed in the terminal. Vite forwards `/api` requests to the Express server.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks?date=YYYY-MM-DD` | List tasks overlapping a calendar day |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Update a task's details and time |
| `PATCH` | `/api/tasks/:id` | Change its `completed` status |
| `DELETE` | `/api/tasks/:id` | Delete a task |

Task request bodies use `title`, `description`, `startsAt`, and `endsAt`. Date-times are local wall-clock values for now; timezone-aware scheduling is a future enhancement.

## Database

`server/migrations/001_initial_schema.sql` creates the `users` and `tasks` tables and seeds the local development user. The migration runner records applied files in `schema_migrations`, so running `npm run db:migrate` again is safe.

To stop PostgreSQL while retaining local task data, run `docker compose down`. To also erase the database volume and all its data, run `docker compose down -v`.

## Checks

```sh
cd server
npm test
```

```sh
cd client
npm run lint
npm run build
```

## Next steps

1. Verify the app against a local PostgreSQL instance and add API/database integration tests.
2. Add weekly and monthly calendar views.
3. Add authentication and ensure each signed-in user can access only their own tasks.
4. Choose a hosting setup and deploy the app.
