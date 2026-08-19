# Runbook — MarNar Minecraft

Operator-facing. For player-facing instructions see [SETUP-PS5.md](SETUP-PS5.md)
and [SETUP-IPAD-Y-PC.md](SETUP-IPAD-Y-PC.md).

Requirement IDs refer to [REQUIREMENTS.md](REQUIREMENTS.md).

---

## 1. What is where

| Thing | Location |
|---|---|
| Host | A cloud VM, `198.51.100.20`, `ssh mcserver` (over an SSH tunnel; port 22 is closed) |
| Stacks | `/home/mcadmin/stacks/{minecraft,bedrock-connect,mc-dns,mc-admin}/` |
| World | `/home/mcadmin/stacks/minecraft/data/` |
| Roster + audit log | `/home/mcadmin/stacks/minecraft/roster/` (**not** in Git — F-10a) |
| Backups | `/home/mcadmin/backups/minecraft/{daily,weekly}/` — **on demand only**, see §5 |
| Scripts | `/usr/local/sbin/marnar-mc-*` |
| Admin UI | <https://minecraft-admin.example.net> · agent `marnar-mc-admin.service` |
| Timers | `marnar-mc-restart.timer` (05:00). ⛔ `marnar-mc-backup.timer` is **disabled on purpose** — §5 |

Three containers, and it is worth knowing which does what before touching any of
them:

- **`minecraft`** — Paper + Geyser + Floodgate. The actual game. TCP 25565
  (Java), UDP **19133** (Bedrock).
- **`bedrock-connect`** — the menu a console lands in. UDP **19132**.
- **`mc-dns`** — CoreDNS, answers the six Minecraft "featured server" hostnames
  with our own address. UDP/TCP 53.

The PS5 path needs all three. Java players only need `minecraft`.

---

## 2. Health check (O-7)

```bash
ssh mcserver '
docker ps --format "{{.Names}}\t{{.Status}}" | grep -E "minecraft|bedrock-connect|mc-dns"
docker exec minecraft rcon-cli "tps"
docker exec minecraft rcon-cli "list"
'
```

From off the box, the two that actually prove reachability:

```bash
# should print 198.51.100.20
dig +short @198.51.100.20 hivebedrock.network

# should print the server MOTD
python3 scripts/raknetping.py
```

TPS below 18 sustained is the escalation trigger (P-7). One dip during chunk
generation is not.

**If it is sustained**, in order of least disruption: drop `VIEW_DISTANCE` to 4
and `SIMULATION_DISTANCE` to 3 · lower `cpu_shares` so Minecraft yields harder
to the other sites · cut `MAX_PLAYERS` to 2–3 · disable the End.

> ⛔ **Do not propose resizing the instance.** It is permanently ruled out
> (P-9a), not a contingency. Stopping the instance risks an out-of-capacity
> availability domain leaving it unable to boot, which takes the other live
> sites down indefinitely. The player count was cut 8 → 4 to buy out exactly
> this risk. If 4 players is too tight, the server gets smaller — not the box
> bigger.

---

## 3. Adding or removing a player (F-10, A-1)

The allowlist is **on and enforced**, and was deliberately commissioned
**empty** — nobody can join until added, including MarNar. This is the intended
state, not a misconfiguration.

**Normally you do this in the admin UI**: <https://minecraft-admin.example.net> →
*Jugadores* / *Players* → fill in platform, gamertag, who they are. It writes the
roster, syncs the server and records the change in one step. Removing someone is
the **Quitar** / **Remove** button on their row, which also kicks them if they
are online.

> The panel is **bilingual** since 2026-08-11 (R2): the **ES / EN** switch is in
> the top-right, and the choice is remembered per browser in `localStorage`
> (`mcadmin.lang`), so screenshots and labels in these docs may be in either
> language. Spanish is the fallback for anything untranslated. Every section
> also has an expandable **"¿Qué es esto?" / "What is this?"** written for a
> twelve-year-old — that is the intended audience for the whole panel now, so
> **keep new copy plain and explain the concept, not the button**. See
> [REQUIREMENTS-ADMIN-R2.md](REQUIREMENTS-ADMIN-R2.md).

The roster is **`/home/mcadmin/stacks/minecraft/roster/allowlist.txt` on the
server** — deliberately **not** in this repo. The repo is a generic server
build; who plays is usage data (F-10a). It rides along in the world backup —
which, since 2026-08-11, only happens when someone asks for one (§5).

By hand, if the UI is down:

```bash
ssh mcserver
sudo vi /home/mcadmin/stacks/minecraft/roster/allowlist.txt   # one line per player:
#   bedrock  TheirXboxGamertag   # Who they are — PS5
#   java     TheirMinecraftName  # Who they are — PC
sudo marnar-mc-sync-players --dry-run                     # check, then drop --dry-run
```

The sync removes anyone on the server who is not in the file, and kicks them if
they are online.

Two things to get right, both of which fail the same confusing way — a generic
"not white-listed" kick with nothing useful in the log:

- **Bedrock players need their Xbox/Microsoft gamertag**, not their PlayStation
  name. These are usually different and only the Xbox one works.
- **The platform column matters.** `bedrock` uses Floodgate's `fwhitelist`,
  `java` uses plain `whitelist`. The wrong one creates an entry that never
  matches anybody.

Do not type the leading dot Bedrock players show with in-game (`.MarNar`) —
Floodgate adds it, and the sync compares both forms.

⚠️ Because the file is authoritative, anyone added by hand over RCON is removed
at the next sync. That is intended. `--dry-run` shows exactly what would change.

If the UI shows someone as **sin sincronizar**, they are on the roster but the
server's `whitelist.json` does not have them — they will get a plain "not
white-listed" kick with nothing useful in the log. Press **Sincronizar**. If
they are *still* rejected after that, the sync itself is failing and §3c is the
place to go, not DNS.

---

## 3b. The admin panel (F-10b, S-9)

