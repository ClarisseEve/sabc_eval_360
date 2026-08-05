FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN npm install -g pnpm@10.14.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate && pnpm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@10.14.0
# node_modules is copied whole (rather than reinstalled with --prod) so that the
# generated Prisma client, the prisma CLI and ts-node stay available: the
# entrypoint needs them to apply migrations and seed before the server starts.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/sql ./sql
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
