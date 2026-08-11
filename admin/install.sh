#!/bin/bash
# Install the admin panel on the server. Idempotent — safe to re-run
# after editing the UI or the agent, which is how updates are deployed.
#
# Run FROM the repo checkout:  ./admin/install.sh
# It rsyncs to the box and then does the privileged parts over ssh.
set -euo pipefail

HOST=${HOST:-mcserver}
REPO=$(cd "$(dirname "$0")/.." && pwd)
STACK=/home/mcadmin/stacks/mc-admin

echo "==> shipping files to $HOST"
# rsync will not create intermediate directories, and a first install has none.
ssh "$HOST" "mkdir -p $STACK/src /tmp/mcadmin"
rsync -a --delete "$REPO/admin/ui/" "$HOST:$STACK/src/"
rsync -a "$REPO/admin/ui/docker-compose.yml" "$HOST:$STACK/docker-compose.yml"
rsync -a "$REPO/admin/agent/mcadmin-agent.py" \
         "$REPO/admin/agent/marnar-mc-admin.service" \
         "$REPO/admin/agent/sudoers-mcadmin" "$HOST:/tmp/mcadmin/"
rsync -a "$REPO/scripts/marnar-mc-adminctl" \
         "$REPO/scripts/marnar-mc-sync-players" "$HOST:/tmp/mcadmin/"

ssh "$HOST" 'sudo bash -s' <<'REMOTE'
set -euo pipefail
STACK=/home/mcadmin/stacks/mc-admin

# --- unprivileged service account ------------------------------------------
# No shell, no home, and deliberately NOT in the docker group: docker group
# membership is root-equivalent on this host, and this host runs two live
# other sites. Escalation is via one sudoers line and nothing else.
id mcadmin &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin mcadmin

# --- privileged verb dispatcher + sync -------------------------------------
install -o root -g root -m 0755 /tmp/mcadmin/marnar-mc-adminctl     /usr/local/sbin/
install -o root -g root -m 0755 /tmp/mcadmin/marnar-mc-sync-players /usr/local/sbin/

# --- agent ------------------------------------------------------------------
install -o root -g root -m 0755 /tmp/mcadmin/mcadmin-agent.py /usr/local/bin/

# visudo -c validates BEFORE the file is in place; a malformed sudoers file can
# lock the box out of sudo entirely, and this box has no password SSH fallback.
install -o root -g root -m 0440 /tmp/mcadmin/sudoers-mcadmin /etc/sudoers.d/.mcadmin.new
if visudo -c -f /etc/sudoers.d/.mcadmin.new; then
  mv /etc/sudoers.d/.mcadmin.new /etc/sudoers.d/mcadmin
else
  rm -f /etc/sudoers.d/.mcadmin.new
  echo "FATAL: sudoers file did not validate; nothing changed" >&2
  exit 1
fi

# --- shared secret ----------------------------------------------------------
# One token, two consumers: the agent verifies it, the UI container's nginx
# injects it. Generated once and reused on re-runs, so redeploying does not
# silently break the panel.
mkdir -p /etc/marnar-mc-admin
if [ ! -f /etc/marnar-mc-admin/agent.env ]; then
  TOKEN=$(head -c 32 /dev/urandom | base64 | tr -d '=+/' | cut -c1-40)
  printf 'MCADMIN_TOKEN=%s\nMCADMIN_HOST=172.18.0.1\nMCADMIN_PORT=8788\n' "$TOKEN" \
    > /etc/marnar-mc-admin/agent.env
fi
chown root:mcadmin /etc/marnar-mc-admin/agent.env
chmod 0640 /etc/marnar-mc-admin/agent.env
TOKEN=$(sed -n 's/^MCADMIN_TOKEN=//p' /etc/marnar-mc-admin/agent.env)

printf 'API_TOKEN=%s\n' "$TOKEN" > "$STACK/.env"
chown mcadmin:mcadmin "$STACK/.env"
chmod 0600 "$STACK/.env"

# --- runtime directories the agent and adminctl need ------------------------
install -d -o mcadmin -g mcadmin -m 0755 /home/mcadmin/stacks/minecraft/roster
# Uploads stage in /var/lib, NOT under /home/mcadmin — that is mode 700 and the
# agent user cannot traverse it.
install -d -o mcadmin -g mcadmin -m 0755 /var/lib/marnar-mc-admin/uploads
rmdir /home/mcadmin/stacks/minecraft/uploads 2>/dev/null || true

# --- service ----------------------------------------------------------------
install -o root -g root -m 0644 /tmp/mcadmin/marnar-mc-admin.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now marnar-mc-admin
systemctl restart marnar-mc-admin

rm -rf /tmp/mcadmin
REMOTE

echo "==> building and starting the UI container"
ssh "$HOST" "cd $STACK && docker compose up -d --build"

echo "==> done. Remaining manual step: the NPM proxy host + Access List for"
echo "    minecraft-admin.example.net -> mc-admin:80"
