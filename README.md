# MarNar Minecraft

Private, invitation-only Minecraft server for MarNar and his friends, hosted on a small cloud
box and reachable at `minecraft.example.net`.

**Free to play, closed to the public.** No payments are collected; access is by explicit
allowlist only.

## Status

🟢 **Built and running. Not yet opened to players.**

The server is live and reachable from the internet on all three paths (Java,
Bedrock direct, and the console path). Backups, the nightly restart and the
allowlist tooling are in place. World pre-generation is in progress.

Two things stand between here and inviting people:

1. **Nobody is on the allowlist yet** — deliberately. The server was
   commissioned with the allowlist on and enforced and empty, including MarNar,
   so there was never a window where it was reachable and open. Add gamertags
   in the [admin panel](admin/README.md).
2. **The PS5 path has never been walked on an actual PS5.** Every component is
   verified independently; the end-to-end run needs a console.

Start here: **[`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)** for what was
asked for and why, **[`docs/RUNBOOK.md`](docs/RUNBOOK.md)** for operating it.

**For players:** [`docs/SETUP-PS5.md`](docs/SETUP-PS5.md) ·
[`docs/SETUP-IPAD-Y-PC.md`](docs/SETUP-IPAD-Y-PC.md) *(both in Spanish, written
for the other parents)*

## Shape of the thing

- **Host:** a small ARM cloud VM — static public IP `198.51.100.20`, 1 vCPU / 6 GB
- **Server:** PaperMC (Java Edition) + GeyserMC + Floodgate, in Docker
- **Why not the official Bedrock server:** it is x86_64-only; the host is `aarch64`
- **Players:** PS5, iPad and PC Bedrock via Geyser; PC Java Edition natively — one shared world
- **Target:** 4 concurrent players (cut from 8 to fit a shared single vCPU)
- **PS5:** requires self-hosted BedrockConnect on port 53 — PS5 cannot type a server address

### How to connect, by platform

| Platform | Address | Port |
|---|---|---|
| PS5 (and Xbox/Switch if they hide "Add server") | *not typed* — set console DNS to `198.51.100.20` | — |
| iPad, phone, Bedrock on PC | `minecraft.example.net` | **19133** |
| Java Edition on PC | `minecraft.example.net` | *none needed* |

⚠️ Bedrock is on **19133**, not the default 19132. BedrockConnect has to own
19132 because consoles hard-code it, so Geyser moved one along. PS5 is
unaffected — it never types an address.

### Administering it

**<https://minecraft-admin.example.net>** — add and remove players, take and
restore backups, import or regenerate the world. Authentication is an NPM Access
List; there is no user database, by decision. See [`admin/`](admin/README.md).

✅ Live since 2026-08-11 — NPM proxy host id 8, Access List 1, 401 to anyone
without the credential.

## Why not the Pi

The Pi was the original choice and the plan was fully written against it. It was abandoned on
2026-08-10 because **nothing inbound from the internet reaches it**. CGNAT, double NAT, ISP port
blocking and host firewalling were each ruled out by measurement; the router appears not to apply
port-forwarding rules it displays as Enabled, and it has no local admin interface to debug.
Full diagnostic table in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) §4.2.

## Related projects on this machine

| Project | Relationship |
|---|---|
| The host | This project is a **tenant** — it follows the host's stack, pinning and SELinux rules. |
| A Raspberry Pi homelab | Evaluated as host and **rejected**; no longer involved. |

## Repository layout

```
docs/
  REQUIREMENTS.md      ← requirements, decision log, open questions
  RUNBOOK.md           ← operating it: health, backups, rollback, known traps
  SETUP-PS5.md         ← player-facing, Spanish
  SETUP-IPAD-Y-PC.md   ← player-facing, Spanish
admin/
  README.md            ← the panel: architecture, deploy, and the traps it cost
  ui/                  ← static SPA + nginx image, no build step
  agent/               ← host agent (Python stdlib), systemd unit, sudoers
  install.sh           ← idempotent deploy
stacks/
  minecraft/           ← Paper + Geyser + Floodgate      TCP 25565, UDP 19133
  bedrock-connect/     ← the menu consoles land in       UDP 19132
  mc-dns/              ← non-recursive DNS redirect      UDP/TCP 53
scripts/
  marnar-mc-adminctl         ← the privileged verbs the admin panel may invoke
  marnar-mc-backup           ← daily world backup (systemd timer, 04:00)
  marnar-mc-restart          ← nightly JVM bounce (systemd timer, 05:00)
  marnar-mc-restore-test     ← proves a backup boots, without touching the live world
  marnar-mc-sync-players     ← applies the on-server roster to the whitelist
  marnar-mc-dns-ratelimit    ← per-source rate limit on port 53
  raknetping.py / amptest.py / ratetest.py  ← the verifications, kept so they can be re-run
```

Everything under `stacks/*/data/` is gitignored — worlds and generated config
live on the server, and `.env` (RCON password) is never committed.

**Player data is deliberately not in this repository.** The roster and the audit
log of who was added or removed live at
`/home/mcadmin/stacks/minecraft/roster/` on the server and ride along in the nightly
backup. This repo describes how to *build* the server; who currently plays on it
is usage data about a handful of children, and does not belong in something
whose value is being copyable (F-10a).
