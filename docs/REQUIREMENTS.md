# MarNar Minecraft — Requirements

> **Status:** v2 — **built and running on a cloud VM** (host changed from the Pi after
> the Pi proved unreachable from the internet). Requirements are annotated inline with what was
> met, when, and the evidence. Not yet opened to players: the allowlist is deliberately empty
> (A-1a) and the PS5 path has not been walked on a real console.
> **Date:** 2026-08-10, implementation same day
> **Owner:** Helder Martins
> **Host:** a single Linux VM with Docker.

---

## 1. Purpose

Run a small, private, invitation-only Minecraft server so that Helder's son ("MarNar") can play
with a fixed group of friends, at no cost to the players, reachable at
`minecraft.example.net`.

This repository versions the server configuration, the allowlist, the deployment stack and the
operational runbooks.

---

## 2. Users

| User | Devices | Edition | Can actually play? |
|---|---|---|---|
| MarNar (primary) | ~~PS5~~, iPad | Bedrock | ✅ **iPad** — the PS5 is out for *him*, see N-18 |
| MarNar's approved friends | mostly PS5; some PC, some iPad | Bedrock | ✅ PC/iPad always; **PS5 if that family holds PS Plus** — N-18 |
| Approved PC players | Windows/macOS/Linux | **Java** (crossplay required) | ✅ unaffected |
| Helder (admin) | Mac, SSH | operator, not necessarily a player | ✅ |

⚠️ **Updated 2026-08-11.** Minecraft on PlayStation requires PS Plus for online multiplayer
(**N-18**). That is a **per-player** prerequisite, not a property of this server: Helder holds no
subscription, so MarNar plays from the iPad, but **Helder confirmed 2026-08-11 that some of the
friends' families do have PS Plus**, and those consoles can join. The console path stays built and
supported.

**Approved decision:** Java Edition and Bedrock Edition players share **one world**.

---

## 3. Measured environment (baseline, 2026-08-10)

### 3.1 Host — a small ARM cloud VM

| Property | Value |
|---|---|
| CPU | **1 vCPU**, Arm, 3.0 GHz, `aarch64` |
| RAM | 5642 MiB total · **~2921 MiB available** |
| Swap | 4096 MiB |
| Disk | 183 GB root, 163 GB free |
| Public IP | **`198.51.100.20` — static, no NAT** |
| OS | An RHEL-family Linux 9, SELinux **Enforcing**, `dnf`, `firewall-cmd` |
| Load average | 0.14 |
| Existing containers | 9 — two other sites, four other application containers, NPM, MariaDB and Portainer |
| `firewalld` open | `http`, `https`, `dhcpv6-client` only |
| Latency to the players' region | **~134 ms RTT** (measured) |

### 3.2 Operating rules inherited from the host

- Stacks live at `/home/mcadmin/stacks/<name>/` and are **CLI-managed**. Portainer there is a
  **viewer, not a deploy path** — do not deploy from its UI.
- Every image must have a real **`arm64`/`aarch64` manifest** and be **pinned**, never `latest`.
- SELinux is Enforcing — bind mounts need correct labelling (`:z`/`:Z`).
- ⚠️ **The host's own notes declare that box permanently out of scope.** This project
  overrides that by owner decision (2026-08-10). See §4.2.

---

## 4. Architecture decisions

### 4.1 Server software — Paper + GeyserMC + Floodgate

**Decision:** **PaperMC** (Minecraft Java Edition server) with **GeyserMC** and **Floodgate**,
containerised via the multi-arch `itzg/minecraft-server` image.

**Rationale — forced, not preferred:** Mojang's **Bedrock Dedicated Server ships x86_64 only.
There is no ARM64 build**, and the server is `aarch64`. Emulation is not viable for a real-time
tick loop. A Java server *is* ARM-native, and Geyser translates the Bedrock protocol so
PS5/iPad/PC-Bedrock clients connect natively. Floodgate lets them join **without a Java
account**, authenticating against Xbox Live instead. This also delivers the crossplay
requirement at no extra cost.

**Rejected:** official BDS (no ARM64 build) · BDS under emulation (unusable performance) ·
PocketMine-MP (poor vanilla parity, no Java crossplay).

### 4.2 Host — a cloud VM (the Pi was tried and rejected)

**Decision:** Host on the cloud VM, at its **current 1 vCPU / 6 GB**, sized for **4 concurrent
players**. *(Owner decision, 2026-08-10.)*

**Why the Pi was abandoned — measured, not assumed.** The Pi was the original choice and the
plan was fully specified against it. It failed on one thing: **nothing inbound from the
internet reaches it.**

Diagnostics performed 2026-08-10:

| Check | Result |
|---|---|
| Public IP genuinely the Pi's | ✅ STUN reports `203.0.113.10` — **CGNAT ruled out** |
| Double NAT | ✅ ruled out — the router's own WAN IP *is* `203.0.113.10` |
| router port-forward rules (53 and 19132, TCP & UDP, correct host, saved, Enabled) | ✅ correct |
| router static DHCP reservation for the Pi | ✅ in place |
| Pi host firewall | ✅ none (`iptables` INPUT policy ACCEPT, no rules) |
| Test listener answering on the LAN, UDP **and** TCP | ✅ verified |
| Probe host able to reach port 19132/53 on other servers | ✅ verified (`portquiz.net`) |
| `ping` to the home IP from the internet | ✅ 0% loss |
| **TCP and UDP to 19132 and 53 from the internet** | ❌ **ICMP "no route to host"** |

A **forwarded** port and an **unforwarded** port behaved identically, which means the router was
not honouring rules it displayed as Enabled. Two hypotheses were raised and then killed by
measurement — ISP blocking of port 53, and CGNAT — and are recorded here so they are not
revisited.

The router has **no local admin interface** (cloud-only), and its cloud API could not be
authenticated because the account uses Amazon SSO, which the unofficial API predates. So the
fault could not be pursued further programmatically.

**Consequences of moving to a cloud VM, accepted by the owner:**

