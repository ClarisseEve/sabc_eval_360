# Stage 1: Build the React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Copy dependency files first for layer caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY index.html vite.config.ts tsconfig*.json tailwind.config.* postcss.config.* ./
COPY resources/ ./resources/

# Build for production
RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
