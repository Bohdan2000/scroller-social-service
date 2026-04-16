# Social Service

Social graph, profiles, onboarding, topic preferences, friend requests, and groups for the Scroller platform.

## Port

`3002`

## Responsibilities

- **Profiles** — create, update, retrieve user profiles
- **Onboarding** — two-step onboarding flow (profile info → topic selection)
- **Topics** — topic catalogue and per-user topic preferences
- **Friends** — friend requests, accept/reject, friend list, remove friend
- **Groups** — create and manage groups with role-based membership (owner / admin / member)
- **Event consumer** — listens for `user.registered` from RabbitMQ and auto-creates a profile

## Quick start

```bash
# 1. Start shared infrastructure (RabbitMQ + Redis)
cd ../../infrastructure/local && docker compose up -d

# 2. Start the service
cd -
cp .env.example .env
# edit .env — set JWT_ACCESS_SECRET to match identity-service
docker compose up -d
```

## API docs

Swagger UI: `http://localhost:3002/api/v1/docs`

## Local development

```bash
npm install
cp .env.example .env

# Run migrations and start in watch mode
npm run prisma:migrate:dev
npm run start:dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | HTTP port (default `3002`) |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | yes | Must match identity-service value exactly |
| `RABBITMQ_URL` | yes | RabbitMQ connection string |

## RabbitMQ events

| Direction | Routing key | Action |
|---|---|---|
| Consume | `user.registered` | Auto-creates a profile with a generated username |

## Onboarding flow

After registration the social service auto-creates a minimal profile. The user then completes two steps before reaching the main feed:

1. `PATCH /api/v1/me/onboarding/step1` — set display name (required), bio, avatar URL
2. `POST  /api/v1/me/onboarding/step2` — choose topics (min 1); marks onboarding complete

Progress can be checked at any time via `GET /api/v1/me/onboarding`.
