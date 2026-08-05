FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10.14.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Les variables Vite sont figées au build. La valeur relative par défaut fait
# passer les appels par le proxy nginx, ce qui rend l'image portable sur
# n'importe quel domaine sans rebuild.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