<https://minecraft-admin.example.net> — NPM Access List for the login, then two
sections: **Jugadores** and **Mundo**, plus **Actividad** (audit log + server
console).

Three moving parts:

| Part | Where |
|---|---|
| UI container | `mc-admin`, `/home/mcadmin/stacks/mc-admin/`, on `npm-network` |
| Host agent | `marnar-mc-admin.service`, listens on `172.18.0.1:8788` |
| Privileged verbs | `/usr/local/sbin/marnar-mc-adminctl` (root), via sudoers |
| Edge | NPM proxy host **id 8** + a proxied `CNAME minecraft-admin → stack.example.net` |

**The panel shows someone else's page, or a "Default Site" placeholder** → this
is a DNS fault, not an NPM one. `*.example.net` falls through to **another host's
tunnel**, so any hostname on that zone without its own record is answered by a
different machine entirely. Do not try to diagnose this by checking that the
name resolves to the right Cloudflare IPs — **every** proxied name on the zone
returns the same Cloudflare IPs, so that test passes in both cases. Use a
control instead:

```bash
curl -sI https://minecraft-admin.example.net/       | head -3
curl -sI https://zzz-nonexistent-probe.example.net/ | head -3   # known-nonsense
```

Identical responses mean the wildcard is answering and the record is missing.
Same trap as N-2 for `minecraft-public`; it recurs for every new hostname.

```bash
ssh mcserver 'systemctl status marnar-mc-admin --no-pager; docker ps | grep mc-admin'
ssh mcserver 'journalctl -u marnar-mc-admin -n 50 --no-pager'
```

**Panel loads but everything says "Sin conexión al agente"** → the agent is
down, or its bearer token no longer matches. The token lives in two places and
they must be identical: `MCADMIN_TOKEN` in `/etc/marnar-mc-admin/agent.env`, and
`API_TOKEN` in `/home/mcadmin/stacks/mc-admin/.env`. Neither is in Git.

**Every verb fails with a permissions error** → check `NoNewPrivileges` in
`marnar-mc-admin.service` is **false**. It is `true` on every other service on
this box, and copying that here silently breaks sudo, which is the agent's only
way to do anything.

> ⛔ **Never put `mcadmin` in the `docker` group**, and never widen the sudoers
> entry to `docker`. Both are root on this host, which also runs two live
> other sites. The fixed verb list in `marnar-mc-adminctl` is the entire
> security model (S-9) — if the agent can run docker directly, there isn't one.

**The audit log shows `172.18.0.x` instead of a person** → the agent records
whatever arrives in `X-Real-IP` as who took the action, and a container address
means the real client was lost somewhere upstream. Two hops can lose it, and
they were both broken until 2026-08-14:

1. **NPM** read `X-Real-IP`, which Cloudflare does not send — it sends
   `CF-Connecting-IP`. Fixed at the reverse proxy; affects all 8 proxy hosts.
2. **Our own container** overwrote the value with `$remote_addr`, which inside
   `mc-admin` is NPM's address. Fixed by `set_real_ip_from 172.18.0.0/16` +
   `real_ip_header X-Real-IP` in the `server` block of `admin/ui/nginx.conf`.

> ⚠️ **That trust line is only safe while `mc-admin` publishes no ports and sits
> on `npm-network` alone** — nothing outside Docker can then open a connection to
> it and forge the header. Re-check it if a `ports:` mapping or a second network
> is ever added, **or if a new container joins `npm-network`**: anything on that
> bridge can reach `mc-admin:80` directly and claim to be any client it likes.

Verify with the recorded address, never with a 200 — the panel looks identical
either way. Load the panel in a browser, then
`ssh mcserver 'sudo journalctl -u marnar-mc-admin -n 5 --no-pager'` and compare
against `ifconfig.me`. Confirmed working end to end 2026-08-14.

Expect an **IPv6** address from a home connection. Those are usually
privacy-extension addresses that rotate about daily, so a log line identifies a
household, not a device, and two entries a week apart cannot be assumed to be
the same person. If a per-IP limit is ever added here it must key on the **/64**,
not the full address — `$binary_remote_addr` alone is an IPv4-shaped answer that
a v6 client sidesteps by rotating.

**A world operation is stuck.** They are jobs; only one runs at a time. Watch it
directly:

```bash
ssh mcserver 'docker logs -f minecraft'
```

Chunky reports progress every 120 seconds during pre-generation. Polling faster
than that looks exactly like a stall and is not one.

---

## 3c. Player added but still rejected (A-1)

Symptom: someone is on the roster, the panel shows them **sin sincronizar /
not synced**, and in game they get **"You are not whitelisted on this
server!"**. First seen 2026-08-11 with `examplegamertag` on an iPad.

**Do not start with DNS or ports.** There is a check that tells the two apart in
one step — look for the player in the server log:

```bash
ssh mcserver 'sudo grep -i THEIRGAMERTAG /home/mcadmin/stacks/minecraft/data/logs/latest.log | tail -20'
```

If you see them **connect and then get kicked**, like this:

```
[Geyser-Spigot] Player connected with username examplegamertag (2168)
[Geyser-Spigot] examplegamertag (logged in as: examplegamertag) has connected to the Java server
[Geyser-Spigot] examplegamertag has disconnected from the Java server because of You are not whitelisted on this server!
```

…then **DNS, the port, Geyser and Floodgate all worked**. The packet arrived and
the player authenticated. The only thing that rejected them is the allowlist, so
nothing in §2, §3b or the DNS notes is worth touching. If instead the log shows
**nothing at all** for that gamertag, they never reached the server and it *is*
an addressing fault — go to §2.

**Why the add silently failed.** `fwhitelist add <gamertag>` has to turn the
Xbox gamertag into an XUID first, and it does that through **GeyserMC's public
API**, not locally. When that lookup cannot answer, the command does nothing and
**returns an empty string** — no error, no non-zero exit. The real reason is
only in the server log:

