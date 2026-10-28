FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.14.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate && pnpm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# WITH_MARIADB=true embarque un serveur MariaDB (compatible MySQL) pour les
# hébergeurs sans base MySQL managée; activé au runtime par EMBEDDED_MYSQL=true.
# Railway transmet les variables du service comme build args.
ARG WITH_MARIADB=false
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& if [ "$WITH_MARIADB" = "true" ]; then \
		apt-get install -y --no-install-recommends mariadb-server mariadb-client; \
	fi \
	&& rm -rf /var/lib/apt/lists/*
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
# Logo des exports DOCX/PPTX (lu via process.cwd()/assets): embarqué pour les
# plateformes sans montage de volume, comme Railway.
COPY --from=builder /app/assets ./assets
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
