#!/bin/sh
set -e

# Validate APP_ENV value
APP_ENV="${APP_ENV:-production}"
case "$APP_ENV" in
  production|canary|beta|development) ;;
  *)
    echo "Warning: unknown APP_ENV value '$APP_ENV', defaulting to 'production'"
    APP_ENV="production"
    ;;
esac

# Write runtime environment config that the app can read via window.__ENV__
cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  APP_ENV: "${APP_ENV}"
};
EOF

# Inject the env-config.js script tag into index.html before </head>
sed -i 's|</head>|<script src="/env-config.js"></script></head>|' /usr/share/nginx/html/index.html

echo "Starting prl-devops-ui [env=${APP_ENV}]"

exec "$@"