```
[floodgate] Got an error from requesting the xuid of a Bedrock player:
Unable to find user in our cache. Please try specifying their Floodgate UUID instead
```

Since 2026-08-11 `marnar-mc-sync-players` **verifies every add against
`whitelist.json` afterwards**, and when the normal add did not land it tries a
second route by itself (below) before exiting 1 with that log excerpt. So this
should announce itself rather than being found by a child who cannot get in.
Before that fix it printed `+ examplegamertag (bedrock)` and exited clean while the
allowlist stayed empty.

### ⚠️ GeyserMC only knows gamertags that have already connected

This is the root cause, and it is not an outage — it is how the endpoint works.
**Re-measured 2026-08-11:**

| Gamertag | Result |
|---|---|
| `Notch`, `examplegamertag` | **200**, resolved |
| `Dinnerbone`, `jeb_`, `CaptainSparklez` — all real accounts | **503** "Unable to find user in our cache" |
| `qzzxwvyu9911` — does not exist | **503**, *the same answer* |
| a name longer than 16 chars | **400** "gamertag is empty or longer than 16 chars" |

Two things follow, and both correct what this section said earlier:

- **A 503 tells you nothing about whether the gamertag is real.** A nonexistent
  name and a perfectly good one give the identical response. Do not read 503 as
  "the service is down" or as "the name is fine".
- **400 is a length/format rejection only**, not a general "invalid gamertag".

**So every genuinely new friend fails the first add**, by design, and `Notch` is
a useless control — it passes because it is cached, which is exactly the state
your new player is not in.

### The fix that needs nobody's help: have them try once

**Observed 2026-08-11:** `examplegamertag` returned 503 to repeated lookups all
afternoon, and returned 200 immediately after he actually connected. Looking a
name up does not put it in GeyserMC's cache; **a connection attempt does** — and
it does not have to be a successful one, since Geyser sees the player before the
allowlist rejects them. So:

1. Ask the player to try to join **once**. They will be told *"You are not
   whitelisted on this server"*. That is expected — it is the point.
2. Run the sync again. The normal `fwhitelist add <gamertag>` now works.

This is the first thing to try. It costs one message to a parent, needs no
third-party service, and the identity comes from the player's own connection.

*Evidence note: this is one player's before-and-after, not a controlled test.
It is recorded because the "before" was repeated and stable and the connection
was the only intervening event.*

### The automatic fallback, and its limits

If the first add still fails, the sync now resolves the gamertag itself through
**playerdb.co**, which queries Xbox Live directly rather than serving a cache,
and adds the player by Floodgate UUID. This is automatic — the paragraphs below
describe what it is doing, and are also the manual procedure if you need it.

⚠️ **playerdb rate-limits hard, and not per-caller.** Measured 2026-08-11: the
third request in quick succession returned `429 "Xbox Live API rate limit
exceeded"`, and it stayed 429 for **over twenty minutes** before recovering on
its own. The sync reports a 429 as *"wait a few minutes and run the sync
again"*, explicitly not as a bad gamertag, and it makes at most one control
request plus one per player being added. **Treat this route as best-effort**;
the connect-once route above is the reliable one.

Java players are unaffected by all of this — `whitelist add` uses Mojang's
lookup instead.

### Doing it by hand: add them by Floodgate UUID

This is what the fallback automates, and the route that **worked on 2026-08-11**
— MarNar was playing within minutes of it. It skips the gamertag lookup entirely.

**Do not bother with Geyser's `debug-mode`.** It looks like the obvious way to
capture the XUID from the player's own handshake and it is not: with
`debug-mode: true` the connection attempt logs `Is player data signed? true` and
the packet trace, but **never the XUID**. Paper also rejects the player before
it caches anything, so `usercache.json` and `world/playerdata` both stay empty
no matter how many times they try. That dead end cost an hour; skip it.

Resolve the gamertag through a second, independent source instead:

```bash
curl -s https://playerdb.co/api/player/xbox/THEIRGAMERTAG   # data.player.id is the XUID
```

⚠️ **Check any such source against a control before trusting it.** Ask it for a
gamertag whose XUID you can verify elsewhere and compare exactly:

```bash
curl -s https://playerdb.co/api/player/xbox/Notch          # -> 2535453759792258
curl -s https://api.geysermc.org/v2/xbox/xuid/Notch        # -> 2535453759792258
```

Those matched on 2026-08-11, which is what made playerdb's answer for
`examplegamertag` usable. Two sources agreeing on a third-party value is the
evidence; "it returned a plausible-looking number" is not. The sync runs this
same control once per invocation and refuses the fallback entirely if it
disagrees — the point is to catch the service answering with a placeholder or
somebody else's id, which a "looks like a number" check would pass.

⚠️ **A round trip through GeyserMC is not available as a second opinion.** Its
reverse endpoint `/v2/xbox/gamertag/<xuid>` is backed by the same cache: it
returns 200 for `2535453759792258` (`Notch`) and 503 for an uncached id. So it
can only confirm players you did not need to look up. Measured 2026-08-11.

Turn the XUID into a Floodgate UUID — it is just the XUID as the low bits of an
otherwise-zero UUID:

```bash
python3 -c "xuid=2535453759792258; h=format(xuid,'032x'); \
print('-'.join([h[0:8],h[8:12],h[12:16],h[16:20],h[20:32]]))"
# 2535453759792258 -> 00000000-0000-0000-0009-01fb54b26482
```

Then add it, and **only** in this form:

```bash
ssh mcserver
cd /home/mcadmin/stacks/minecraft
sudo docker compose exec -T minecraft rcon-cli "fwhitelist add 00000000-0000-0000-0009-01fb54b26482"
sudo docker compose exec -T minecraft rcon-cli "whitelist reload"
```

