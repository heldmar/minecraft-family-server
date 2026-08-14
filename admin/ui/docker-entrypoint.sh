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

# What players type to join. Shown on the Players screen so MarNar can read the
# address out to a friend without anyone opening a runbook.
#
# These are config, not facts the panel can discover: the agent talks to the
# container over RCON and has no idea what public hostname points at it. If the
# ingress ever changes (F-6/N-1, or Geyser moving off 19133), change it here —
# the panel will keep confidently displaying the old address otherwise.
SERVER_HOST="${SERVER_HOST:-minecraft.example.net}"
BEDROCK_PORT="${BEDROCK_PORT:-19133}"

# A PS5 cannot be given a server address at all — Sony provides no field for one
# — so consoles reach us by pointing their DNS at this box and picking the
# server out of BedrockConnect's menu (N-11a). That makes these two values the
# console's entire configuration, which is why they belong on screen next to the
# Bedrock address rather than only in SETUP-PS5.md.
#
# PS5_DNS_PRIMARY is the box's PUBLIC IP, not a hostname: the console asks it to
# resolve names, so it cannot itself be a name. Change it if the instance is
# ever rebuilt or its ephemeral IP is replaced.
#
# The secondary is deliberately a general-purpose resolver. mc-dns answers only
# for Minecraft's featured-server names and refuses everything else on purpose,
# so without a working secondary the console loses internet for the store,
# streaming and every other game.
PS5_DNS_PRIMARY="${PS5_DNS_PRIMARY:-198.51.100.20}"
PS5_DNS_SECONDARY="${PS5_DNS_SECONDARY:-1.1.1.1}"

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
  API_TOKEN: "${CONFIG_TOKEN}",
  SERVER_HOST: "${SERVER_HOST}",
  BEDROCK_PORT: "${BEDROCK_PORT}",
  PS5_DNS_PRIMARY: "${PS5_DNS_PRIMARY}",
  PS5_DNS_SECONDARY: "${PS5_DNS_SECONDARY}"
};
EOF

cat > "$PROXY_PATH" <<EOF
location /api/ {
    proxy_pass ${API_UPSTREAM}/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    # \$remote_addr is the real client, not NPM: nginx.conf's set_real_ip_from
    # rewrites it before this runs. Do not "simplify" that away — the agent puts
    # this value straight into the audit log as who took the action.
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

echo "mcadmin-ui: wrote $CONFIG_PATH (API_BASE_URL=${API_BASE_URL}, SERVER_HOST=${SERVER_HOST}:${BEDROCK_PORT})"
echo "mcadmin-ui: wrote $PROXY_PATH (/api/ -> ${API_UPSTREAM})"
