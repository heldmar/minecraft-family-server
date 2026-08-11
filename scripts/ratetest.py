"""Verify the port-53 rate limit (N-14) actually drops a flood.

Sends 80 queries as fast as possible from one source address and counts replies.
With a 5/sec cap and a burst of 20, a well-behaved console is never affected but
a flood should be cut off well short of 80.
"""
import socket
import struct
import time

TARGET = ("198.51.100.20", 53)
N = 80

q = b"\x0bhivebedrock\x07network\x00" + struct.pack(">HH", 1, 1)
pkt = struct.pack(">HHHHHH", 0x4321, 0x0100, 1, 0, 0, 0) + q

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.setblocking(False)
sent = 0
for _ in range(N):
    s.sendto(pkt, TARGET)
    sent += 1

replies = 0
deadline = time.time() + 6
while time.time() < deadline:
    try:
        s.recvfrom(4096)
        replies += 1
    except BlockingIOError:
        time.sleep(0.02)
s.close()

print(f"sent {sent} queries in a burst -> {replies} replies")
print(f"dropped {sent - replies} ({100 * (sent - replies) / sent:.0f}%)")
print("PASS: limiter engaged" if replies < sent else "FAIL: nothing was dropped")
