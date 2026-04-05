FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  git \
  bash \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

# Create unprivileged runtime user
ARG APP_UID=10001
ARG APP_GID=10001
RUN groupadd --gid ${APP_GID} app \
  && useradd --uid ${APP_UID} --gid ${APP_GID} --create-home --shell /bin/bash app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Ensure runtime paths are writable by non-root user
RUN mkdir -p /app/data \
  && chown -R app:app /app /home/app

ENV HOME=/home/app
USER app

# Railway injects PORT dynamically; default 8790 for local dev
EXPOSE ${PORT:-8790}

# Railway needs HOST=0.0.0.0 to accept external traffic
ENV HOST=0.0.0.0

CMD ["pnpm", "start"]
