# MarNar Minecraft — Requirements

> **Status:** Draft v1 — approved decisions recorded, implementation not started.
> **Date:** 2026-08-10
> **Owner:** Helder Martins
> **Host:** a single Linux box with Docker.

---

## 1. Purpose

Run a small, private, invitation-only Minecraft server on the MarNar Pi homelab so that
Helder's son ("MarNar") can play with a fixed group of friends, at no cost to the players,
reachable at `minecraft.example.net`.

This repository exists to version the server configuration, the allowlist, the deployment
stack and the operational runbooks — because the shape of this project is expected to change
and needs to be maintainable rather than hand-tuned on the box.

---

## 2. Users

| User | Devices | Edition |
|---|---|---|
| MarNar (primary) | PS5, iPad | Bedrock |
| MarNar's approved friends | mostly PS5; some PC, some iPad | Bedrock |
| Approved PC players | Windows/macOS/Linux | **Java** (crossplay required) |
| Helder (admin) | Mac, SSH to Pi | operator, not necessarily a player |

**Approved decision:** Java Edition and Bedrock Edition players share **one world**.

---

## 3. Measured environment (baseline, 2026-08-10)

These are live measurements, not estimates. They constrain everything below.

**Host — Raspberry Pi 4 Model B Rev 1.5 (`192.168.4.200`)**

| Property | Value |
|---|---|
| CPU | 4 × Cortex-A72, max 1.8 GHz, `aarch64` |
| RAM | 3795 MiB total · 722 MiB used · **3072 MiB available** |
| Swap | **zram only**, 2048 MiB (`/dev/zram0`) |
| Root disk | 29.2 GB SD card (`mmcblk0p2`), 24% used |
| Bulk disk | **916 GB USB (`/dev/sda2` → `/mnt/storage`), 866 GB free, 1% used** |
| Load average | 0.15 / 0.10 / 0.05 |
| Existing containers | 6 — a dashboard, two application containers, `cloudflared`, `npm-app`, `portainer` |
| Docker networks | `npm-network`, `marnar-mon_default`, plus defaults |

**Inherited posture from the earlier Pi design (must be consciously overridden, see §7):**

- Router ports 80/443 are **closed**; the only public ingress is an outbound tunnel.
- No-IP DUC (DDNS) was **removed 2026-08-03**, with a standing "do not reintroduce it" note.
- `*.example.net` is a **proxied** (orange-cloud) CNAME to the tunnel.

---

## 4. Architecture decision

### 4.1 Server software — Paper + GeyserMC + Floodgate

**Decision:** Run **PaperMC (Minecraft Java Edition server)** with the **GeyserMC** and
**Floodgate** plugins, containerised via the multi-arch `itzg/minecraft-server` image.

**Rationale — this is forced, not preferred:**

Mojang's official **Bedrock Dedicated Server (BDS) ships x86_64 binaries only. There is no
ARM64 build.** The Pi is `aarch64`. Emulation (Box64/QEMU) is not viable for a real-time game
tick loop on a Cortex-A72.

A Java server *is* ARM-native (OpenJDK `aarch64` is first-class), and Geyser translates the
Bedrock protocol so PS5/iPad/PC-Bedrock clients connect to it natively. Floodgate lets those
Bedrock players join **without owning a Java account**, authenticating them against Xbox Live
instead.

This also satisfies the crossplay requirement for free: Java and Bedrock players land in the
same world.

**Rejected alternatives:**

| Option | Why rejected |
|---|---|
| Official Bedrock Dedicated Server | No ARM64 build exists |
| BDS under Box64/QEMU emulation | Unacceptable tick performance on Cortex-A72 |
| PocketMine-MP (ARM-native, PHP) | Not vanilla-compatible; poor feature parity; no Java crossplay |
| Hosting on the cloud VM | Rejected by owner 2026-08-10 — see §4.2 |

### 4.2 Host — Raspberry Pi (the cloud VM rejected)

**Decision:** Host on the Pi.

The cloud VM was evaluated and **rejected**. Findings, recorded so this is not re-litigated:

- The cloud box is `aarch64` too, so it would have needed the same Paper+Geyser stack.
- It has **1 vCPU total**, already shared by 9 containers including two other live sites.
- Resizing to 2 vCPU / 12 GB is **within quota** (verified via the provider API: regional limits are
  `standard-a1-core-regional-count: 2`, `standard-a1-memory-regional-count: 12`; currently
  1 vCPU / 6 GB used in the availability domain), and the shape reports `is-flexible: true`.