`fwhitelist add <uuid> <gamertag>` and `fwhitelist add <raw-xuid>` **both fail
silently** — they print nothing and leave the allowlist untouched, exactly like
the failure this whole section is about. Verify by reading the file, never by
the absence of an error:

```bash
sudo docker compose exec -T minecraft cat /data/whitelist.json
```

### Why the entry says "unknown", and why that is now harmless

The player lands in `whitelist.json` as `{"uuid": "...", "name": "unknown"}` —
Floodgate had no gamertag to record. **Paper never backfills it**, not even
after a successful login; verified. `whitelist add .theirgamertag` afterwards
answers `Player is already whitelisted` and still does not fix the name.

That matters because the roster is matched by **name**. Before 2026-08-11 an
`unknown` entry read as "not on the roster", so the next sync would have removed
a perfectly legitimate player and kicked them mid-game. Both
`marnar-mc-sync-players` and `marnar-mc-adminctl` now translate an `unknown`
entry through two sources, in order:

1. **`roster/floodgate-uuids.tsv`** — the sync writes `<uuid>\t<gamertag>` there
   at the moment it adds somebody by UUID, so the name is known immediately.
2. **`usercache.json`** — the server's own record, which learns the name at
   first join. Kept as a second source because it covers entries made before
   the map existed. ⚠️ Its entries carry an `expiresOn` **one month out**, so it
   is not a durable answer for a player who stops logging in; the map is.

Consequences worth knowing:

- The panel shows them correctly as synced, though `whitelist list` on the
  console still prints `unknown`. That is cosmetic.
- **Removing such a player must be done by UUID.** Measured 2026-08-11:
  `whitelist remove <uuid>` answers **"That player does not exist"** and leaves
  the entry in place, while `fwhitelist remove <uuid>` removes it. Removing by
  the gamertag does nothing either, because that is not the stored name. The
  sync consults the map and uses `fwhitelist remove` automatically; by hand,
  use `fwhitelist remove`. A removal that silently does nothing leaves an
  ex-player able to join.
- A player added by UUID who is in **neither** source cannot be translated. The
  sync prints `? unknown (added by UUID, never joined, and not in the map —
  left alone)` and **does not remove them** — the safe direction. If you see
  that line for somebody who should not be there, remove them by UUID by hand.
- The two scripts share this logic on purpose. **If you change one, change the
  other**, or the panel and the sync will disagree about who is allowed in.
- `floodgate-uuids.tsv` is player data: it lives beside the roster, is **not in
  Git** (F-10a) and rides along in the nightly backup.

⛔ Do not "fix" this by turning the allowlist off. It stays on and enforced
(A-1/A-1a); an open server is not an acceptable workaround for a slow one.

---

## 3d. A removal that did not remove (fixed 2026-08-19)

**Symptom:** the sync says `- .SomeName (not in roster)`, exits clean, and the
player is still on `whitelist.json` afterwards — and can still join.

**Cause:** `whitelist remove <name>` does **nothing** to a Bedrock player. Paper
answers "That player does not exist" and leaves the entry in place. Only
`fwhitelist remove <uuid>` works on a Floodgate account. Until 2026-08-19 the sync
only used the UUID form for players listed in `roster/floodgate-uuids.tsv` — a file
written solely by the by-UUID escape hatch in §3c, so in practice it held exactly
one name. Every other removal was reported as done and silently did nothing.

This was found by inspection, not by anyone noticing. A friend who was added and
removed a minute later kept his access for three days, across four syncs that each
claimed to have removed him.

**The fix:** the UUID is taken from `whitelist.json` itself, which always has it,
and the command is chosen by the UUID's shape — Floodgate mints its UUIDs in a
reserved range beginning `00000000-0000-0000-000`, which a real Mojang account
never matches. Java accounts keep the by-name form.

**If you ever see this**, the manual removal is:

```bash
# find the UUID
ssh mcserver 'docker exec minecraft cat /data/whitelist.json'
# then, for a Bedrock player
ssh mcserver 'docker exec minecraft rcon-cli "fwhitelist remove <uuid>"
               docker exec minecraft rcon-cli "whitelist reload"'
```

Confirm with a dry run — `roster:` and `server:` must show the same count:

```bash
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-sync-players --dry-run'
```

A name the sync cannot resolve to a UUID is now **reported and skipped loudly**
rather than passing silently. If you see that line, remove it by hand as above.

---

## 3e. Play settings — "How we play" (F-12)

Nine settings MarNar can change himself, in the panel's own section: difficulty,
keep items on death, how many must sleep, monsters, phantoms, mob griefing,
fall damage, the day/night cycle and the weather cycle. All of them apply
instantly and none of them touch the world. Nothing here needs a restart, and
nothing here needs a new world.

From a shell:

```bash
sudo /usr/local/sbin/marnar-mc-adminctl settings-get
sudo /usr/local/sbin/marnar-mc-adminctl settings-set difficulty easy
sudo /usr/local/sbin/marnar-mc-adminctl settings-apply     # push stored intent back
```

`settings-get` reads the **live server**, not the stored file, so it tells you
what is actually happening rather than what was last requested.

### ⚠️ 26.2 renamed every gamerule, and made them per-dimension

Two changes landed together in MC 26.2 and either one alone will waste an
afternoon.

**They are snake_case now.** `keepInventory` is `keep_inventory`,
`naturalRegeneration` is `natural_health_regeneration`, `doInsomnia` is
`spawn_phantoms`, `doDaylightCycle` is `advance_time`, and `doFireTick` became
the *numeric* `fire_spread_radius_around_player`. Old names are not aliased —
they are rejected with `Incorrect argument for command`, which reads exactly
like a syntax error and sends you looking in the wrong place. The authoritative
list is in the server jar at
`net/minecraft/world/level/gamerules/GameRules.class`; there are 58 of them.

**They are per-dimension.** Each dimension has its own
`world/dimensions/minecraft/<dim>/data/minecraft/game_rules.dat`, and the RCON
console runs in the overworld. So this:

