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

## Docker (shared)

Use the shared compose file in the context repo:
`../Context Repository/shared/docker-compose.yml`

Run:
`docker compose -f "../Context Repository/shared/docker-compose.yml" up --build`

Or:
`powershell -File run-shared.ps1 -Action compose`

## Contract guard (shared)

Run:
`powershell -ExecutionPolicy Bypass -File "../Context Repository/shared/scripts/check-contract-change.ps1"`

Or:
`powershell -File run-shared.ps1 -Action contract-check`

Before API changes, review:
- `../Context Repository/standards/api-change-policy.md`
- `../Context Repository/workflows/api-change-workflow.md`
