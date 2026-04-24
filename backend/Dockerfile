# backend/Dockerfile - Node 22, pnpm, Prisma, run GraphQL server
# Build context: repo root (docker build -f backend/Dockerfile .)
# Runner uses prod deps only for a smaller image (no TypeScript, ESLint, Vitest, etc.).
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

FROM base AS runner
WORKDIR /repo

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
RUN pnpm install --frozen-lockfile --filter backend... --prod --ignore-scripts

WORKDIR /repo/backend
COPY backend/tsconfig.runtime.json backend/newrelic.cjs ./
COPY backend/prisma ./prisma/
RUN pnpm exec prisma generate
COPY backend/src ./src
ENV NODE_OPTIONS="--require newrelic"

# DATABASE_URL, DIRECT_URL, JWT_SECRET must be set at runtime (e.g. by EC2/ECS)
EXPOSE 8080

CMD ["pnpm", "exec", "tsx", "--tsconfig", "tsconfig.runtime.json", "src/index.ts"]