- ⚠️ **Correction to the host's own notes:** that file states a 4 vCPU / 24 GB free
  allowance. This account's actual limit is **2 vCPU / 12 GB**. That note should be fixed.
- **Why rejected:** resizing requires stopping the instance, and the availability domain has recently
  been out of host capacity. A failed resize could leave the instance *stopped and unable to
  boot*, taking down `othersite`, `anothersite`, the other containers and the SSH tunnel for
  an indefinite period. Not an acceptable risk for a children's game server.

**Consequence accepted by the owner:** the Pi option requires reintroducing DDNS, publishing
the home IP in DNS, and opening inbound ports — reversing three deliberate v9 decisions. See
§7 and §9 for the required compensating controls.

---

## 5. Functional requirements

| ID | Requirement |
|---|---|
| **F-1** | The server SHALL run Minecraft in survival mode with a persistent world that survives restarts, host reboots and container recreation. |
| **F-2** | Bedrock Edition clients (PS5, iPad, PC Bedrock) SHALL be able to join. |
| **F-3** | Java Edition clients SHALL be able to join **the same world** as Bedrock clients. |
| **F-4** | Bedrock players SHALL NOT be required to own a Java Edition account (Floodgate). |
| **F-5** | No player SHALL be charged anything, and the server SHALL NOT collect payments or donations. |
| **F-6** | The server SHALL be reachable at the hostname `minecraft.example.net`. |
| **F-7** | Java clients SHOULD be able to connect by typing the hostname alone, with no port — via an SRV record. |
| **F-8** | Bedrock clients SHOULD be able to connect by typing the hostname alone, achieved by using the default Bedrock port 19132. |
| **F-9** | The server SHALL support **8 concurrent players** at acceptable performance (see §6). |
| **F-10** | An operator SHALL be able to add or remove an approved player by editing a file in this repository and running a documented deploy step — no ad-hoc edits on the box. |
| **F-11** | The world SHALL be backed up automatically on a schedule, with restore documented and tested. |

---

## 6. Performance & capacity requirements

The Pi is the binding constraint. 8 players on a 4 GB Pi is **tight but achievable**, and only
with the tuning below. These are requirements, not suggestions.

| ID | Requirement |
|---|---|
| **P-1** | The Minecraft container SHALL have a hard memory ceiling of **2560 MiB** (`mem_limit`), leaving ≥ 500 MiB headroom for the host and the 6 existing containers. |
| **P-2** | JVM heap SHALL be fixed at **`-Xms1800M -Xmx1800M`** (equal min/max to avoid heap resizing pauses), with Aikar's G1GC flags. |
| **P-3** | The JVM SHALL NOT be allowed to swap. Host swap is **zram-only (2 GB)**; a swapped JVM will destroy tick rate. Memory pressure SHALL be treated as an incident, not absorbed. |
| **P-4** | `view-distance` SHALL be **6** and `simulation-distance` **4**. |
| **P-5** | The world SHALL have a **world border** (initial target: 3000 blocks radius) to bound disk growth and chunk generation. |
| **P-6** | The world SHALL be **pre-generated** to the border (e.g. Chunky) before players are invited. Chunk generation is the dominant CPU spike on a Pi; pre-generating removes it from play time. |
| **P-7** | Server tick rate SHALL hold **≥ 18 TPS** with 8 players online in pre-generated terrain. |
| **P-8** | The world data SHALL live on **`/mnt/storage` (USB disk)**, never on the SD card — for both I/O performance and SD card lifetime. |
| **P-9** | No performance-heavy mods/plugins SHALL be installed. Plugin set is limited to Geyser, Floodgate, and operational plugins (backup, pre-gen) unless re-evaluated against P-7. |

> **Honest risk note:** if P-7 cannot be met at 8 players after tuning, the realistic options
> are to reduce the concurrent player target to 4–6, or to move the host. This is the known
> weak point of the chosen architecture and should be measured early.

---

## 7. Networking & DNS requirements

