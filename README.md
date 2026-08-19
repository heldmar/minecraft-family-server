# MarNar Minecraft

Private, invitation-only Minecraft server for MarNar and his friends, hosted on a small cloud
box and reachable at `minecraft.example.net`.

**Free to play, closed to the public.** No payments are collected; access is by explicit
allowlist only.

## Status

🟢 **Built, running, and played on by MarNar and his friends.** The proving
session was **2026-08-15**: four players together for about 70 minutes — MarNar on
the iPad and three friends on PS5 — with **no tick lag logged at all**. Play has
continued daily since. iPad and PS5 in the same world, which was the whole point.

The server is live and reachable from the internet on all three paths (Java,
Bedrock direct, and the console path). The nightly restart and the allowlist
tooling are in place. World pre-generation is **finished** — all three
dimensions reached 100% (overworld 39m46s, Nether 29s, End 5m39s).

**Latency is settled (Q-11).** The only symptom anyone reports is a few seconds'
lag when first connecting in a session, which clears on its own. On the strength
of that the player target went **4 → 6** on 2026-08-19; two more friends can be
added to the roster.

✅ **The world is backed up, on and off the box.** Local archives in
`/home/mcadmin/backups/minecraft/`, plus a weekly off-site copy to Amazon S3 that
was proven by restoring it (`marnar-mc-offsite`, O-4a). It uploads only when
somebody has actually played, so a quiet week costs nothing — about **$0.014 a
month** all in. See [`docs/RUNBOOK.md`](docs/RUNBOOK.md) §5b.

> ## ⚠️ The PS5 needs PlayStation Plus — the player's, not ours
>
> **Minecraft on PS4/PS5 requires an active PS Plus subscription for online
> multiplayer, third-party servers included.** Verified 2026-08-11 after a real
> connection attempt. It is Sony's gate; there is no server-side fix.
>
> This is a **per-player** prerequisite, which is what makes it survivable.
> Helder holds no subscription and will not buy one, so **MarNar plays from the
> iPad** — but friends whose families already have PS Plus can join from their
> own consoles, and on 2026-08-11 it was confirmed that some do. The console
> path therefore stays built and supported: `bedrock-connect`, `mc-dns` and
> port 53 are **in use**, not vestigial. See
> [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) §7.1 / N-18, and
> [`docs/SETUP-PS5.md`](docs/SETUP-PS5.md) for the console guide.

**Adding a friend works.** It is worth knowing why it needs two tries in the
worst case: GeyserMC's gamertag→XUID lookup only answers for players it has
already seen connect, so a genuinely new friend cannot be resolved by name. If
the normal add does not take, the sync resolves the gamertag independently and
adds them by Floodgate UUID, reporting exactly what happened either way. The
route that always works and depends on nobody: **have them try to join once,
get turned away, then run the sync** — the attempt itself is what makes them
resolvable. See [`docs/RUNBOOK.md`](docs/RUNBOOK.md) §3c.

The allowlist was commissioned **on, enforced and empty**, including for MarNar,
so there was never a window where the server was reachable and open. Add
gamertags in the [admin panel](admin/README.md).

The players can also change **how the world plays** — difficulty, keeping your
items when you die, phantoms, whether one sleeper skips the night — from the
panel's *How we play* section, without an operator and without losing the
world. That separation is deliberate: everything they asked to control is a
live setting, so none of it should cost them their builds. Making a new world
stays a separate, destructive operation. See F-12 and
[`docs/RUNBOOK.md`](docs/RUNBOOK.md) §3e — which also carries the two traps MC
26.2 introduced, since gamerules are now **per-dimension** and renamed to
snake_case, and the obvious one-line write silently changes only the overworld.

When a new world *is* the point, that form now asks what kind: **normal, flat or
large biomes**, and structures on or off, alongside the seed and the border. It
is still the one button that destroys a world, so it is gated behind typing
`NUEVO`, and the size the panel accepts is capped well below what the shell tool
allows — pre-generation cost grows with area, not with width. See F-12a and
§3f.

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
- **Target:** 6 concurrent players (was 4, itself cut from 8 to fit a shared single vCPU; raised 2026-08-19 on measured evidence — the 1 vCPU constraint is unchanged and 8 stays abandoned)
- **PS5:** requires self-hosted BedrockConnect on port 53 — PS5 cannot type a server address

### How to connect, by platform

| Platform | Address | Port |
|---|---|---|
| **PS5** *(needs the player's own PS Plus)* | set console DNS to `198.51.100.20`, secondary `1.1.1.1` | — |
| iPad, phone, Bedrock on PC | `minecraft.example.net` | **19133** |
| Java Edition on PC | `minecraft.example.net` | *none needed* |

The PS5 has no field for a server address at all, so it is pointed here by DNS
and picks the server out of BedrockConnect's menu. The secondary resolver is not
optional: `mc-dns` answers only for Minecraft's featured-server names, so
without it the console loses internet for everything else.

⚠️ Bedrock is on **19133**, not the default 19132. BedrockConnect has to own
19132 because consoles hard-code it, so Geyser moved one along. PS5 is
unaffected — it never types an address.

### Administering it

**<https://minecraft-admin.example.net>** — add and remove players, take and
restore backups, import or regenerate the world. Authentication is an NPM Access
List; there is no user database, by decision. See [`admin/`](admin/README.md).

✅ Live since 2026-08-11 — NPM proxy host id 8, Access List 1, 401 to anyone
without the credential. Bilingual **ES / EN**, and written for its actual reader:
MarNar, who is 12. Every section carries an expandable *"¿Qué es esto?"* meant to
teach the concept, not label the button. See
[`docs/REQUIREMENTS-ADMIN-R2.md`](docs/REQUIREMENTS-ADMIN-R2.md).

> ⚠️ **Local backups do not run on a schedule.** Since 2026-08-11 a local copy is
> made only when the button is pressed, and automatically just before anything
> destructive. `marnar-mc-backup.timer` is disabled on purpose — do not re-enable
> it without asking. **The one scheduled backup on the box is the weekly off-site
> copy to S3** (O-4a, Sundays 04:07), which exists because an off-site copy nobody
> remembers to press is not an off-site copy.

> 🔒 **The S3 bucket is secret-bearing.** The archives contain `.rcon-cli.env` and
> `plugins/floodgate/key.pem`, so `my-minecraft-backups` must stay private —
> verified 2026-08-19 that anonymous reads and listings both return 403. The box's
> IAM key can write to it but **cannot delete from it**, so a compromised server
> cannot destroy the backups that would rescue it.

> ⚠️ **This repository is load-bearing for disaster recovery.** The four stacks
> live *here only* — they are deliberately not mirrored into another
> repo, so that two copies cannot drift apart. The server cannot be rebuilt from
> the host's own repo alone; whoever rebuilds it has to pull the stacks from here.

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
  marnar-mc-backup           ← world backup, on demand (timer disabled, C-1)
  marnar-mc-offsite          ← weekly off-site copy to S3 (systemd timer, Sun 04:07)
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
