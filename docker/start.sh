#!/bin/sh
set -e

# Cloud Run provides $PORT (default 8080). Fallback to 8080.
export PORT="${PORT:-8080}"

# Patch nginx listen port dynamically if different from template default
if grep -q "listen       80;" /etc/nginx/nginx.conf; then
	sed -i "s/listen       80;/listen       ${PORT};/" /etc/nginx/nginx.conf
fi

# Start Node backend
node /app/server/dist/index.js &

# Start Nginx in foreground
nginx -g 'daemon off;'
