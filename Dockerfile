# syntax=docker/dockerfile:1

# ---- Dependências (compartilhado entre dev e build) ----
FROM node:22-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Desenvolvimento: Vite com hot reload ----
FROM deps AS dev
COPY . .
ENV PORT=8443
EXPOSE 8443
CMD ["pnpm", "dev"]

# ---- Build de produção ----
FROM deps AS build
COPY . .
RUN pnpm build

# ---- Produção: arquivos estáticos servidos pelo nginx ----
FROM nginx:1.27-alpine AS prod
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
