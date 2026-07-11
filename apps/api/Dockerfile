# syntax=docker/dockerfile:1

# bcrypt(네이티브 모듈)의 프리빌드 바이너리가 glibc 기준이므로 alpine 대신 slim 사용
FROM node:22-slim AS base
RUN npm install -g pnpm@10
WORKDIR /app

# ---- build: 전체 의존성 설치 + prisma generate + nest build ----
# 이 스테이지는 docker-compose의 migrate 서비스 이미지로도 사용된다
# (prisma CLI가 devDependency라 runner에는 없음)
FROM base AS build
# bcrypt 프리빌드가 없는 플랫폼에서 소스 컴파일할 수 있도록 빌드 도구 설치
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY prisma.config.ts nest-cli.json tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src
# prisma-client 제너레이터가 generated/prisma에 TS를 생성하고, nest build가 함께 컴파일한다
RUN pnpm exec prisma generate && pnpm build

# ---- prod-deps: 프로덕션 의존성만 ----
FROM base AS prod-deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

# ---- runner ----
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# tsconfig가 src 밖의 generated/·prisma.config.ts를 포함해서 엔트리가 dist/src/main.js
CMD ["node", "dist/src/main.js"]