| ID | Requirement |
|---|---|
| **N-1** | `minecraft.example.net` SHALL be an **A record, DNS-only (grey cloud)**. Cloudflare's proxy does not carry Minecraft traffic on the free plan. |
| **N-2** | The record SHALL be an explicit record that **overrides the proxied `*.example.net` wildcard**. |
| **N-3** | The hostname SHALL remain a **single subdomain level with a hyphen** (`minecraft-public`, not `minecraft.public`) — Cloudflare Universal SSL covers only one level. Complies with the standing cross-project convention. |
| **N-4** | **UDP 19132** SHALL be forwarded on the router to `192.168.4.200` (Bedrock / Geyser). |
| **N-5** | **TCP 25565** SHALL be forwarded on the router to `192.168.4.200` (Java Edition). Required by F-3. |
| **N-6** | An **SRV record** `_minecraft._tcp.minecraft.example.net` SHALL point to the host on port 25565, satisfying F-7. |
| **N-7** | **DDNS SHALL be reintroduced** to keep the A record current against the dynamic home IP. |
| **N-8** | DDNS SHALL be implemented as a **Cloudflare API updater** (not No-IP), authenticated with a **scoped API token limited to `Zone.DNS:Edit` on the `example.net` zone only**. |
| **N-9** | The DDNS updater SHALL update **only** the `minecraft-public` record and SHALL NOT touch the wildcard, apex, or any tunnel-backed record. |
| **N-10** | The Minecraft container SHALL be on its **own Docker network**, not `npm-network`. NPM is irrelevant here — see N-11. |
| **N-11** | ⚠️ **NPM SHALL NOT be used to route this service.** NPM Streams forward by **port only**; UDP carries no SNI or Host header, so a hostname cannot select a backend. The hostname is purely a DNS A record; routing is by port number. A direct container port publish is equivalent and simpler. |
| **N-12** | Ports 80/443 SHALL remain closed and the existing tunnel SHALL remain the sole ingress for all **HTTP** services. This project opens 19132/UDP and 25565/TCP **only**. |

### 7.1 PS5 connectivity — unavoidable per-console step

**PS5 Minecraft does not allow entering a custom server address.** This is a platform
restriction with no server-side fix.

| ID | Requirement |
|---|---|
| **N-13** | A **BedrockConnect** instance SHALL be self-hosted on the Pi, so that approved players point their console DNS at the server's own resolver rather than a public third-party one. |
| **N-14** | The self-hosted BedrockConnect server list SHALL contain **only** this server. |
| **N-15** | The BedrockConnect DNS service SHALL be reachable by approved players (requires UDP/TCP 53 exposure — **see O-3, this needs a safe design before implementation**). |
| **N-16** | A **player-facing setup guide** SHALL be written for PS5, iPad and PC, in plain language suitable for a child or a friend's parent to follow. |

---

## 8. Access control requirements

The core requirement from the owner: **only explicitly approved people can connect.**

| ID | Requirement |
|---|---|
| **A-1** | The allowlist (`white-list=true`) SHALL be **enforced**. Unlisted accounts are rejected at login. |
| **A-2** | `online-mode` SHALL be **true** — Java players are authenticated against Mojang/Microsoft. Cracked/offline clients are rejected. |
| **A-3** | Bedrock players SHALL be authenticated against **Xbox Live via Floodgate**, so gamertags cannot be spoofed. |
| **A-4** | Floodgate-joined Bedrock players SHALL carry a distinguishing username prefix (default `.`) so Java and Bedrock identities cannot collide. |
| **A-5** | The allowlist SHALL be **stored in this Git repository** as the source of truth, and deployed to the server — never edited only on the box (supports F-10). |
| **A-6** | Operator (`op`) privileges SHALL be granted to Helder only, and SHALL NOT be granted to any child player by default. |
| **A-7** | The server SHALL NOT be published to any public server list, and `enable-query` SHALL be disabled. |
| **A-8** | Removing a player from the allowlist SHALL also disconnect them if currently online. |

---

## 9. Security requirements

Publishing the home IP in DNS is a real exposure increase over the v9 baseline. These are the
compensating controls.

