#!/usr/bin/env python3
"""Host agent for the MarNar's Minecraft Server admin UI.

Deliberately written against the Python standard library only. The box is a
single shared vCPU running two other live sites, a Postgres, a routing
engine and the game server; adding a virtualenv and a dependency tree so a
five-page admin panel can have a web framework is a bad trade. Python 3.9 (the
system interpreter) is the floor.

Shape follows a monitoring dashboard already on this host: the agent listens on
the docker bridge gateway, the UI container proxies /api to it, and nginx
injects the bearer token server-side so it never reaches the browser.

The agent itself is unprivileged. Every privileged action is one exec of
/usr/local/sbin/marnar-mc-adminctl through sudo, and that script decides what is
allowed. Nothing here builds a shell string: argument lists only, so a gamertag
containing shell metacharacters is data, not code (adminctl validates it too —
both layers, because this is the layer that faces the internet).
"""

import hmac
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ADMINCTL = "/usr/local/sbin/marnar-mc-adminctl"

# ⚠️ NOT under /home/mcadmin. That directory is mode 700 and owned by the operator,
# so an unprivileged service account cannot even traverse it — the failure looks
# nothing like a permissions problem either, because os.path.exists() swallows
# EACCES and returns False, so makedirs cheerfully tries to create /home/mcadmin.
# The staging area lives in /var/lib, which is where a service's state belongs
# anyway; adminctl (running as root) reads uploads out of here.
UPLOADS = "/var/lib/marnar-mc-admin/uploads"
TOKEN = os.environ.get("MCADMIN_TOKEN", "")
HOST = os.environ.get("MCADMIN_HOST", "172.18.0.1")
PORT = int(os.environ.get("MCADMIN_PORT", "8788"))

# Refuse to start rather than start unauthenticated. An admin panel that can
# regenerate the world silently losing its auth is the worst possible failure
# mode, so it is a startup error, not a warning in a log nobody reads.
if len(TOKEN) < 24:
    sys.exit("MCADMIN_TOKEN must be set and at least 24 characters")

MAX_UPLOAD = 2 * 1024 * 1024 * 1024  # 2 GB — a big world, with room to spare


# ---------------------------------------------------------------------------
# jobs
#
# Regenerating a world takes about 45 minutes. That cannot be an HTTP request:
# the browser, nginx and NPM would all time out long before it finished, and a
# retry would start a SECOND regeneration on top of the first. So long verbs
# become jobs — start one, get an id, poll it — and only one may run at a time.
# ---------------------------------------------------------------------------
class Job:
    def __init__(self, op, argv):
        self.id = uuid.uuid4().hex[:12]
        self.op = op
        self.argv = argv
        self.state = "running"
        self.started = time.time()
        self.finished = None
        self.lines = []
        self.lock = threading.Lock()

    def as_dict(self, tail=400):
        with self.lock:
            return {
                "id": self.id,
                "op": self.op,
                "state": self.state,
                "started": self.started,
                "finished": self.finished,
                "elapsed": int((self.finished or time.time()) - self.started),
                "log": self.lines[-tail:],
            }


JOBS = {}
JOBS_LOCK = threading.Lock()


def current_job():
    with JOBS_LOCK:
        for job in JOBS.values():
            if job.state == "running":
                return job
    return None


def start_job(op, argv, actor):
    """Start a long-running verb. Returns (job, error)."""
    running = current_job()
    if running:
        # Serialising is not politeness, it is correctness: two of these at once
        # means two processes moving the same world directory.
        return None, "%s is already running — wait for it to finish" % running.op

    job = Job(op, argv)
    with JOBS_LOCK:
        JOBS[job.id] = job
        # Keep the last handful for the UI's history panel, drop the rest.
        if len(JOBS) > 20:
            for old in sorted(JOBS.values(), key=lambda j: j.started)[:-20]:
                if old.state != "running":
                    JOBS.pop(old.id, None)

    def run():
        try:
            proc = subprocess.Popen(
                ["sudo", "-n", ADMINCTL] + argv,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env=dict(os.environ, MCADMIN_ACTOR=actor),
                text=True,
                bufsize=1,
            )
            for line in proc.stdout:
                with job.lock:
                    job.lines.append(line.rstrip("\n"))
                    # A runaway verb must not be able to exhaust the agent's
                    # memory through its own log.
                    if len(job.lines) > 5000:
                        del job.lines[:1000]
            code = proc.wait()
            with job.lock:
                job.state = "ok" if code == 0 else "failed"
        except Exception as exc:  # noqa: BLE001 - surfaced to the operator
            with job.lock:
                job.lines.append("agent error: %s" % exc)
                job.state = "failed"
        finally:
            with job.lock:
                job.finished = time.time()

    threading.Thread(target=run, daemon=True).start()
    return job, None