```bash
docker exec minecraft rcon-cli "gamerule keep_inventory true"
```

changes the overworld **and nothing else**, while reporting success. That is
not hypothetical: it is how this world spent its whole life keeping your items
at home and eating them in the Nether, with F-1b claiming otherwise. Write all
three, always:

```bash
for dim in overworld the_nether the_end; do
  docker exec minecraft rcon-cli "execute in minecraft:$dim run gamerule keep_inventory true"
done
```

Reading has the same trap. A bare `gamerule keep_inventory` reports the
overworld's value and tells you nothing about the other two. `settings-set`
handles all of this; the warning is for when you are doing it by hand.

### Difficulty is stored in two places, deliberately

Difficulty is not a gamerule — it comes from `server.properties`, and itzg
rewrites that file from the container environment on **every** start. So a
difficulty set over RCON alone survives exactly until the next restart and then
silently reverts, which looks like the panel not working.

`settings-set difficulty` therefore writes twice: over RCON for the running
server, and `MC_DIFFICULTY` into `/home/mcadmin/stacks/minecraft/.env` for the next
container build. Two consequences worth knowing:

- Changing it in `docker-compose.yml` is wrong; change `.env`.
- `docker compose restart` **reuses the container's existing environment**, so
  it does not pick up an `.env` change. Only `docker compose up -d` recreates.
  Because the weekly bounce uses `restart`, `marnar-mc-restart` finishes by
  calling `settings-apply`, which pushes the stored values back over RCON. If
  you ever see difficulty revert after a restart, that hook is what failed —
  check the restart log for `re-applying stored play settings`.

### Stored intent vs. what the server is doing

`/etc/marnar/mc-settings.env` holds what we asked for. The server holds what is
true. They diverge in two situations, and both are handled:

- **After a world regenerate** — a new world starts at vanilla defaults and
  throws every setting away. `verb_world_regenerate` calls `settings-apply`
  before it reports success.
- **After a container restart** — difficulty comes back stale, as above.

If you need to force them back into agreement at any time, run
`settings-apply`. It is safe to run repeatedly.

### Adding a new setting

Add the key to `SETTING_KEYS` and `setting_spec()` in `marnar-mc-adminctl`, add
the same key to `SETTINGS` in `admin/ui/html/app.js`, and add
`set.<key>.name`, `set.<key>.note` and one string per value to **both**
languages in `i18n.js`. adminctl is the authority: a key the browser sends that
is not in `setting_spec()` is refused with a 400, and the rule name sent to the
server always comes from adminctl, never from the request. Keep it that way —
RCON is command execution, and this is the only thing standing between the
browser and it.

---

## 3f. Making a new world (F-12a)

⚠️ **This destroys the world MarNar is playing on.** The old world is moved aside,
not deleted, but nothing puts it back automatically. The panel asks whoever
clicks it to type **NUEVO** (or **NEW** in English) first, for that reason.

The form asks for four things:

| Field | Where it ends up | Applied when |
|---|---|---|
| Seed | `MC_SEED` in `stacks/minecraft/.env` | at the recreate |
| Size (border) | `worldborder set` over RCON, after the world exists | after generation |
| World type | `MC_LEVEL_TYPE` in `.env` → `LEVEL_TYPE` → `level-type` | at the recreate |
| Structures | `MC_STRUCTURES` in `.env` → `GENERATE_STRUCTURES` | at the recreate |

`normal`, `flat` and `large_biomes` are the only accepted types; adminctl
refuses anything else **before** it moves the old world aside, so a bad request
costs nothing. The value written to `.env` is prefixed — `minecraft:normal` —
because 26.2 wants the namespaced id.

### Two different size limits, on purpose

`marnar-mc-adminctl world-regenerate` accepts **500–20000**. The agent, which is
what the browser talks to, refuses anything over **4500** (`PANEL_MAX_BORDER` in
`mcadmin-agent.py`). That is not redundancy, it is the split between "an adult at
a shell knows what they are asking for" and "a kid clicked a number". Chunky's
cost scales with **area**: 4500 → 20000 is not 4× the wait, it is roughly 20×,
on one shared vCPU that is also serving two other sites. Raise the panel cap
by changing that one constant, not by touching adminctl.

### Things that are not on the form, and why

- **Amplified** — a real 26.2 preset, left out. It is the heaviest terrain to
  generate and the pre-generation cost here was never measured.
- **Hardcore** — left out because it contradicts keep-items-on-death (F-1b).
- **Bonus chest** — *cannot* be offered. `/image/property-definitions.json` in
  the itzg image has no property for it, so there is no environment variable to
  set. Do not go looking for the right variable name; there isn't one.

After generation, `verb_settings_apply` runs, so a new world comes up with the
same nine play settings the old one had rather than vanilla defaults.

---

## 4. Minecraft updated and Bedrock players can't join (O-2)

**This is expected and recurring, not an incident.** When Mojang ships a Bedrock
client update, every console and tablet auto-updates and Geyser stops accepting
them until Geyser ships support. Usually hours to a few days.

Symptom: Bedrock players get *"Outdated client"* / *"Outdated server"*. Java
players are unaffected and keep playing.

Fix — Geyser is pulled fresh on every container start, so this is just a
restart:

```bash
ssh mcserver 'cd /home/mcadmin/stacks/minecraft && docker compose restart minecraft'
ssh mcserver 'docker logs minecraft 2>&1 | grep -i "Started Geyser"'
```

If it still refuses, Geyser has not released support yet. Check
<https://geysermc.org/> and wait. There is nothing to fix on our side, and
**do not** change `VERSION` in the compose file to chase it — that changes the
Java server version, which is a different thing and will not help.

Tell the parents: *"Se actualizó Minecraft, hay que esperar a que se actualice
el servidor. Los que juegan en la compu por Java pueden entrar igual."*

---

