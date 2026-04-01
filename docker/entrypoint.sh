#!/bin/sh
set -e

js_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# Validate APP_ENV value
APP_ENV="${APP_ENV:-production}"
case "$APP_ENV" in
  production|canary|beta|development) ;;
  *)
    echo "Warning: unknown APP_ENV value '$APP_ENV', defaulting to 'production'"
    APP_ENV="production"
    ;;
esac

APP_ENV_ESCAPED="$(js_escape "$APP_ENV")"
DEFAULT_HOST_URL_ESCAPED="$(js_escape "${VITE_DEFAULT_HOST_URL:-}")"
DEFAULT_USERNAME_ESCAPED="$(js_escape "${VITE_DEFAULT_USERNAME:-}")"
DEFAULT_PASSWORD_ESCAPED="$(js_escape "${VITE_DEFAULT_PASSWORD:-}")"

# Write runtime environment config that the app can read via window.__ENV__
cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  APP_ENV: "${APP_ENV_ESCAPED}",
  VITE_DEFAULT_HOST_URL: "${DEFAULT_HOST_URL_ESCAPED}",
  VITE_DEFAULT_USERNAME: "${DEFAULT_USERNAME_ESCAPED}",
  VITE_DEFAULT_PASSWORD: "${DEFAULT_PASSWORD_ESCAPED}"
};
EOF

# Inject the env-config.js script tag into index.html before </head>
sed -i 's|</head>|<script src="/env-config.js"></script></head>|' /usr/share/nginx/html/index.html

echo "Starting prl-devops-ui [env=${APP_ENV}]"

exec "$@"
