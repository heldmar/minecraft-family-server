#!/bin/sh
# Write the runtime config and the API proxy at container start, so a single
# image targets any host without a rebuild. Mirrors an existing dashboard
# entrypoint already running on this box.
set -e

CONFIG_PATH="/usr/share/nginx/html/config.js"
PROXY_PATH="/etc/nginx/mcadmin-api-proxy.conf"

API_BASE_URL="${API_BASE_URL:-/api}"
API_UPSTREAM="${API_UPSTREAM:-http://172.18.0.1:8788}"
API_UPSTREAM="${API_UPSTREAM%/}"
API_TOKEN="${API_TOKEN:-}"

# Where the bearer token lives depends on the mode, and the difference is not
# cosmetic:
#
#   proxy mode  (API_BASE_URL starts with "/") — nginx adds the Authorization
#     header itself, so the token never reaches the browser. Anything reachable
#     from the internet must use this. The only thing standing between a
#     visitor and the API is then NPM's Access List, which is the intent.
#
#   direct mode (API_BASE_URL is a full URL) — the browser has to send the
#     token, so it goes into config.js where anyone who loads the page can read
#     it. LAN debugging only.
CONFIG_TOKEN=""
PROXY_AUTH=""
case "$API_BASE_URL" in
  /*) [ -n "$API_TOKEN" ] && PROXY_AUTH="proxy_set_header Authorization \"Bearer ${API_TOKEN}\";" ;;
  *)  CONFIG_TOKEN="$API_TOKEN" ;;
esac

cat > "$CONFIG_PATH" <<EOF
window.__MCADMIN_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}",
  REFRESH_SECONDS: ${REFRESH_SECONDS:-20},
  API_TOKEN: "${CONFIG_TOKEN}"
};
EOF

cat > "$PROXY_PATH" <<EOF
location /api/ {
    proxy_pass ${API_UPSTREAM}/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    ${PROXY_AUTH}
    # World generation runs for ~45 minutes, but it is a background job that the
    # UI polls — no single request is long. These cover uploads and the poll.
    proxy_read_timeout 300s;
    proxy_send_timeout 600s;
    client_max_body_size 2g;
}
EOF

echo "mcadmin-ui: wrote $CONFIG_PATH (API_BASE_URL=${API_BASE_URL})"
echo "mcadmin-ui: wrote $PROXY_PATH (/api/ -> ${API_UPSTREAM})"
