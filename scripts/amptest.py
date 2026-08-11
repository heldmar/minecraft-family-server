"""Measure the DNS amplification factor of the mc-dns resolver (N-16).

Sends each probe as a raw UDP datagram and compares bytes-out to bytes-in.
A factor near 1.0 means the service cannot be used as a reflector: the reply
it would mail to a spoofed victim is no bigger than the packet that triggered it.
"""
import socket
import struct

TARGET = ("198.51.100.20", 53)


def build(name: str, qtype: int, edns_udp: int | None = None) -> bytes:
    q = b""
    for label in name.split("."):
        q += bytes([len(label)]) + label.encode()
    q += b"\x00" + struct.pack(">HH", qtype, 1)
    arcount = 1 if edns_udp else 0
    pkt = struct.pack(">HHHHHH", 0x1234, 0x0100, 1, 0, 0, arcount) + q
    if edns_udp:
        # OPT RR advertising a large buffer — the setup an attacker would use
        # to coax the biggest possible reply.
        pkt += b"\x00" + struct.pack(">HHIH", 41, edns_udp, 0, 0)
    return pkt


PROBES = [
    ("hivebedrock.network", 1, None, "answered A record"),
    ("hivebedrock.network", 255, None, "answered zone, ANY"),
    ("hivebedrock.network", 1, 4096, "answered A, EDNS 4096"),
    ("isc.org", 255, 4096, "refused, ANY + EDNS 4096"),
    ("google.com", 1, 4096, "refused, EDNS 4096"),
    (".".join(["a" * 60] * 3) + ".hivebedrock.network", 1, 4096, "long name, EDNS 4096"),
]

worst = 0.0
for name, qtype, edns, label in PROBES:
    pkt = build(name, qtype, edns)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(8)
    try:
        s.sendto(pkt, TARGET)
        resp, _ = s.recvfrom(65535)
        factor = len(resp) / len(pkt)
        worst = max(worst, factor)
        print(f"{label:28s} out={len(pkt):4d}B  in={len(resp):5d}B  factor={factor:.2f}x")
    except socket.timeout:
        print(f"{label:28s} out={len(pkt):4d}B  no reply (factor 0.00x)")
    finally:
        s.close()

print(f"\nworst observed amplification factor: {worst:.2f}x")
print("N-16 ceiling is 2.00x. Baseline measured 2026-08-10 was 1.95x.")
print("Above 2x means the Corefile has started answering something it should refuse.")
raise SystemExit(0 if worst < 2.0 else 1)
