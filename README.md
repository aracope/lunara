# Lunara Server

This is the **server-side backend** for Lunara, a web app for tarot readings, moon data, and journaling.

The server is built with **Node.js, Express, and PostgreSQL**, and provides authentication, API routes, and database management.

---

## Features

- **User authentication**: register, login, JWT-based session cookies.
- **Database models**: users, tarot_cards, moon_data, journal entries.
- **Validation**: input validated with Zod.
- **Caching**: in-memory caching for API responses.
- **Triggers & constraints**: ensures data consistency and case-insensitive email uniqueness.

---

## Requirements

- Node.js >= 18
- PostgreSQL
- [Optional] dotenv for environment variables

---

## Installation

1. Clone the repo:

```bash
git clone <repo-url>
cd Lunara/server
```

2. Install dependencies:

```bash
npm install
```

3. Create a .env file based on .env.example and set:

```bash
DB_URL=postgres://username:password@host:port/database
JWT_SECRET=your_jwt_secret
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## Database Setup

1. Start your PostgreSQL server.

2. Apply the main schema:

```bash
psql "$DB_URL" -f sql/schema.sql
```

3. Apply any migrations in sql/migrations:

```bash
psql "$DB_URL" -f sql/migrations/<migration-file>.sql
```

## Running the Server

```bash
npm start
```

- Server runs on the port defined in .env (default 3001).

- API routes are under /auth, /tarot, /moon, and /journal.

## Testing

- Tests can be added using your preferred testing framework (e.g., Jest, Vitest).

## Environment Variables

| Variable       | Description                                      |
|----------------|--------------------------------------------------|
| DB_URL         | PostgreSQL connection string                     |
| JWT_SECRET     | Secret key for signing JWTs                      |
| PORT           | Server listening port (default: 3001)           |
| CORS_ORIGIN    | Allowed CORS origin (default: Vite dev server)  |
| MOON_API_URL   | Moon API endpoint                                |
| MOON_API_KEY   | Moon API key                                     |
| TAROT_API_BASE | Tarot API base URL (Flask service)              |

## Notes

- Email uniqueness is case-insensitive via citext and a unique constraint.

- Updated timestamps are managed automatically with DB triggers.

- JWT auth is stored in httpOnly cookies for security.