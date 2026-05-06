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
DEFAULT_HOST_NAME_ESCAPED="$(js_escape "${VITE_DEFAULT_HOST_NAME:-}")"
DEFAULT_USERNAME_ESCAPED="$(js_escape "${VITE_DEFAULT_USERNAME:-}")"
DEFAULT_PASSWORD_ESCAPED="$(js_escape "${VITE_DEFAULT_PASSWORD:-}")"

# Write runtime environment config that the app can read via window.__ENV__
cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  APP_ENV: "${APP_ENV_ESCAPED}",
  VITE_DEFAULT_HOST_URL: "${DEFAULT_HOST_URL_ESCAPED}",
  VITE_DEFAULT_HOST_NAME: "${DEFAULT_HOST_NAME_ESCAPED}",
  VITE_DEFAULT_USERNAME: "${DEFAULT_USERNAME_ESCAPED}",
  VITE_DEFAULT_PASSWORD: "${DEFAULT_PASSWORD_ESCAPED}"
};
EOF
chmod 644 /usr/share/nginx/html/env-config.js

# Inject the env-config.js script tag into index.html before the app module script.
# Use awk here instead of sed range syntax because the alpine image uses busybox
# tooling and the previous sed command was not reliably portable.
if ! grep -q 'src="/env-config.js"' /usr/share/nginx/html/index.html; then
  TMP_HTML="$(mktemp)"
  if grep -q '<script type="module"' /usr/share/nginx/html/index.html; then
    awk '
      !inserted && /<script type="module"/ {
        print "    <script src=\"/env-config.js\"></script>"
        inserted = 1
      }
      { print }
    ' /usr/share/nginx/html/index.html > "$TMP_HTML"
  else
    awk '
      /<\/head>/ && !inserted {
        print "    <script src=\"/env-config.js\"></script>"
        inserted = 1
      }
      { print }
    ' /usr/share/nginx/html/index.html > "$TMP_HTML"
  fi
  mv "$TMP_HTML" /usr/share/nginx/html/index.html
  chmod 644 /usr/share/nginx/html/index.html
fi

echo "Starting prl-devops-ui [env=${APP_ENV}]"

exec "$@"
