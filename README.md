## 🚀 Overview

This repo contains a full-stack puzzle / game application built as a showcase for how I structure and ship production-quality features. It includes:

- **Type-safe backend** with GraphQL, Prisma ORM, and a service/DAO architecture
- **Mobile client** built with React Native / Expo, using Apollo Client and Valtio for state
- **Shared types and schema** between client and server via GraphQL codegen

This is the kind of project I like to walk through in interviews to discuss trade-offs, architecture decisions, and how I collaborate with product/design.

---

## ✨ Key Features

- **Playable puzzle experience**: mobile-friendly game UI with clear feedback and animations
- **User accounts & sessions**: authentication, persistence, and per-user game state
- **GraphQL API**: strongly typed schema for game data, mutations for moves and progress
- **Domain-driven backend**: `dao/` and `service/` layers to keep persistence and business logic cleanly separated
- **Production-minded tooling**: linting, type-checking, and a structure that scales with features

---

## 🛠 Tech Stack

- **Languages**: TypeScript (backend + mobile)
- **Backend**: Node.js, Express, Apollo Server, Pothos GraphQL, Prisma, PostgreSQL
- **Mobile**: React Native, Expo, Apollo Client 4, Valtio
- **Tooling**: pnpm, ESLint, Prettier, GraphQL Code Generator, Docker (for local DB)

---

## 📂 Project Structure

```text
backend/      # Node/Express, Apollo Server, Pothos, Prisma
mobile/       # Expo React Native app, Apollo Client, Valtio
```

Each app is self-contained, but they share the **GraphQL schema** contract and use generated TypeScript types for end-to-end safety.

---

## 🧑‍💻 Running the Project Locally

Prerequisites:

- Node.js (LTS)
- pnpm (`npm install -g pnpm`)
- Docker (for running PostgreSQL locally), or access to a PostgreSQL instance

### 1. Install dependencies

From the repo root:

```bash
pnpm install
```

### 2. Start the backend

From the repo root:

```bash
cd backend
pnpm migrate      # if defined – runs Prisma migrations
pnpm dev          # starts the GraphQL API
```

By default the API will be available on `http://localhost:8080` (or whatever port is configured).

### 3. Start the mobile app

From the repo root:

```bash
cd mobile
pnpm start        # starts Expo
```

You can then open the app in an iOS simulator, Android emulator, or on a physical device via the Expo Go app.
