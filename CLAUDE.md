# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## GitHub Repository

Remote: **https://github.com/henriqueodomingos-hub/fitmanager**

Auto-push is configured via a Stop hook in `.claude/settings.json`. After every Claude Code session, all changes are automatically committed and pushed to `origin master`. The commit message is `auto: atualização via Claude Code`. No manual `git push` is needed.

## Warning: Non-standard Next.js version

This project uses **Next.js 16.2.4** and **React 19.2.4**, which contain breaking changes from versions in your training data. APIs, conventions, and file structure may differ. Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js-specific code. Heed deprecation notices.

## Commands

All commands run from the `personal-trainer-app/` directory.

```bash
npm run dev          # start dev server on http://localhost:3000
npm run build        # production build
npm run lint         # run eslint
npm run seed         # seed the database (seed creds: personal@fitmanager.com / 123456)
npx prisma migrate dev   # run pending migrations
npx prisma generate      # regenerate client after schema changes
npx prisma studio        # open DB GUI
```

## Architecture

### Route structure

Two route groups in `src/app/`:
- `(auth)` — public pages (`/login`, `/registro`). No session check.
- `(app)` — protected pages with shared `Sidebar` + `Header` layout. The `(app)/layout.tsx` calls `getSession()` and redirects to `/login` if unauthenticated.

Protected routes: `/dashboard`, `/alunos`, `/alunos/[id]`, `/alunos/[id]/editar`, `/alunos/[id]/treinos/[workoutId]`, `/aulas`, `/treinos`.

### Authentication

Custom JWT auth in `src/lib/auth.ts` using `jose`. Session stored as an httpOnly cookie named `pt-session` (30-day expiry). No third-party auth library. `getSession()` is called in both the app layout and in every server action.

### Data layer

- **Database**: SQLite file at `prisma/dev.db`, accessed via Prisma 7 with the `@prisma/adapter-libsql` driver.
- **Prisma client**: Generated to `src/generated/prisma/` (not the default `node_modules/@prisma/client`). Import from `@/generated/prisma/client`.
- **Singleton**: `src/lib/prisma.ts` exports a global `prisma` instance to avoid connection exhaustion in dev.

### Server Actions

All mutations go through Next.js Server Actions in `src/app/actions/`. Each action:
1. Calls `getSession()` — returns `{ error }` if not authenticated.
2. Verifies resource ownership by checking `userId` on the related `Student`.
3. Calls `revalidatePath()` on affected routes after mutation.

Actions: `auth.ts` (login, register, logout), `students.ts` (CRUD + plan creation), `workouts.ts` (workouts, exercises, media uploads), `classes.ts` (class CRUD + plan counter management).

### Data model relationships

```
User → Student[] → Plan[]
                 → Class[] (optionally linked to a Plan)
                 → Workout[] → Exercise[] → ExerciseMedia[]
```

`Plan.doneClasses` is a counter that `classes.ts` increments/decrements when class `status` transitions to/from `"DONE"`. The valid statuses are `"SCHEDULED"`, `"DONE"`, and `"CANCELED"`.

### Media uploads

Exercise media (photos/videos) are saved to `public/uploads/` via `fs/promises` in `workouts.ts`. Filenames are `{exerciseId}-{timestamp}.{ext}`. Served statically by Next.js. No cloud storage integration.

### UI components

Shadcn/ui components live in `src/components/ui/`. Tailwind CSS v4 is used (breaking changes from v3). Toast notifications use `sonner` via `src/components/ui/sonner.tsx`. The `cn()` utility for class merging is in `src/lib/utils.ts`.
