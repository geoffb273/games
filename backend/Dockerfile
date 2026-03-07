# backend/Dockerfile - Node 22, pnpm, Prisma, run GraphQL server
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY prisma ./prisma/
COPY src ./src
RUN pnpm exec prisma generate

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=deps /app/prisma ./prisma/
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src ./src

# Prisma client generated in deps (output is src/generated/prisma)
COPY --from=deps /app/src ./src

# DATABASE_URL, DIRECT_URL, JWT_SECRET must be set at runtime (e.g. by EC2/ECS)
EXPOSE 4000

CMD ["pnpm", "run", "start"]