| ID | Requirement |
|---|---|
| **S-1** | The container SHALL run as a **non-root user**, with `no-new-privileges:true` and unnecessary capabilities dropped — consistent with the hardening standard used on the server. |
| **S-2** | Only ports 19132/UDP and 25565/TCP SHALL be published. No management, RCON or query port SHALL be exposed to the internet. |
| **S-3** | If RCON is enabled at all, it SHALL bind to localhost/LAN only and use a strong generated password stored outside this repo. |
| **S-4** | The published home IP SHALL be understood as a **DDoS and scanning exposure**. A documented rollback SHALL exist: remove the DNS record and close the router forwards, restoring the v9 closed posture. |
| **S-5** | The Minecraft container SHALL be network-isolated from `npm-network` and from the host monitoring API. |
| **S-6** | No secrets (Cloudflare API token, RCON password) SHALL be committed to this repository. `.gitignore` SHALL enforce this and secrets SHALL be injected as environment variables. |
| **S-7** | The repository SHALL be **private**. |
| **S-8** | The server software (Paper, Geyser, Floodgate) SHALL be updated on a defined cadence; Geyser in particular tracks Bedrock client releases and **will break joins when Mojang ships a client update** — see O-2. |

---

## 10. Operations requirements

| ID | Requirement |
|---|---|
| **O-1** | Deployment SHALL be a **Docker Compose stack**, versioned in this repo, deployable to the Pi. Consistent with existing homelab practice. |
| **O-2** | A documented procedure SHALL exist for the **Bedrock-client-update breakage** case: when Mojang ships a Bedrock client update, Geyser must be updated before players can rejoin. This is expected and recurring, not an incident. |
| **O-3** | Container images SHALL be **pinned to specific tags** (not `latest`) and SHALL have a real `arm64`/`aarch64` manifest. |
| **O-4** | World backups SHALL run **daily** to `/mnt/storage`, with retention of at least 14 dailies and 4 weeklies. |
| **O-5** | A backup restore SHALL be **tested at least once** before the server is opened to friends. An untested backup is not a backup. |
| **O-6** | The stack SHALL restart automatically on host reboot (`restart: unless-stopped`). |
| **O-7** | Server health SHOULD be visible in the existing **monitoring** dashboard, or via a documented check. |
| **O-8** | Player-facing setup guides (N-16) SHALL live in this repo under `docs/`. |
| **O-9** | Disk growth SHALL be monitored; the world border (P-5) is the primary control. |

---

## 11. Out of scope

- Monetisation of any kind — no ranks, no cosmetics, no donations (F-5).
- Public access or any public server listing (A-7).
- The cloud VM (§4.2) — rejected as host, and out of scope per its own project rules.
- Modded Minecraft (Forge/Fabric modpacks). Geyser crossplay does not survive most mods.
- Anything requiring the host monitoring API or `npm-network` (S-5).
- Reopening ports 80/443 (N-12).

---

## 12. Open questions

| # | Question | Blocks |
|---|---|---|
| **Q-1** | Which Minecraft version to target? Geyser support lags the newest Bedrock release; pinning matters. | Implementation |
| **Q-2** | What are the actual gamertags/usernames for the initial allowlist? | A-5 |
| **Q-3** | Does the router support the required port forwards without UPnP, and is a static DHCP reservation already in place for `192.168.4.200`? | N-4, N-5 |
| **Q-4** | BedrockConnect requires exposing DNS (port 53). What is the safe design — restricted to known player IPs, or an alternative? **This is the least-resolved requirement.** | N-15 |
| **Q-5** | Should there be scheduled "server open" hours (parental control), or is it always-on? | O-6 |
| **Q-6** | Survival difficulty, PvP on/off, keep-inventory — the gameplay ruleset for a group of kids. | F-1 |
| **Q-7** | Is an offsite copy of the world backup wanted, or is `/mnt/storage` sufficient? | O-4 |

---

## 13. Decision log

| Date | Decision | By |
|---|---|---|
| 2026-08-10 | Host on the Raspberry Pi; cloud VM rejected due to host-capacity risk during resize | Helder |
| 2026-08-10 | Reintroduce DDNS (Cloudflare API updater), accepting home-IP publication | Helder |
| 2026-08-10 | Support Java + Bedrock crossplay in one world | Helder |
| 2026-08-10 | Size for 8 concurrent players | Helder |
| 2026-08-10 | Private GitHub repository | Helder |
| 2026-08-10 | Paper + Geyser + Floodgate (forced: no ARM64 Bedrock Dedicated Server exists) | Analysis |
| 2026-08-10 | NPM will not route this service (UDP has no hostname routing) | Analysis |
