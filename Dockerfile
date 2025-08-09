
# Multi-stage Dockerfile: build frontend, backend, then run both in one container

# 1) Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# 2) Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/. ./
RUN npm run build

# 3) Runtime: Node + Nginx
FROM node:20-alpine AS runtime
WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx && \
    mkdir -p /run/nginx

# Copy frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html
# Copy backend
COPY --from=backend-build /app/server/dist /app/server/dist
COPY --from=backend-build /app/server/node_modules /app/server/node_modules
COPY --from=backend-build /app/server/package.json /app/server/package.json

# Copy nginx config and startup script
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080
CMD ["/start.sh"]