- ⚠️ **~134 ms latency** for players in the target region, versus a few ms on the Pi. Acceptable for
  survival Minecraft; noticeable in mob combat and block-breaking.
- ⚠️ **Contention:** Minecraft shares **one vCPU** with nine existing containers, including two
  other live sites. See §6.
- ✅ **The networking problem disappears entirely** — static public IP, no NAT, no router, no
  DDNS, and PS5/BedrockConnect on port 53 becomes possible.

**Ruled out — permanently, not provisionally:** resizing to 2 vCPU / 12 GB. It is within quota
(verified: regional limits are 2 cores / 12 GB, 1/6 in use) and the shape reports
`is-flexible: true`, but resizing requires stopping the instance, and an out-of-capacity AD-2
could leave it unable to boot — taking the other live sites down indefinitely, for a
children's game server. **The player count was cut 8 → 4 specifically to buy out this risk.**

⛔ This is settled and is **not** a lever held in reserve. See **P-9a**. If 4 players proves too
tight, the server gets smaller — not the box bigger.

---

## 5. Functional requirements

| ID | Requirement |
|---|---|
| **F-1** | Survival mode, with a persistent world surviving restarts, host reboots and container recreation. |
| **F-1a** | **PvP disabled** (`pvp=false`). |
| **F-1b** | ~~**`keepInventory` true** — players keep items on death.~~ → **Revised 2026-08-19. It was only ever half true.** MC 26.2 made gamerules **per-dimension** and renamed them to snake_case; `keep_inventory` was `true` in the overworld and `false` in the Nether and the End, so dying at home cost nothing and dying in the Nether cost everything. Nobody noticed because the panel and the console both read the overworld. Requirement restated: **players SHALL keep items on death in all three dimensions**, and any writer of a gamerule SHALL write all three. **Met 2026-08-19** — corrected through the panel's own code path, which writes `overworld`, `the_nether` and `the_end` on every change. Now settable under F-12. |
| **F-1c** | ~~Difficulty **Normal** (vanilla default). *Confirmed 2026-08-10.*~~ → **Revised 2026-08-19 by Helder**, after MarNar and his friends reported the world too punishing. Difficulty is now **Easy** and is **settable from the panel** (F-12) rather than fixed here. Recorded honestly, because it shaped the decision: difficulty does **not** change mob health — a zombie is 20 HP on every setting — it changes how hard mobs hit the player and how often armoured or reinforced ones spawn. The "too many blows to kill a zombie" complaint is mostly a **weapon** problem (bare fists ≈ 20 hits, wooden sword ≈ 7, iron ≈ 4). Easy was still applied, because it is their game. |
| **F-1d** | **Nether and End both enabled** — standard vanilla progression. *Confirmed 2026-08-10.* The world border (P-5) SHALL apply to them as well, and pre-generation (P-6) SHALL cover the Nether, whose 8:1 coordinate ratio makes it cheap to pre-generate and expensive not to. |
| **F-1e** | Pin to the **latest Minecraft version fully supported by Geyser**. Bedrock clients are force-updated by Mojang and cannot stay behind, so trailing the client breaks joins. |
| **F-2** | Bedrock clients (PS5, iPad, PC Bedrock) SHALL be able to join. |
| **F-3** | Java clients SHALL join **the same world** as Bedrock clients. |
| **F-4** | Bedrock players SHALL NOT need a Java Edition account (Floodgate). |
| **F-5** | No player SHALL be charged anything; the server SHALL NOT collect payments or donations. |
| **F-6** | Reachable at `minecraft.example.net`. |
| **F-7** | Java clients SHOULD connect by hostname alone, with no port — via an SRV record. |
| **F-8** | ~~Bedrock clients SHOULD connect by hostname alone, by using the default Bedrock port 19132.~~ **NOT MET — deliberately traded away, 2026-08-10.** BedrockConnect must own 19132 (see N-11a), so Geyser was moved to **19133** and direct-connect Bedrock clients must type the port explicitly. This costs nothing on PS5, which reaches the server through the BedrockConnect menu and never types an address; it costs one extra field on iPad and Bedrock PC. PS5 is the stated primary objective, so the SHOULD yields to it. |
| **F-9** | **6 concurrent players** at acceptable performance (§6). ⬆️ **Raised 4 → 6 on 2026-08-19 by Helder**, on the evidence of the 2026-08-15 session: four players together for ~70 minutes, and the server has **never logged a single tick-lag warning** — not during that session, not once since commissioning. Measured before the change: the JVM had **0 kB swapped** (cgroup swap 0), no OOM kills, and the container's 609 cgroup `max` events were page cache over the mmapped region files rather than heap distress. Heap went 1536M → 1792M and the container ceiling 2048m → 2304m to give two more players somewhere to live; the box kept ~1.8 GB available. The original cut from 8 → 4 was about a shared single vCPU, and that constraint is unchanged — 6 is a measured step, not a reopening of 8. |
| **F-10** | ~~An operator SHALL add or remove an approved player by editing a file in this repo and running a documented deploy step~~ → **Revised 2026-08-11.** An operator SHALL add or remove an approved player through a single reviewed path that leaves a record, and player identities SHALL NOT be stored in this repository. **Met**: the roster is `/home/mcadmin/stacks/minecraft/roster/allowlist.txt` **on the server**, edited through the admin UI (or by hand), applied by `scripts/marnar-mc-sync-players`, which removes anyone on the server who is not in the file — that is what makes the file authoritative rather than advisory. Handles the Bedrock/Java split (`fwhitelist` vs `whitelist`) and has a `--dry-run`. |
| **F-10a** | The record of who was added or removed, and when, SHALL survive. **Met 2026-08-11**: `marnar-mc-adminctl` appends every privileged action to `roster/audit.log` with a timestamp and the source address, and that directory is inside the world backup (**no longer nightly** — see the superseded O-4; it is captured whenever a copy is made, on demand or before a destructive operation). *Rationale for moving it out of Git (2026-08-11, Helder):* the repository is a **generic server build** — how to stand this thing up — and who currently plays on it is usage data about a handful of children, not configuration. Committing gamertags put personal data about other people's kids into a repo whose whole value is being copyable; the audit trail belongs with the world, not with the build. Offsite durability for it arrives with **O-4a**. |
| **F-10b** | Player and world administration SHALL be possible without a shell. **Met 2026-08-11**: `admin/` — a static UI behind Nginx Proxy Manager at `minecraft-admin.example.net`, talking to an unprivileged host agent that can only invoke the fixed verb list in `marnar-mc-adminctl`. See **S-9**. |
| **F-11** | The world SHALL be backed up automatically, with restore documented and tested. |
| **F-12** | **Players SHALL be able to change how the world plays without an operator and without losing the world.** **Met 2026-08-19** (Phase 1). Nine settings — difficulty, keep items on death, how many must sleep, monsters, phantoms, mob griefing, fall damage, the day/night cycle and the weather cycle — are exposed in the panel's own **How we play** section, apply instantly over RCON, and need no restart and no new world. Presented as **individual controls with no presets** (*Helder, 2026-08-19*). **PvP is deliberately excluded**: it lives in `server.properties`, so changing it needs a container recreate that disconnects everyone, and one button behaving unlike the other eight is worse than not having it. F-1a therefore still stands. |
| **F-12a** | **When a new world is made, the players SHALL choose what kind of world it is.** **Met 2026-08-19** (Phase 2). The panel's *new world* form now carries **world type** — normal, flat or large biomes — and **structures on/off**, alongside the seed and the border it already had. Both are stored in `.env` (`MC_LEVEL_TYPE`, `MC_STRUCTURES`) and take effect at the recreate that a new world already performs, so they cost no extra downtime. **Amplified is deliberately excluded**: it is the most tempting entry in the list and the heaviest to generate, and the pre-generation cost on one shared vCPU was never measured — an unmeasured option that can run for hours is not a kid-facing button. **Hardcore is excluded** because it contradicts F-1b, decided the same day. **Bonus chest is not offered because it cannot be**: itzg's `property-definitions.json` has no property for it, so the image cannot pass it to the server — a finding, not a choice. The world size the panel will accept is capped at **4500** blocks (*Helder, 2026-08-19*) while `marnar-mc-adminctl` keeps the full 500–20000 range for shell use, and the whole operation is gated behind typing **NUEVO**/**NEW**, because it is the one control in the panel that destroys a world. |

---

## 6. Performance & capacity requirements

The single vCPU, shared with nine containers, is the binding constraint.

| ID | Requirement |
|---|---|
| **P-1** | Hard memory ceiling of **2048 MiB** (`mem_limit`), leaving ~870 MiB of the measured 2921 MiB available. |
| **P-2** | JVM heap fixed at **`-Xms1536M -Xmx1536M`** (equal min/max to avoid resize pauses), with Aikar's G1GC flags. |
| **P-3** | The JVM SHALL NOT swap. Memory pressure is an incident, not something to absorb. |
| **P-4** | `view-distance` **6**, `simulation-distance` **4**. |
| **P-5** | A **world border** (initial target 3000 blocks) to bound disk growth and chunk generation. **Met 2026-08-10**: overworld 3000, End 3000, **Nether 375**. The Nether is overworld ÷ 8 on purpose — Nether coordinates are 1:8, so 375 makes every in-border overworld location reachable by portal and nothing beyond it. Setting the Nether to 3000 as well would have quietly allowed travel to 24,000 in the overworld. |
| **P-6** | The world SHALL be **pre-generated** to the border (e.g. Chunky) before players are invited. **This is the single most important requirement in this section** — chunk generation is the dominant CPU spike, and on a shared single core it is what would stall the other sites. Pre-generating moves that cost to a controlled window. **Met 2026-08-10**, all three dimensions: overworld 35,721 chunks in 39:46 (~17 cps), Nether 625 chunks in 0:29, End 35,721 chunks in 5:39 (~100 cps — the End is mostly void, so it generates fast). Total ~46 min, run overnight with no players. |
| **P-7** | Tick rate **≥ 18 TPS** with 4 players online in pre-generated terrain. **Partially verified 2026-08-10**: TPS held at **19.3–20.0 throughout pre-generation**, which is a far heavier load than four children playing — but with **zero players online**. The requirement as written needs 4 real players and cannot be closed until they exist. The margin observed makes it very likely to pass. |
| **P-8** | ⚠️ **CPU contention with the existing tenants SHALL be measured before the server is opened to friends.** The other tenants share this core. If Minecraft degrades them, the resolution is P-9, not silence. **Measured 2026-08-10 under pre-generation**, i.e. the heaviest this tenant will ever be: load average 0.94–2.01 on 1 vCPU, `minecraft` at 82% CPU and every other container ≤13%, `othersite.example.com` served **200 in 0.98s** during it. Memory is the tighter constraint, not CPU — the container runs near its 2 GiB cap by design, leaving ~1.7 GiB free on the box. All three new containers run at `cpu_shares` below the default so the existing tenants win contention. |
| **P-9** | If contention proves unacceptable, the documented options are: reduce the player count further (2–3), drop view-distance to 4 and simulation-distance to 3, lower `cpu_shares` so Minecraft yields harder, or disable the End. ⛔ **Resizing the instance is NOT one of them.** See P-9a. |
| **P-9a** | ⛔ **Resizing the instance is permanently off the table.** *Ruled out by Helder 2026-08-10, restated 2026-08-11.* It requires stopping the instance, and an out-of-capacity availability domain could leave it unable to boot — which would take the two other live sites down indefinitely, for a children's game server. The player count was cut 8 → 4 **specifically to avoid this**, so proposing it later reopens a decision that has already been paid for. Do not offer it as an escalation path, a contingency, or a "if it gets tight" aside. If 4 players is too tight, the server gets smaller, not the box bigger. |
| **P-10** | No performance-heavy mods or plugins. The plugin set is Geyser, Floodgate, and operational plugins (backup, pre-gen) only, unless re-evaluated against P-7. |
| **P-11** | Running Minecraft raises sustained CPU utilisation, which **helps** against the provider's idle-instance reclamation. A welcome side effect, not a design goal. |

> **Honest risk note:** 4 players on one shared vCPU is the tightest part of this design. P-7 and
> P-8 exist to catch it early rather than discovering it with four kids online.

---

## 7. Networking & DNS requirements

Vastly simpler than the Pi design — a static public IP removes DDNS entirely.

| ID | Requirement |
|---|---|
| **N-1** | `minecraft.example.net` SHALL be a **DNS-only (grey cloud) A record** → `198.51.100.20`. Cloudflare's proxy does not carry Minecraft traffic on the free plan. |
| **N-2** | ⚠️ It SHALL be an **explicit record overriding the proxied `*.example.net` wildcard**. Verified 2026-08-10: `minecraft.example.net` currently resolves to Cloudflare proxy IPs (shared proxy addresses) via that wildcard, which would silently break every client. |
| **N-3** | The hostname SHALL stay a **single subdomain level with a hyphen** — Universal SSL covers one level only. That is a certificate constraint, not a style choice. |
| **N-4** | **No DDNS of any kind is required.** The IP is static. *(The Cloudflare API updater specified in v1 is obsolete and SHALL NOT be built.)* |
| **N-5** | **UDP 19133** (Bedrock/Geyser) SHALL be opened in **both** `firewalld` **and** the cloud firewall. Both layers are required; either alone silently fails. *(19133, not the Bedrock default 19132 — see N-11a.)* **Met 2026-08-10**, verified by RakNet unconnected ping from off-site returning the MOTD on both the IP and `minecraft.example.net`. |
| **N-6** | **TCP 25565** (Java Edition) SHALL be opened in both layers. |
| **N-7** | An **SRV record** `_minecraft._tcp.minecraft.example.net` → `minecraft.example.net` port 25565, satisfying F-7. |
| **N-8** | The container SHALL be isolated from unrelated containers on the box, sharing only what ingress requires. |
| **N-9** | ⚠️ The **Cloudflare origin lockdown** currently restricting inbound to Cloudflare ranges SHALL NOT be weakened for HTTP. The Minecraft ports are separate and SHALL be opened without touching the existing HTTP posture. |
| **N-10** | Opening these ports SHALL NOT affect the server's SSH posture — **port 22 stays closed**, access remains via the SSH tunnel (`sshtunnel.example.net`). |

### 7.1 PS5 connectivity

> ## ⚠️ The PS5 path needs the **player's own** PlayStation Plus
>
> **Minecraft Bedrock on PS4/PS5 requires an active PlayStation Plus subscription for online
> multiplayer, and that includes third-party servers like this one.** Verified 2026-08-11 after
> Helder attempted a real connection. It is Sony's platform gate, not Mojang's and not ours;
> without it the console is limited to single-player, local splitscreen and LAN.
>
> **This is a per-player prerequisite.** Helder holds no subscription and will not buy one, so
> **MarNar plays from the iPad** — but each friend's console is gated by *that* family's
> subscription, and Helder confirmed 2026-08-11 that some of the friends have PS Plus. **The
> console path is therefore in active use, not stranded.**
>
> ⚠️ **Nothing in N-11 … N-17 is wrong, and nothing below changes this gate.** BedrockConnect and
> the DNS redirect solve the *addressing* problem — a console that cannot type a server address.
> They do not touch the *authorisation* gate, which is checked by the platform before any of
> this is reached. Both are needed; neither substitutes for the other.
>
> **This was an unstated assumption at the foundation of the design.** PS Plus appeared nowhere
> in this repository before 2026-08-11 — not here, not in `SETUP-PS5.md`, not in the README.
> The known-open item was "the PS5 path has not been walked on a real console", which framed the
> risk as *whether DNS fallback behaves*; the actual risk was *whether a console can join at
> all*. See **N-18**.
>
> **Current state: deployed and in use.** `bedrock-connect` and `mc-dns` are running, port 53 is
> open, and Geyser is on 19133. Player-facing instructions live in `SETUP-PS5.md` and in the
> admin panel's *How to join* card.

**PS5 Minecraft does not allow entering a custom server address.** A platform restriction with
no server-side fix.

| ID | Requirement |
|---|---|
| **N-18** | ⚠️ **PlayStation Plus is a hard prerequisite for the PS5 path — per player, not per server.** *Verified 2026-08-11 by attempted connection and confirmed against multiple sources.* Sony requires an active PS Plus subscription for online multiplayer in any paid title, third-party servers included. **Helder, 2026-08-11: not held in this household, and will not be purchased** — so MarNar plays from the **iPad**. **Helder, 2026-08-11: some of MarNar's friends do have PS Plus**, and their consoles can join normally; the console path stays built, documented and supported for them. Each console is gated by its own family's subscription, which the server cannot see or influence. ⚠️ A LAN-style bridge was **raised and deliberately not investigated** — Sony permits LAN multiplayer without PS Plus, but whether a remote server can be presented to a PS5 as a LAN game in 2026 is **unverified and is recorded here as unknown, not as an option**. Do not repeat it as a possibility without testing it. |
| **N-11** | **BedrockConnect** SHALL be self-hosted on the server, so approved players point their console DNS at the server's own resolver rather than a public third-party one. |
| **N-12** | Its server list SHALL contain **only** this server. |
| **N-11a** | **BedrockConnect SHALL own UDP 19132**, and Geyser SHALL move to 19133. This is forced, not a preference: every console "featured server" entry hard-codes port 19132, so whatever the console is redirected to must answer there. The two cannot share the port. This is what makes F-8 unachievable. |
| **N-13** | **UDP/TCP 53** SHALL be opened in both `firewalld` and the cloud firewall. *(Unlike the home connection, no ISP or router sits in the path here.)* |
| **N-14** | The DNS service SHALL apply **per-source-IP rate limiting** so it cannot be used as a traffic amplifier. **Met 2026-08-10**: `marnar-mc-dns-ratelimit`, 5/sec per source with a burst of 20; an 80-query flood from one address yielded exactly 20 replies and 60 drops, and a normal query still answered afterwards. ⚠️ The rule matches **`--dport 1053`**, not 53 — `DOCKER-USER` sits in the FORWARD path, *after* Docker's DNAT has already rewritten the published port to the container port. A rule written against 53 installs cleanly and matches nothing. |
| **N-15** | Recursion SHALL be **disabled**; it answers only BedrockConnect's fixed hostname set and refuses everything else. It SHALL NOT be a general-purpose resolver. |
| **N-16** | Amplification factor SHALL be **measured, not assumed**, before port 53 is opened, and SHALL stay below 2×. **Measured 2026-08-10: worst case 1.95×** (a minimal 37-byte A query for one of the six redirected names drawing a 72-byte reply). The original text of this requirement guessed "≈1×"; the real figure is recorded here instead. 1.95× is a poor reflector — the classic open-resolver attacks run 30–50× — and N-14 caps the sustained output per source regardless, but the number is not 1 and should not be written down as if it were. Anything above 2× means the Corefile has started answering something it should refuse; re-run `amptest.py` after any Corefile change. |
| **N-17** | A **player-facing setup guide** SHALL be written for PS5, iPad and PC, in plain language suitable for a child or a friend's parent. |

---

## 8. Access control requirements

Core requirement: **only explicitly approved people can connect.**

| ID | Requirement |
|---|---|
| **A-1** | The allowlist (`white-list=true`) SHALL be enforced; unlisted accounts rejected at login. |
| **A-1a** | The server SHALL be commissioned with an **empty allowlist and enforcement ON**, so it is closed to everyone — including MarNar — until gamertags are supplied. *Confirmed 2026-08-10.* |
| **A-2** | `online-mode` SHALL be **true** — Java players authenticated against Mojang/Microsoft. |
| **A-3** | Bedrock players SHALL be authenticated against **Xbox Live via Floodgate**, so gamertags cannot be spoofed. |
| **A-4** | Floodgate players SHALL carry a distinguishing username prefix (default `.`) so identities cannot collide. |
| **A-5** | The allowlist SHALL live **in this Git repository** as the source of truth and be deployed to the server. |
| **A-6** | Operator (`op`) privileges SHALL be Helder's only, not granted to child players by default. |
| **A-7** | The server SHALL NOT be published to any public server list; `enable-query` disabled. |
| **A-8** | Removing a player from the allowlist SHALL also disconnect them if online. |

---

## 9. Security requirements

| ID | Requirement |
|---|---|
| **S-1** | The container SHALL run **non-root**, with `no-new-privileges:true` and unnecessary capabilities dropped — matching the hardening standard already used on this box. |
| **S-2** | Only 19132/UDP, 25565/TCP and 53 SHALL be exposed. No management, RCON or query port SHALL reach the internet. |
| **S-3** | If RCON is enabled, it SHALL bind to localhost only, with a strong generated password stored outside this repo. |
| **S-4** | ⚠️ **Blast radius SHALL be understood:** this box hosts live third-party sites. A Minecraft compromise SHALL NOT be able to reach them. Container isolation is a real security boundary here, not hygiene. |
| **S-5** | No secrets SHALL be committed. `.gitignore` SHALL enforce this; secrets injected as environment variables. |
| **S-6** | The repository SHALL be **private**. |
| **S-7** | Paper, Geyser and Floodgate SHALL be updated on a defined cadence. Geyser tracks Bedrock client releases and **will break joins when Mojang ships a client update** — see O-2. |
| **S-8** | A documented rollback SHALL exist: close the three ports and remove the DNS record, restoring the box's prior posture exactly. |
| **S-9** | The admin UI SHALL NOT be able to do anything on the host beyond a fixed, reviewable list of operations. **Met 2026-08-11.** The agent runs as `mcadmin`, an unprivileged user that is **not in the `docker` group**, and its only escalation is `sudo /usr/local/sbin/marnar-mc-adminctl`. The verb list in that script is therefore the complete set of things a compromise of the panel can achieve. ⚠️ The tempting simplification — put `mcadmin` in the `docker` group, or allow `docker` in sudoers so the agent can call `rcon-cli` directly — is not a simplification: `docker exec` into any container, or `docker run -v /:/host`, is a root shell on this host, and this host serves two other live third-party sites. The indirection is the requirement. |
| **S-10** | The admin UI SHALL be authenticated, and its API credential SHALL NOT be readable by the browser. **Met 2026-08-11.** Authentication is an NPM Access List (per A-1's "controlled access", and Helder's stated choice not to build a user database). The agent additionally requires a bearer token, which the UI container's nginx injects server-side — the browser never receives it, so a leaked page source is not a leaked API key. |
| **S-11** | Destructive admin operations SHALL be recoverable. **Met 2026-08-11.** Every world-replacing verb takes a fresh backup first and **renames** the old world to `world.replaced-<stamp>` rather than deleting it; a failed backup aborts the operation. The UI asks for one confirmation only — a deliberate usability choice — so the safety net is enforced server-side in `preserve_current_world()`, where it cannot be clicked past. |

---

## 10. Operations requirements

| ID | Requirement |
|---|---|
| **O-1** | Deployment SHALL be a **Docker Compose stack** versioned in this repo, deployed **CLI-first** to `/home/mcadmin/stacks/`, per the host's rules. **Not** via the Portainer UI. |
| **O-2** | A documented procedure SHALL exist for **Bedrock-client-update breakage**: when Mojang updates the Bedrock client, Geyser must be updated before players can rejoin. Expected and recurring, not an incident. |
| **O-3** | Images SHALL be **pinned** (never `latest`) and SHALL have a real `arm64`/`aarch64` manifest. |
| ~~**O-4**~~ | ~~World backups SHALL run **daily**, retaining ≥14 dailies and 4 weeklies.~~ ⛔ **SUPERSEDED 2026-08-11 by C-1/C-2/C-3/D-2 in [REQUIREMENTS-ADMIN-R2.md](REQUIREMENTS-ADMIN-R2.md).** *Helder: "I don't want backups to be executed automatically yet, this will come when we set up S3 if we get to that."* The schedule is off (`marnar-mc-backup.timer` disabled **and** stopped; the unit file is kept, with the reason in its header, so re-enabling is one command). The **script is untouched and still required** — it is invoked by the panel's "Make a copy" button and automatically by `preserve_current_world` before any destructive world operation, which is the only reason those are undoable. Retention cut 14+4 → **3+1**, because on-demand copies are one-per-press, not one-per-day, and a fortnight of them is ~4 GB nobody asked for. ⚠️ **Accepted consequence:** all existing archives were deleted at Helder's instruction (566 MB freed), so **the world currently exists in exactly one place** until a copy is next made. The original mechanism (04:00 timer, `save-off`/`save-all flush`, EXIT trap re-enabling saving on every path) was met 2026-08-10 and is what got re-armed here. |
| **O-4a** | ✅ **Offsite backups to Amazon S3 — MET 2026-08-19.** `marnar-mc-offsite` (weekly, Sundays 04:07) copies the world to `s3://my-minecraft-backups`. Proven end to end the day it was built: uploaded, downloaded again, `zstd -t` clean, all four players' data present. **It only uploads when somebody has actually played** — the newest mtime under `world/players/` against the last upload — because the obvious test, the mtime of the world tree, is useless: Paper rewrites `chunk_tickets.dat` and friends on every autosave with nobody online. A quiet week costs nothing, archive included. **Retention is by object version, not object age**, which is not a detail: "expire after N days" combined with skip-if-unchanged deletes the last copy during a quiet spell while the skip logic correctly declines to replace it. So one fixed key on a versioned bucket, and a rule that trims only non-current versions. Cost ≈ **$0.014/month** for two copies; S3 Standard is genuinely cheapest at this size, because Glacier's 90/180-day minimum billing durations cost *more* against a weekly-rotating 300 MB object. **Both of the conditions this item set were addressed:** ② the IAM key (`minecraft-backup-writer`) is `PutObject`/`GetObject`/`ListBucket` on this one bucket and **has no `DeleteObject`** — verified against the live key, which gets `AccessDenied` on delete, on `ListAllMyBuckets`, and on another bucket. ⚠️ ① is resolved **by the second route this item allowed, not the first**: the archives still contain `.rcon-cli.env`, `.paper.env` and `plugins/floodgate/key.pem`, so **the bucket is secret-bearing and must be treated as such**. Verified 2026-08-19: anonymous GET of the object returns **403**, anonymous bucket listing returns **403**, objects are SSE-AES256, and RCON has never been published beyond the container network (S-3), so the password is only meaningful to someone already inside it. If exclusion is preferred over containment, note that dropping `key.pem` from the archive logs every Bedrock player out on restore. **Revised the same day at Helder's instruction:** S3 is now the *store*, not a second copy. Both the weekly job and the panel's "Make a copy" delete the local archive as soon as `put` has verified the size in S3, and the panel restores directly from the bucket — download, size check, and a listing check for `world/level.dat`, all **before** the running world is moved aside. Local disk keeps only the `world.replaced-*` snapshot taken automatically before a destructive operation, which is the undo. Two consequences worth carrying: panel copies live under `copies/world-<stamp>.tar.zst` with **dated** keys, because the key is denied `s3:ListBucketVersions` (live 403) and a shared key would leave every copy but the newest unreachable; and **nothing on the box can prune `copies/`**, so a lifecycle rule on that prefix is an **open AWS-console action for Helder** or copies accumulate at ~295 MB / ~$0.007 each per month. |
| **O-5** | A restore SHALL be **tested once** before the server is opened to friends. An untested backup is not a backup. **Met 2026-08-10**: `marnar-mc-restore-test` unpacked the archive, booted a second throwaway Paper container against it on the same image and version with no ports published, and it reported `Done (31.676s)`. Then deleted itself. Worth noting the first backup attempt *failed* — it named `world_nether`/`world_the_end`, which Paper 26.x no longer uses — which is this requirement earning its place. |
| **O-6** | The server SHALL be **always-on**, restarting automatically on host reboot (`restart: unless-stopped`). |
| **O-6a** | A **scheduled nightly restart** SHALL clear JVM memory pressure and heap fragmentation. It SHALL warn players online and force a world save first. **Met 2026-08-10**: `marnar-mc-restart.timer` at 05:00, warning at 60/30/10 seconds in Spanish, then `save-all flush`, then restart. |
| **O-7** | Server health SHOULD be visible via a documented check. |
| **O-8** | Player-facing setup guides (N-17) SHALL live in this repo under `docs/`. |
| **O-9** | Disk growth SHALL be monitored; the world border (P-5) is the primary control. |
| **O-10** | ⚠️ Adding a tenant to the host SHALL be reflected in the host's documentation, so its operators are not surprised by new ports and a new stack. |

---

## 11. Out of scope

- Monetisation of any kind (F-5).
- Public access or any public server listing (A-7).
- **The Raspberry Pi** — tried, unreachable inbound, abandoned as host (§4.2).
- Debugging the router's port forwarding. Parked, not solved.
- Modded Minecraft — Geyser crossplay does not survive most mods.
- **Resizing the instance — permanently, with no revisit condition** (§4.2, P-9a).
- Reopening SSH port 22 on the server (N-10).

---

## 12. Open questions

| # | Question | Blocks |
|---|---|---|
| ~~Q-2~~ | ~~What are the actual gamertags/usernames for the initial allowlist?~~ ✅ **ANSWERED — confirmed by Helder 2026-08-19.** Four on the roster: four players, all Bedrock. ⚠️ **The gamertags themselves are deliberately not written here** (F-10a) — they live in `/home/mcadmin/stacks/minecraft/roster/allowlist.txt` on the server, which is where the sync reads them from and which rides along in the backup. What is recorded here is that the question is settled, not the answer. **Two more are expected**, to fill the six-player roster F-9 was raised for. | A-5 |
| ~~Q-7~~ | ~~Is an offsite copy of the world backup wanted?~~ **Answered 2026-08-11: yes — Amazon S3.** ⏸️ **Deliberately deferred**, not forgotten: Helder wants the server proven in a real play test before adding another moving part. Until then, backups stay local-only on the boot volume, and the accepted risk is that losing that volume loses the world. Tracked as **O-4a**. | O-4a |
| ~~Q-9~~ | ~~Confirm difficulty and dimensions.~~ **Resolved 2026-08-10: Normal difficulty, Nether and End both enabled.** | — |
| ~~Q-11~~ | ~~Is ~134 ms latency acceptable to MarNar in practice?~~ ✅ **CLOSED 2026-08-19 by Helder: yes.** Tested on the devices actually used, with friends, playing together. The only symptom reported is a brief lag when a player first connects in a session, clearing after a few seconds — consistent with chunk streaming to the client, and matched by the logs, which contain **no tick-lag warnings at all**. Helder also confirmed the other tenants on the box showed no issues during play. Closed so emphatically that the player target went up: see F-9. | — |
| **Q-13** | ~~**What is this server for now, given that the PS5 is out?**~~ ✅ **CLOSED by Helder 2026-08-11**, the same day it was raised. Its premise was wrong: PS Plus is a **per-player** gate, and some of MarNar's friends' families hold it (N-18), so the console path was never dead. Settled with it: the console path is **not** dismantled, `bedrock-connect` / `mc-dns` / port 53 **stay**, and Geyser **stays on 19133** — F-8 remains abandoned as recorded, not reopened. The one item that did not depend on the premise, the LAN avenue in N-18, remains **untested and unclaimed**; it is not an option until somebody tests it. Kept in the register rather than deleted so the reversal stays visible. | N-18, F-8, F-9 |
| **Q-12** | Should the world be seeded fresh, or is there an existing world to import? ⚠️ **Answered by default, and it is now costly to change.** A fresh world was generated with seed **`1944975880419099066`** and pre-generated to the 3000-block border. Importing a different world after this point means discarding that work and re-running pre-generation (~1h per dimension on this box). If there *is* an existing world to bring over, say so before anyone starts building. | F-1 |

---

## 13. Decision log

| Date | Decision | By |
|---|---|---|
| 2026-08-10 | Paper + Geyser + Floodgate (forced: no ARM64 Bedrock Dedicated Server exists) | Analysis |
| 2026-08-10 | Support Java + Bedrock crossplay in one world | Helder |
| 2026-08-10 | Private GitHub repository | Helder |
| 2026-08-10 | Host on the Raspberry Pi; cloud VM rejected over resize capacity risk | Helder |
| 2026-08-10 | DDNS via a Cloudflare API updater; ingress via NPM Streams | Helder |
| 2026-08-10 | **Pi abandoned** — inbound unreachable; CGNAT, double NAT, ISP blocking and host firewall all ruled out by measurement; router not honouring saved forwards | Analysis |
| 2026-08-10 | **Host on the cloud VM at 1 vCPU, player target cut 8 → 4** rather than accept the resize risk | Helder |
| 2026-08-10 | DDNS and NPM Streams both dropped — a static IP makes them unnecessary | Analysis |
| 2026-08-10 | Self-host BedrockConnect with rate limiting; pin to latest Geyser-supported version; PvP off, keepInventory on; always-on with nightly restart | Helder |
| 2026-08-10 | Correction recorded: recorded free-tier allowance is 2 vCPU / 12 GB, not 4 / 24 | Analysis |
| 2026-08-10 | Pi test artefacts removed; six containers untouched | Analysis |
| 2026-08-10 | Difficulty Normal; **Nether and End enabled**; allowlist commissioned empty with enforcement on | Helder |
| 2026-08-10 | Full unattended install authorised, **including exposing port 53** for BedrockConnect, subject to N-14/N-15/N-16 | Helder |
| 2026-08-11 | **Offsite backups → Amazon S3**, but deferred until after a real play test; local-only accepted in the meantime (O-4a) | Helder |
| 2026-08-11 | **Instance resizing removed as an escalation option entirely** — P-9a; it was a settled decision that the docs kept re-opening | Helder |
| 2026-08-11 | **Admin panel Revision 2** — the panel's audience is MarNar, 12: bilingual ES/EN with a sticky switch, plain-language copy written to teach, and expandable "¿Qué es esto?" per section. See [REQUIREMENTS-ADMIN-R2.md](REQUIREMENTS-ADMIN-R2.md) | Helder |
| 2026-08-11 | **Scheduled backups off** (O-4 superseded), and **all existing archives deleted** — the pre-operation backup was kept as the safety net. Accepted: no restore point exists until one is made | Helder |
| 2026-08-10 | **F-8 abandoned**: Geyser moved to 19133 so BedrockConnect can own 19132. PS5 is the primary objective and is unaffected; iPad/PC pay one extra field | Analysis |
| 2026-08-10 | N-16 rewritten from the assumed "≈1×" to the **measured 1.95×**, with a <2× ceiling as the actual gate | Analysis |
| 2026-08-11 | ⛔ **PS5 path found to be blocked by a PlayStation Plus requirement** — verified after a real connection attempt. An unstated assumption that sat under the whole design and appeared nowhere in this repo (N-18) | Analysis |
| 2026-08-11 | **No PS Plus is held in this household and none will be purchased.** MarNar plays on iPad | Helder |
| 2026-08-11 | **Q-13 closed**: the server keeps its current shape. Nothing is dismantled, port 53 stays open, Geyser stays on 19133, F-8 stays abandoned | Helder |
| 2026-08-11 | ↩️ **"The console path is unusable" reversed the same day** — PS Plus is a **per-player** gate, and some of MarNar's friends' families hold it. The console path stays built and supported; the PS5 guide and the admin panel now carry the prerequisite instead of a block notice. Q-13's premise falls with it | Helder |
| 2026-08-11 | **Document the finding, change nothing operationally** — no teardown, port 53 stays open, Geyser stays on 19133, the stacks stay deployed. Scope of the server left open as Q-13 | Helder |
| 2026-08-19 | **Q-11 closed: latency is acceptable.** Verified by a real multi-player session on the actual devices; the only symptom is a few seconds' lag at first connect | Helder |
| 2026-08-19 | **Player target raised 4 → 6** (F-9), with heap 1536M → 1792M and the container ceiling 2048m → 2304m. The 1 vCPU constraint is unchanged and 8 stays abandoned | Helder |
| 2026-08-19 | **O-4a delivered** — weekly off-site copy to S3, upload-only IAM key, retention by object version. The off-site gap raised on 2026-08-11 is closed | Analysis |
| 2026-08-19 | **The S3 bucket is secret-bearing**, rather than stripping secrets from the archive — O-4a allowed either. Chosen because excluding `floodgate/key.pem` logs every Bedrock player out on restore. Containment verified: anonymous GET and LIST both 403, SSE-AES256, RCON never published (S-3) | Analysis |
| 2026-08-19 | **A removed player was never actually removed** — `whitelist remove <name>` is a no-op against a Bedrock account, so the sync silently failed for everyone but MarNar. Found by inspection, not by symptom; examplefriend had kept access for three days | Analysis |
| 2026-08-10 | Nether border set to **375**, i.e. overworld ÷ 8, so every in-border overworld location has a reachable Nether counterpart and no more | Analysis |
| 2026-08-19 | **Difficulty lowered to Easy and one sleeper skips the night**, on the complaint that the world was too hard | Helder |
| 2026-08-19 | **Play settings belong in the panel, not behind "make a new world"** — everything MarNar complained about is a live setting, so the fix must not cost him his builds. World generation stays a separate, destructive operation | Analysis |
| 2026-08-19 | ⚠️ **MC 26.2 made gamerules per-dimension and renamed them all to snake_case.** `keepInventory` → `keep_inventory`, `naturalRegeneration` → `natural_health_regeneration`, `doInsomnia` → `spawn_phantoms`, `doDaylightCycle` → `advance_time`, `doFireTick` → the numeric `fire_spread_radius_around_player`. Old names are rejected outright. Taken from the server jar, not from memory | Analysis |
| 2026-08-19 | **Every gamerule write goes to all three dimensions.** The RCON console runs in the overworld, so the obvious one-line write silently half-applies — which is how F-1b came to be false in the Nether for the whole life of the world | Analysis |
| 2026-08-19 | **Difficulty is stored twice on purpose** — over RCON for now, and as `MC_DIFFICULTY` in `.env` for next boot — because itzg rewrites `server.properties` from the container environment on every start. `marnar-mc-restart` re-applies stored settings afterwards, since `compose restart` reuses the stale environment | Analysis |
| 2026-08-19 | **No presets, individual controls only** — a preset that silently overwrites a deliberately-set value is worse than making MarNar read nine labels | Helder |
| 2026-08-19 | **PvP left out of the settings panel** so that every control in it is instant and downtime-free | Helder |
| 2026-08-19 | **World-generation choices added to the new-world form** (F-12a): world type and structures, stored in `.env` and applied by the recreate a new world already does | Analysis |
| 2026-08-19 | **S3 becomes the store; the disk only stages.** Helder: *"why do we keep backups locally if we have them in S3? I prefer to upload to S3 and have the capability to restore it from S3 and not use disk space to hold them out."* Both jobs now delete the local archive once `put` has verified the size in S3, and the panel restores straight from the bucket. The only copy that stays on disk is the automatic `world.replaced-*` taken immediately before a destructive operation | Helder |
| 2026-08-19 | **Panel copies get dated keys under `copies/`, not one shared key**, because the box is denied `s3:ListBucketVersions` (verified — a live 403). With a shared name only the newest copy would be reachable, i.e. every deliberate "before I try something risky" copy would be invisible | Analysis |
| 2026-08-19 | ⚠️ **The restore button warns that restoring costs money — kept after being shown that it does not.** Measured: a restore is **$0.00**, inside AWS's 100 GB/month free egress allowance (~2.7¢ beyond it). Helder chose the warning anyway, as a brake on a twelve-year-old pressing a button that replaces a world. The measured figure is in the *¿Qué es esto?* help on the same screen, so nothing in the panel is false | Helder |
| 2026-08-19 | **Panel copies expire after 7 days**, matching the non-current window on the weekly key. A copy is taken right before something risky, so its value is in the first days; `world.tar.zst` remains underneath, so age-based expiry on `copies/` cannot leave the world unprotected | Helder |
| 2026-08-19 | ⚠️ **The two lifecycle rules are kept from overlapping, rather than relying on how S3 merges them.** `keep-two-world-copies` was created with scope "entire bucket", so it also governed `copies/`, where its `NewerNoncurrentVersions: 1` would have retained each expired copy for ever. AWS documents conflict resolution for overlapping *expirations* but not for differing retention counts, so the rule is scoped to the `world.tar.zst` prefix instead | Analysis |
| 2026-08-19 | **The panel caps a new world at 4500 blocks**, while the shell tool keeps 500–20000. Pre-generation cost scales with *area*, so the difference between 4500 and 20000 is not 4× the wait, it is ~20× | Helder |
| 2026-08-19 | **Amplified world type left out** — heaviest to generate, cost never measured on this shared vCPU, and it is the option a kid is most likely to pick | Analysis |
| 2026-08-19 | **Hardcore left out** — it contradicts the keep-items-on-death decision taken the same morning | Analysis |
| 2026-08-19 | **Bonus chest is impossible, not declined** — itzg's `property-definitions.json` exposes no such property, so the image has no way to pass it through. Verified in the running image | Analysis |
| 2026-08-19 | **Making a new world now requires typing NUEVO/NEW.** It is the only control in the panel that destroys something no backup restores for free | Analysis |