## 5. Backups (~~O-4~~ superseded, O-5)

> ⛔ **Backups do not run on a schedule.** `marnar-mc-backup.timer` is disabled
> and stopped, on purpose, since 2026-08-11 (C-1). **Do not enable it** without
> asking Helder — its absence is a decision, not drift, and the unit file was
> kept only so re-arming is one command. The reason: *"I don't want backups to
> be executed automatically yet, this will come when we set up S3 if we get to
> that."*
>
> A copy is made in exactly two situations:
>
> 1. Someone presses **"Make a copy"** in the admin panel.
> 2. Automatically, immediately before a destructive world operation —
>    regenerate, import, restore — via `preserve_current_world`. This is the
>    only reason those operations can be undone, and it is why turning the
>    schedule off was safe.
>
> Since **2026-08-19 the copies do not stay on this disk at all** — S3 is
> the store and `daily/` is only where an archive is built before being
> uploaded. See "Where the copies actually live" below.
>
> ⚠️ **Every pre-existing archive was deleted on 2026-08-11 at Helder's
> instruction** (566 MB freed). If nobody has pressed the button and nothing
> destructive has run since, **there is no restore point** — check before
> assuming there is one.

Sunday's daily is still hard-linked as the weekly when a copy happens to land on
a Sunday.

```bash
# run one now
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-backup'

# what exists
ssh mcserver 'ls -lh /home/mcadmin/backups/minecraft/daily/'

# verify a backup is actually restorable, without touching the live world
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-restore-test'
```

`marnar-mc-restore-test` unpacks the newest archive into a scratch directory,
boots a second throwaway Paper container against it with no ports published,
waits for it to report `Done`, and deletes everything. That a server *starts on*
the world is the property worth testing; that `tar` exited 0 is not.

> ⚠️ The archives contain `.rcon-cli.env`, which holds the RCON password. They
> are fine where they are — same box, same trust boundary — but do not copy them
> somewhere less protected without thinking about that first.

### Where the copies actually live (changed 2026-08-19)

Helder's decision, 2026-08-19: *"I prefer to upload to S3 and have the capability
to restore it from S3 and not use disk space to hold them out."* So:

| | Where | What it is | Who removes it |
|---|---|---|---|
| **Off-site copies** | S3 | Every copy anyone keeps: the weekly automatic one and each "Make a copy" from the panel | An S3 lifecycle rule. Nothing on the box can — see §5b |
| **Staging** | `backups/minecraft/daily/` | The archive being built, for the minutes between `tar` finishing and S3 confirming the size | The job itself, straight after the upload verifies |
| **The undo** | `stacks/minecraft/data/world.replaced-*` | The world as it was immediately before a regenerate / import / restore | Nobody automatically. This is the "I've just broken it" copy |

So a healthy `daily/` is **empty**, and a healthy `weekly/` is empty too.

⚠️ **The weekly hard link is the trap here.** `marnar-mc-backup` hard-links a
Sunday daily into `weekly/`, and `marnar-mc-offsite` runs on Sundays — so
deleting the daily alone leaves all 295 MB on disk under the other name. Both
callers now remove the link as well, but only when `-ef` confirms it is the same
inode. If you ever see a lone file in `weekly/`, that guard is what broke.

Nothing prunes the world's own `world.replaced-*` directories. They are the only
route back from a bad restore, so deleting one is a decision, not housekeeping.

### Restoring for real

```bash
ssh mcserver '
cd /home/mcadmin/stacks/minecraft
docker compose stop minecraft
mv data data.broken-$(date +%Y%m%d-%H%M)     # never delete the bad one first
mkdir data
tar --use-compress-program=unzstd -C data -xf /home/mcadmin/backups/minecraft/daily/world-YYYY-MM-DD.tar.zst
chown -R 1000:1000 data
docker compose up -d
'
```

Rename the broken world, do not delete it. If the restore turns out to be worse
than what you replaced, that directory is the only way back.

---

## 5b. The off-site copy in S3 (O-4a)

Everything in §5 lives on the same boot volume as the world it is protecting. This
is the copy that survives losing that volume.

```bash
ssh mcserver 'systemctl list-timers marnar-mc-offsite.timer'   # armed? next run?
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-offsite --dry-run'  # safe, uploads nothing
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-offsite'            # run it now
ssh mcserver 'sudo journalctl -u marnar-mc-offsite -n 40'        # what happened
```

Sundays at 04:07, offset from another weekly backup job (~03:30) so two uploads
do not fight over the one vCPU. It calls `marnar-mc-backup` for the archive rather
than making its own, so the `save-off` / `save-on` trap exists in exactly one place.

### What is in the bucket

```bash
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-s3 list'   # key, bytes, epoch
```

`marnar-mc-s3` is the only thing that talks to the bucket — the weekly job and
the panel both go through it, so the credentials, the retry settings and the two
traps below live in one file instead of three.

| Key | What it is | Retention |
|---|---|---|
| `world.tar.zst` | The weekly automatic copy. **One fixed key**, versioned, overwritten each Sunday somebody played | Lifecycle rule expires **non-current versions only** — the current one never expires, however long the server sits quiet |
| `copies/world-<stamp>.tar.zst` | One object per **"Make a copy"** from the panel | ⚠️ **Nothing. See below.** |

⚠️ **The box cannot list object versions.** The IAM key is denied
`s3:ListBucketVersions` — verified 2026-08-19 against the live key, a plain 403,
*"no identity-based policy allows the s3:ListBucketVersions action"*. Only the
**current** version of a key is reachable from here. That is why panel copies get
dated keys under `copies/` instead of sharing one name: with a shared name, every
copy but the newest would be invisible — including the one somebody took right
before trying something risky, which is the whole reason they took it.

