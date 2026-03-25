FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN chmod +x /app/docker/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