def run_verb(argv, actor, timeout=120):
    """Run a short verb synchronously. Returns (stdout, error)."""
    try:
        proc = subprocess.run(
            ["sudo", "-n", ADMINCTL] + argv,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=dict(os.environ, MCADMIN_ACTOR=actor),
        )
    except subprocess.TimeoutExpired:
        return None, "timed out"
    if proc.returncode != 0:
        # adminctl writes its refusals to stderr in a form meant to be read by a
        # person, so pass it straight through instead of inventing a message.
        return None, (proc.stderr or proc.stdout).strip() or "failed"
    return proc.stdout, None


SAFE_UPLOAD = re.compile(r"^[A-Za-z0-9._-]{1,120}$")


class Handler(BaseHTTPRequestHandler):
    server_version = "mcadmin/1.0"

    # ---- plumbing --------------------------------------------------------
    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.actor(), fmt % args))

    def actor(self):
        # NPM terminates the basic auth, so the agent never sees a username.
        # The client IP is the honest answer to "who did this" and it is what
        # goes in the audit log — do not dress it up as an identity it is not.
        return self.headers.get("X-Real-IP") or self.client_address[0]

    def authed(self):
        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return False
        return hmac.compare_digest(header[7:], TOKEN)

    def reply(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def reply_raw(self, stdout, key="data"):
        """adminctl already emitted JSON — pass it through, don't re-encode."""
        if stdout is None:
            return self.reply(500, {"error": "no output"})
        try:
            self.reply(200, json.loads(stdout))
        except ValueError:
            self.reply(200, {key: stdout})

    def body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length))
        except ValueError:
            return {}

    # ---- routes ----------------------------------------------------------
    def do_GET(self):  # noqa: N802 - BaseHTTPRequestHandler API
        if not self.authed():
            return self.reply(401, {"error": "unauthorized"})
        path = self.path.split("?")[0].rstrip("/") or "/"
        actor = self.actor()

        if path in ("/", "/health"):
            return self.reply(200, {"ok": True})
        if path == "/status":
            out, err = run_verb(["status"], actor, timeout=30)
            return self.reply(200, {"error": err}) if err else self.reply_raw(out)
        if path == "/players":
            out, err = run_verb(["players-list"], actor, timeout=30)
            return self.reply(200, {"error": err}) if err else self.reply_raw(out)
        if path == "/world":
            out, err = run_verb(["world-info"], actor, timeout=30)
            return self.reply(200, {"error": err}) if err else self.reply_raw(out)
        if path == "/settings":
            out, err = run_verb(["settings-get"], actor, timeout=30)
            return self.reply(200, {"error": err}) if err else self.reply_raw(out)
        if path == "/backups":
            out, err = run_verb(["backups-list"], actor, timeout=30)
            return self.reply(200, {"error": err}) if err else self.reply_raw(out)
        if path == "/audit":
            out, err = run_verb(["audit"], actor, timeout=30)
            entries = []
            for line in (out or "").splitlines():
                parts = line.split("\t")
                if len(parts) == 3:
                    entries.append({"at": parts[0], "actor": parts[1], "what": parts[2]})
            return self.reply(200, {"entries": entries, "error": err})
        if path == "/logs":
            out, err = run_verb(["logs", "150"], actor, timeout=30)
            return self.reply(200, {"lines": (out or err or "").splitlines()})
        if path == "/jobs":
            with JOBS_LOCK:
                jobs = [j.as_dict(tail=0) for j in sorted(JOBS.values(), key=lambda j: -j.started)]
            return self.reply(200, {"jobs": jobs})
        if path.startswith("/jobs/"):
            job = JOBS.get(path.rsplit("/", 1)[-1])
            if not job:
                return self.reply(404, {"error": "no such job"})
            return self.reply(200, job.as_dict())
        return self.reply(404, {"error": "not found"})

    def do_POST(self):  # noqa: N802
        if not self.authed():
            return self.reply(401, {"error": "unauthorized"})
        path = self.path.split("?")[0].rstrip("/")
        actor = self.actor()
        data = self.body()

        if path == "/players":
            platform = str(data.get("platform", ""))
            tag = str(data.get("tag", "")).strip()
            note = str(data.get("note", ""))[:80]
            out, err = run_verb(["players-add", platform, tag, note], actor)
            return self.reply(400 if err else 200, {"error": err} if err else {"ok": True, "output": out})

        # One setting per request. adminctl owns the allow-list of keys and the
        # type check on the value; nothing here decides what is legal, it only
        # passes the pair through and reports the refusal.
        if path == "/settings":
            key = str(data.get("key", "")).strip()
            value = str(data.get("value", "")).strip()
            out, err = run_verb(["settings-set", key, value], actor)
            return self.reply(400 if err else 200, {"error": err} if err else {"ok": True, "output": out})

        if path == "/players/sync":
            out, err = run_verb(["players-sync"], actor)
            return self.reply(400 if err else 200, {"error": err} if err else {"ok": True, "output": out})

        if path.startswith("/players/") and path.endswith("/kick"):
            tag = path.split("/")[2]
            out, err = run_verb(["players-kick", tag], actor)
            return self.reply(400 if err else 200, {"error": err} if err else {"ok": True})

        if path == "/jobs":
            op = str(data.get("op", ""))
            if op == "backup":
                argv = ["backup-now"]
            elif op == "restart":
                argv = ["server-restart"]
            elif op == "regenerate":
                seed = str(data.get("seed", "")).strip()
                size = str(data.get("size", "3000")).strip()
                argv = ["world-regenerate", seed, size]
            elif op == "import":
                argv = ["world-import", str(data.get("archive", ""))]
            elif op == "restore":
                argv = ["world-restore", str(data.get("backup", ""))]
            else:
                return self.reply(400, {"error": "unknown operation"})
            job, err = start_job(op, argv, actor)
            if err:
                return self.reply(409, {"error": err})
            return self.reply(202, {"job": job.id})

        return self.reply(404, {"error": "not found"})

    def do_DELETE(self):  # noqa: N802
        if not self.authed():
            return self.reply(401, {"error": "unauthorized"})
        path = self.path.split("?")[0].rstrip("/")
        if path.startswith("/players/"):
            tag = path.split("/", 2)[2]
            out, err = run_verb(["players-remove", tag], self.actor())
            return self.reply(400 if err else 200, {"error": err} if err else {"ok": True, "output": out})
        return self.reply(404, {"error": "not found"})

    def do_PUT(self):  # noqa: N802
        """World upload. Raw body, not multipart — the browser sends the File
        object straight through, which avoids parsing multipart in the stdlib
        and means one less place for a filename to sneak a path separator in."""
        if not self.authed():
            return self.reply(401, {"error": "unauthorized"})
        path = self.path.split("?")[0]
        if not path.startswith("/uploads/"):
            return self.reply(404, {"error": "not found"})

        name = os.path.basename(path[len("/uploads/"):])
        if not SAFE_UPLOAD.match(name):
            return self.reply(400, {"error": "bad filename"})
        if not name.endswith((".tar.zst", ".tar.gz", ".tgz", ".zip")):
            return self.reply(400, {"error": "must be .zip, .tar.gz or .tar.zst"})

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_UPLOAD:
            return self.reply(400, {"error": "missing or oversized upload"})
        free = shutil.disk_usage(UPLOADS).free if os.path.isdir(UPLOADS) else 0
        # A world upload that fills the boot volume takes the other sites
        # down with it. Require room for the upload plus its extraction.
        if free < length * 3:
            return self.reply(507, {"error": "not enough disk space for this upload"})

        dest = os.path.join(UPLOADS, name)
        written = 0
        with open(dest + ".partial", "wb") as handle:
            while written < length:
                chunk = self.rfile.read(min(1024 * 1024, length - written))
                if not chunk:
                    break
                handle.write(chunk)
                written += len(chunk)
        if written != length:
            os.unlink(dest + ".partial")
            return self.reply(400, {"error": "upload truncated"})
        os.replace(dest + ".partial", dest)
        return self.reply(200, {"ok": True, "archive": name, "bytes": written})


def main():
    # The installer owns directory creation, not the agent — the agent runs
    # under ProtectSystem=strict with exactly one writable path, so anything it
    # tries to create outside that is a bug rather than a fallback.
    if not os.path.isdir(UPLOADS):
        sys.exit("%s does not exist — run admin/install.sh" % UPLOADS)
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    sys.stderr.write("mcadmin-agent listening on %s:%d\n" % (HOST, PORT))
    server.serve_forever()


if __name__ == "__main__":
    main()