⚠️ **`copies/` has no lifecycle rule yet, and the box cannot prune it** (no
`DeleteObject`, on purpose — see below). Until a rule is added **in the AWS
console**, every copy anyone makes stays for ever, at ~295 MB and ~$0.007/month
each. Expiring `copies/` by **age** is safe, unlike `world.tar.zst`: the weekly
key is always there underneath, so a quiet spell can never leave the world
unprotected.

⚠️ `copies/probe.txt` (5 bytes) is mine — written 2026-08-19 while checking that
the key could write under that prefix, and **it cannot be deleted from the box**.
It is filtered out of the panel's restore list by name. Delete it in the console
when you are next there.

### It is supposed to skip, most weeks

```
no play since the last off-site copy (2026-08-18 17:44) — skipping
no archive built, no upload, no cost
```

**That is success, not a fault.** It compares the newest mtime under
`world/players/` with the one recorded at the last upload, in
`/var/lib/marnar/mc-offsite.state`. Nobody played, nothing changed, nothing to pay
for. Use `--force` to upload anyway — which is what you want after a restore, since
restoring an old world moves those timestamps *backwards* and the skip logic would
otherwise consider the copy already made.

**It will not skip if the copy in S3 has gone missing.** "Nobody played, so the
existing copy is fine" only holds while a copy exists, so the skip path checks that
`world.tar.zst` is really in the bucket and uploads instead of skipping if it is not,
with an ntfy alert. Without that check, a copy deleted by accident — or by a
lifecycle rule expiring current versions instead of non-current ones — would leave
the world unprotected while the skip decision quietly re-confirmed itself every
Sunday, surfacing only on the day someone needed it.

⚠️ **`rclone lsjson` exits 0 for an object that does not exist**, returning an empty
JSON array. Both the skip guard and the post-upload verification therefore test the
*output* for a size, never the exit status. Measured 2026-08-19 — the first version
of that guard used `if rclone lsjson ...` and was a silent no-op. Do not tidy either
of them back into an exit-status check.

⚠️ **Do not "fix" this to check the mtime of the world tree instead.** Paper
rewrites `chunk_tickets.dat`, `raids.dat` and `level_overrides.dat` on every
autosave whether or not anyone is online, so the tree always looks freshly modified
and nothing would ever be skipped.

### Retention is by version, and the reason matters

The bucket is **versioned**, every upload overwrites the single key
`world.tar.zst`, and the lifecycle rule expires only **non-current** versions
(7 days, keeping 1 newer). The current version never expires.

Versioning is **verified**, not assumed: a `HEAD` on the object returns an
`X-Amz-Version-Id` header, which a non-versioned bucket does not send.

```bash
ssh mcserver 'sudo bash -c "set -a; . /etc/marnar/mc-offsite.env; set +a
  rclone lsjson \$S3_BASE/world.tar.zst --dump headers"' 2>&1 | grep -i version-id
```

The lifecycle rule itself **cannot be checked from the box** — the scoped key has no
`s3:GetLifecycleConfiguration`, deliberately. Helder confirmed on 2026-08-19 that he
created it as specified; if you need to see it, that is an AWS console job. The
missing-copy guard above is what protects the world if it was ever set up wrong.

⚠️ **Never change this to "expire objects after N days."** Combined with the skip
logic above, an age rule deletes the last copy during a quiet spell while the skip
logic quite correctly declines to upload a replacement — leaving nothing off-site
precisely because nothing changed.

### The box cannot delete its own backups

The IAM key (`minecraft-backup-writer`) has `PutObject`, `GetObject` and `ListBucket` on
this bucket and nothing else. Verified 2026-08-19 against the live key: `AccessDenied`
on `DeleteObject`, on `ListAllMyBuckets`, and on another bucket. So the script uses
`rclone copyto` and never `sync` or `delete`, exactly as another backup job on the same box does.
**Keep it that way** — retention belongs in the S3 lifecycle rule, because a box that
can erase its own backup history is a box that loses it in the one event that matters.

A consequence to remember: **you cannot delete anything in that bucket from here.**
Do it in the AWS console.

### ⚠️ The bucket holds secrets

The archive includes `.rcon-cli.env`, `.paper.env` and `plugins/floodgate/key.pem`.
O-4a allowed either stripping them or treating the bucket as secret-bearing, and the
second was chosen: excluding `key.pem` would log every Bedrock player out on restore.

So the bucket is private and must stay private. Verified 2026-08-19 — anonymous GET
of the object and anonymous bucket listing both return **403**, objects are
SSE-AES256, and RCON is not published beyond the container network (S-3). **Never
make this bucket public, and never move these archives somewhere shared.**

### Restoring from S3

**Normally you do not do this by hand.** Every copy in the bucket appears in the
panel's **Mundo** screen with a ☁ badge, and *Restaurar* downloads it and restores
it in one job. The panel warns first that the download costs money.

Under that button, `marnar-mc-adminctl world-restore s3:<key>`:

1. downloads the object to `backups/minecraft/.offsite/` and **verifies the size**
   against S3 — *before* the running world is touched, so a dead network or a
   missing object fails while everything is still up;
2. lists the archive and refuses unless it really contains `world/level.dat`,
   which also walks the whole compressed stream, so a truncated download dies here;
3. moves the current world aside as `world.replaced-<stamp>`;
4. unpacks, `chown`s, waits for the server to report ready;
5. deletes the download. S3 is the store; the staging copy is not kept.

⚠️ **Two traps that both cost an afternoon**, and are the reason step 2 looks the
way it does in the source:

* Archives store members as **`./world/level.dat`**, so `tar -tf archive
  world/level.dat` matches **nothing**. The first version of that guard therefore
  rejected every valid copy in the bucket. `marnar-mc-restore-test` did not catch
  it because it unpacks first and then checks the file, which is a different
  question.
* `grep -q` exits on the first match, `tar` dies of `SIGPIPE`, and `pipefail`
  turns that success into a failure. Hence the `set +o pipefail` subshell around
  that one pipeline.

By hand, if the panel is unavailable:

