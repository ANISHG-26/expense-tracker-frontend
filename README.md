# Frontend (Expense Tracker POC)

This service consumes the Expense Tracker API defined in the context repo:
`../Context Repository/contracts/expense-tracker/openapi.yaml`.

## Setup

1) Install dependencies
2) Start the dev server

Example:

npm install
npm run dev

The app runs on http://localhost:5173 by default.

## API base URL

- Default: `http://localhost:3000`
- Override with `VITE_API_BASE`

## Linting and hooks

- Lint: `npm run lint`
- Pre-commit: `pre-commit install`

## Docker

- Build and run: `docker compose up --build`
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Before API changes, review:
- `../Context Repository/standards/api-change-policy.md`
- `../Context Repository/workflows/api-change-workflow.md`
