# Mobile App – Expo / React Native Client

This directory contains the **mobile client** for the games project. It’s an [Expo](https://expo.dev) / React Native app that talks to the GraphQL backend and is designed to be easy to demo in interviews on a simulator or physical device.

The goal of this app is to show how I structure a **real-world mobile frontend**: typed API layer, predictable state management, and a polished puzzle experience.

---

## 🚀 What This App Does

- **Puzzle gameplay UI** with responsive layouts and clear feedback
- **User authentication** and per-user state (e.g., progress, saved games)
- **GraphQL-powered data layer** using Apollo Client 4
- **Local state management** with Valtio for UI and non-server state
- **Production-minded patterns**: error handling, loading states, optimistic updates where it makes sense

---

## 🛠 Tech & Libraries

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Networking / Data**: Apollo Client 4, GraphQL
- **State management**: Valtio
- **Navigation / Routing**: Expo Router (file-based routing in `app/`)
- **Tooling**: pnpm, ESLint, TypeScript, Prettier

---

## 🧑‍💻 Local Development

From the **repo root**, make sure dependencies are installed:

```bash
pnpm install
```

Then start the backend (see root `README.md`), so the mobile app has an API to talk to.

From the **mobile** directory:

```bash
cd mobile
pnpm install        # if you prefer, but pnpm workspaces usually handle this from root
pnpm start          # or: pnpm expo start
```

---

## 🔌 Environment & Configuration

The app expects a GraphQL API endpoint (e.g. the backend from this repo) and may read it from a config or environment file (depending on how you wire it up; adjust this section to match your local setup).

Typical pattern:

- Configure the **GraphQL endpoint** in a single place (e.g., an Apollo client setup file).
- Use that client throughout the app via hooks like `useQuery` / `useMutation` or custom wrappers.

---

## 📂 Notable Folders

Depending on how you’ve organized the app, you’ll typically see:

- `app/` – file-based routes / screens
- `src/components/` – shared UI components (e.g., puzzle tiles, cards, buttons)
- `src/api/` – GraphQL queries/mutations and typed hooks
- `src/state/` – Valtio stores or related state management helpers

This structure makes it easy for someone reading the code (e.g. an interviewer) to jump straight to:

- **Screens** in `app/` to see flows
- **Components** in `src/components/` for UI details
- **API hooks** in `src/api/` to understand how the app talks to the backend

---

## 🧱 Architecture

- **Separation of concerns**
  - Screens stay thin, delegating data fetching to hooks and logic to state modules.
  - UI components are mostly presentational and reusable across screens.

- **Data flow**
  - Apollo Client manages server data and caching.
  - Valtio handles local-only state (filters, temporary selections, UI toggles).

- **Error & loading UX**
  - Each screen has explicit loading and error states instead of “blank” screens.
  - Where helpful, the UI uses optimistic updates or progress indicators so the app feels responsive.

- **Performance considerations**
  - Avoid unnecessary re-renders by splitting components and using memoization when needed.
  - Use flat lists and virtualization patterns for larger data sets.
