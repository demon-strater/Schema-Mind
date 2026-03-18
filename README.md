# SchemaMind

SchemaMind is a full-stack React + Express app with PostgreSQL storage and OpenAI-powered text analysis.

## Public Deployment

This repository is prepared for deployment on Render using the included [`render.yaml`](./render.yaml).

### What gets created

- One Node web service
- One managed PostgreSQL database

### Required environment variables

- `OPENAI_API_KEY`
- `DATABASE_URL` is wired automatically by Render blueprint

### Deploy on Render

1. Push this repository to GitHub.
2. In Render, choose `New +` -> `Blueprint`.
3. Select this repository.
4. Confirm creation of the `schemamind` web service and `schemamind-db` database.
5. Set `OPENAI_API_KEY` in the Render dashboard.
6. Deploy.

After the first successful deploy, Render will issue a public HTTPS URL in this form:

`https://schemamind.onrender.com`

The exact hostname can differ if that name is already taken.

## Local Run

1. Set `.env` from `.env.example`.
2. Start PostgreSQL with `docker compose up -d db`.
3. Apply schema with `npm run db:push`.
4. Start the app with `npm run dev`.
5. Open `http://localhost:5000`.
