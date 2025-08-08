# Multi-stage Dockerfile to build and serve the production site

# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the sources
COPY . .

# Build-time API key (optional). If provided, Vite will inline it.
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}

# Build the app
RUN npm run build

# 2) Runtime stage
FROM nginx:alpine AS runtime

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static site
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
