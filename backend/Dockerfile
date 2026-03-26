# backend/Dockerfile - Node 22, pnpm, Prisma, run GraphQL server
# Build context: ./backend (docker build -t ... ./backend)
# Runner uses prod deps only + tsx for a smaller image (no TypeScript, ESLint, Vitest, etc.).
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false --ignore-scripts

COPY prisma ./prisma/
COPY src ./src
RUN pnpm exec prisma generate

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json pnpm-lock.yaml tsconfig.runtime.json newrelic.cjs ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts && pnpm add tsx
ENV NODE_OPTIONS="--require newrelic"

COPY --from=deps /app/src ./src
COPY --from=deps /app/prisma ./prisma/

# DATABASE_URL, DIRECT_URL, JWT_SECRET must be set at runtime (e.g. by EC2/ECS)
EXPOSE 8080

CMD ["pnpm", "exec", "tsx", "--tsconfig", "tsconfig.runtime.json", "src/index.ts"]
