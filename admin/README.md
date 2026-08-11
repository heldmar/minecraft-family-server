# Admin panel — MarNar's Minecraft Server

A small web panel for the two things that actually need doing: **letting people
in**, and **managing the world**. Everything else on this server is automated or
rare enough to be a runbook step.

Live at <https://minecraft-admin.example.net>, behind an NPM Access List.

---

## Shape

```
browser ──HTTPS──▶ Cloudflare ──▶ NPM (Access List: basic auth)
                                    │
                                    ▼
                            mc-admin container  (nginx, static SPA)
                                    │  /api/*  — nginx adds the bearer token here,
                                    │            so the browser never sees it
                                    ▼
                       marnar-mc-admin.service  (172.18.0.1:8788)
                          unprivileged user `mcadmin`, no docker access
                                    │  sudo, one allowed command
                                    ▼
                    /usr/local/sbin/marnar-mc-adminctl  (root)
                                    │
                          docker exec · rcon · backup/restore scripts
```

This mirrors an existing dashboard, already running on the same box, on purpose
— one pattern to understand instead of two.

## Why the agent cannot just run docker

`mcadmin` is deliberately **not** in the `docker` group, and sudo grants it
exactly one command. On this host, docker access is root access
(`docker run -v /:/host` ends the conversation), and this host also serves two
other live third-party sites. So the verb list at the bottom of
`marnar-mc-adminctl` is the complete set of things a compromise of the panel can
achieve. That indirection is the security model (S-9) — widening the sudoers
line to `docker` does not simplify it, it deletes it.

## Files

| Path | What |
|---|---|
| `ui/html/` | The SPA — three files, no build step |
| `ui/Dockerfile`, `ui/nginx.conf`, `ui/docker-entrypoint.sh` | nginx image; entrypoint writes `config.js` and the `/api` proxy at start |
| `ui/docker-compose.yml` | Deployed to `/home/mcadmin/stacks/mc-admin/` |
| `agent/mcadmin-agent.py` | Host agent, Python **stdlib only** (system Python is 3.9) |
| `agent/marnar-mc-admin.service` | systemd unit — read the NoNewPrivileges warning before editing |
| `agent/sudoers-mcadmin` | The privilege boundary |
| `../scripts/marnar-mc-adminctl` | The verbs |
| `install.sh` | Idempotent deploy; re-run it to ship changes |

## Deploying a change

```bash
./admin/install.sh          # rsync + rebuild + restart, from a checkout
```

Safe to re-run. The bearer token is generated once and reused, so redeploying
does not silently break the panel.

## Gotchas that cost time here

**`NoNewPrivileges` is set by more than `NoNewPrivileges=`.** Several hardening
directives imply it — `ProtectKernelTunables`, `LockPersonality`,
`RestrictSUIDSGID`, `SystemCallFilter` and others. With any of them, sudo fails
and every verb returns a permissions error while the unit file appears to say
the opposite. Check the live process, not the unit:

```bash
grep NoNewPrivs /proc/$(systemctl show marnar-mc-admin -p MainPID --value)/status
```

**systemd's sandbox is inherited by the sudo child.** `ProtectHome=true` and
`ProtectSystem=strict` do not only constrain the agent — they constrain
`marnar-mc-adminctl` running as root, which has to work under `/home/mcadmin`. With
them set, the panel reported a 0 MB world and no backups and **raised no error
at all**, because root inside that namespace genuinely could not see `/home`.

**Uploads stage in `/var/lib/marnar-mc-admin/uploads`, not under `/home/mcadmin`.**
That directory is mode 700; the agent user cannot traverse it, and
`os.path.exists()` returns `False` on EACCES, so the failure presents as a
bizarre attempt to create `/home/mcadmin`.

**Paper colours its console output.** `rcon-cli` returns ANSI escapes, so any
naive numeric parse picks up the escape's digits — `tps` reported `33` for a
healthy server, from the `33` in `ESC[33m`. `rcon()` strips them centrally.

## What it deliberately does not do

- **No user database.** Authentication is the NPM Access List, by decision.
- **No player data in Git.** The roster and audit log live on the server and
  ride along in the nightly backup (F-10a).
- **No typed confirmations.** One dialog, by decision. The safety net is
  server-side instead: destructive verbs take a backup first and *rename* the
  old world rather than deleting it, where a tired operator cannot skip it.
