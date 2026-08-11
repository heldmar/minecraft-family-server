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
| Backups | `/home/mcadmin/backups/minecraft/{daily,weekly}/` |
| Scripts | `/usr/local/sbin/marnar-mc-*` |
| Admin UI | <https://minecraft-admin.example.net> · agent `marnar-mc-admin.service` |
| Timers | `marnar-mc-backup.timer` (04:00), `marnar-mc-restart.timer` (05:00) |

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
*Jugadores* → fill in platform, gamertag, who they are. It writes the roster,
syncs the server and records the change in one step. Removing someone is the
**Quitar** button on their row, which also kicks them if they are online.

The roster is **`/home/mcadmin/stacks/minecraft/roster/allowlist.txt` on the
server** — deliberately **not** in this repo. The repo is a generic server
build; who plays is usage data (F-10a). It rides along in the nightly backup.

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
white-listed" kick with nothing useful in the log. Press **Sincronizar**.

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

**A world operation is stuck.** They are jobs; only one runs at a time. Watch it
directly:

```bash
ssh mcserver 'docker logs -f minecraft'
```

Chunky reports progress every 120 seconds during pre-generation. Polling faster
than that looks exactly like a stall and is not one.

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

## 5. Backups (O-4, O-5)

Daily at 04:00, 14 dailies + 4 weeklies, Sunday's daily hard-linked as the
weekly.

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

### Offsite — decided, not built (O-4a)

Backups go to **Amazon S3**, agreed 2026-08-11, and are **deliberately parked**
until the server has survived a real play test. Right now backups are local-only
on the boot volume: that covers griefing and bad updates, and does not cover
losing the volume or the instance. That is the accepted position for now.

When it gets picked up, two things that are easy to miss:

1. **Strip `.rcon-cli.env` from the archive**, or treat the bucket as
   secret-bearing. Today the RCON password rides along in every backup.
2. **The IAM credentials must not be able to delete.** A credential on the
   server that can delete from the bucket means anything that compromises the
   box takes the offsite copy with it — which is the exact scenario offsite
   backups exist for. Write/append only, with versioning and lifecycle rules
   doing the pruning on the S3 side rather than the client.

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

- **The PS5 path has not been tested on an actual PS5.** Every component is
  verified independently — DNS answers, BedrockConnect answers on 19132, Geyser
  answers on 19133 — but nobody has walked a console through it. In particular,
  whether the console falls back to its secondary DNS when ours answers
  `REFUSED` is reasoned, not observed. `REFUSED` is the right choice for this
  (unlike `NXDOMAIN`, it means "ask someone else" rather than "does not
  exist"), but it needs confirming on MarNar's console.
- **Amplification is 1.95×, not the ≈1× originally assumed** (N-16). Re-run
  `scripts/amptest.py` after any Corefile change; above 2× means the resolver
  has started answering something it should refuse.
- **`anothersite.example.com` does not point at this box** — it resolves to a registrar
  parking IP and does not respond. The live site is `site.example.net`.
  Unrelated to this project, noticed while regression-testing the neighbours.
