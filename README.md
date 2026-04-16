# Social Service

Social graph, profiles, topic preferences, friend requests, and groups for the Scroller platform.

## Port

`3002` (Identity Service runs on `3001`)

## Quick start

```bash
cp .env.example .env
# edit .env — set JWT_ACCESS_SECRET to match your Identity Service secret
docker compose up -d
```

## API docs

`http://localhost:3002/api/v1/docs`

## Local development

```bash
npm install
npm run prisma:migrate:dev
npm run start:dev
```