```bash
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-s3 list'
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-s3 get world.tar.zst /home/mcadmin/from-s3.tar.zst'
ssh mcserver 'zstd -t /home/mcadmin/from-s3.tar.zst'
```

Then follow §7 as if it were a local archive. Verify with `zstd -t` **before**
stopping the server — an archive that fails the test is not a rollback, and you
still have the running world.

### What a restore costs

Measured 2026-08-19, not estimated: **$0.00**. S3 egress is $0.09/GB, but the
first **100 GB per month** are free across all AWS services and regions, and a
copy is ~295 MB. Past that allowance it would be ~2.7¢ per restore. Storage is
about $0.014/month for two copies; S3 Standard is genuinely cheapest at this size,
because Glacier's 90/180-day minimum billing durations cost *more* against a
300 MB object that rotates weekly.

⚠️ **The panel says the opposite, deliberately.** Helder's instruction of
2026-08-19, kept after being shown the figure above: warn that restoring from the
cloud costs money and should only be done if it is really needed. The audience is
a twelve-year-old with a button that replaces a world, and "this costs money" is a
brake he wanted. The measured number is one tap away in *¿Qué es esto?* on the
same screen, so nothing in the panel is untrue — but if you are here wondering
whether a restore is affordable, it is.

---

## 6. Nightly restart (O-6a)

05:00 local. Warns anyone online at 60/30/10 seconds, forces `save-all flush`,
then restarts the container.

```bash
ssh mcserver 'sudo /usr/local/sbin/marnar-mc-restart'   # run it manually
ssh mcserver 'systemctl list-timers marnar-mc-*'        # confirm it is armed
```

---

## 7. Rollback (S-8)

**A player is griefing / something went wrong in-world** → restore yesterday's
backup (§5). The world is the only thing worth rolling back; everything else is
in Git.

**A config change broke the server** → the stacks are in this repo. Revert the
commit, `scp` the compose file back, `docker compose up -d`.

**Take the server offline right now**, without losing anything:

```bash
ssh mcserver 'docker exec minecraft rcon-cli "save-all flush"; cd /home/mcadmin/stacks/minecraft && docker compose stop'
```

**Take the whole thing down including the PS5 path** (e.g. the DNS service is
being abused):

```bash
ssh mcserver '
cd /home/mcadmin/stacks/mc-dns && docker compose down
cd /home/mcadmin/stacks/bedrock-connect && docker compose down
'
```

That leaves Java players working and only removes the console path. Removing
`mc-dns` does **not** affect anyone's normal internet — players who set it as
their primary DNS fall back to their secondary.

**Remove the project entirely from the box**: `docker compose down` in all three
stacks, `systemctl disable --now marnar-mc-*.timer marnar-mc-dns-ratelimit`,
remove ports 53/19132/19133/25565 from `firewall-cmd --permanent` and from the
cloud firewall. Leave 80/443 and the `MARNAR-CF` chain alone — those belong
to the other sites.

---

## 8. Things that will bite you

**The rate-limit rule matches port 1053, not 53.** `DOCKER-USER` runs in the
FORWARD chain, *after* Docker's DNAT has rewritten the published port to the
container port. A rule written against 53 installs cleanly, sits in a chain that
is demonstrably traversed, and matches nothing. If you ever change the container
port in `stacks/mc-dns/docker-compose.yml`, change `DPORT` in
`marnar-mc-dns-ratelimit` to match.

**`firewall-cmd --reload` flushes everything.** That is why
`marnar-mc-dns-ratelimit` writes its rules into firewalld's permanent direct
config *and* the live tables. After any reload, confirm:

```bash
ssh mcserver 'sudo iptables -L DOCKER-USER -n | head -5'
```

Both `MARNAR-CF` and `MARNAR-MCDNS` must be there. dockerd re-adds the jump from
FORWARD a few seconds after the reload, so a momentary `(0 references)` is
normal — check again before worrying.

**Ports need opening in two places.** `firewalld` *and* the cloud firewall.
Either one alone fails silently, and the failure looks identical to the service
being down.

**Java version is coupled to `VERSION`.** Minecraft 26.1+ refuses to start on
anything below Java 25. The image is pinned to the `java25` digest. Bump both
together or you get a one-line error and a restart loop.

**Gamerules are snake_case in 26.x.** `keep_inventory`, not `keepInventory`. The
old spelling is a parse error, not a silent no-op.

**`rcon-cli` concatenates multiple arguments into one command.** Run one command
per `docker exec`.

---

## 9. Known open items

- ⚠️ **The PS5 path needs the player's own PlayStation Plus, and no amount of
  debugging here will change that.** Verified 2026-08-11 by a real connection
  attempt: Minecraft on PS4/PS5 requires an active PS Plus subscription for
  online multiplayer, third-party servers included. Sony's gate, checked before
  anything this project built is reached. It is **per player**: Helder holds
  none, so MarNar plays from the iPad, but friends whose families have it can join
  from their consoles (N-18). If someone reports the console failing, **confirm
  the subscription first** — *not* the DNS settings, which is where the
  troubleshooting used to point. `bedrock-connect`, `mc-dns` and port 53 are in
  use, not vestigial.
- **Whether the console falls back to its secondary DNS on `REFUSED` is still
  unobserved.** `REFUSED` remains the right choice (unlike `NXDOMAIN`, it means
  "ask someone else"), but no console has walked the path yet. The first friend
  who connects from a PS5 is the test — if their console keeps working for
  everything that is not Minecraft, this is answered.
- **Amplification is 1.95×, not the ≈1× originally assumed** (N-16). Re-run
  `scripts/amptest.py` after any Corefile change; above 2× means the resolver
  has started answering something it should refuse.
- **`anothersite.example.com` does not point at this box** — it resolves to a registrar
  parking IP and does not respond. The live site is `site.example.net`.
  Unrelated to this project, noticed while regression-testing the neighbours.
