#!/usr/bin/env python3
"""Build the compact land mask used by the dotted globes in script.js.

Samples the sphere in rows of STEP degrees (fewer points toward the poles so
dots stay evenly spaced), tests each point against Natural Earth 1:110m land
polygons, and prints the result as a base64 bitstring. script.js decodes it
with the same sampling loop.

    python3 tools/landmask.py ne_110m_land.geojson
"""
import base64, json, math, sys

STEP = 1.5

def rings_of(geom):
    if geom["type"] == "Polygon":
        yield geom["coordinates"]
    elif geom["type"] == "MultiPolygon":
        yield from geom["coordinates"]

def inside(lon, lat, poly):
    hit = False
    for ring in poly:
        n = len(ring)
        for k in range(n):
            x1, y1 = ring[k][0], ring[k][1]
            x2, y2 = ring[(k + 1) % n][0], ring[(k + 1) % n][1]
            if (y1 > lat) != (y2 > lat):
                if lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
                    hit = not hit
    return hit

def main(path):
    polys = [p for f in json.load(open(path))["features"] for p in rings_of(f["geometry"])]
    bits, land = [], 0
    rows = int(180 / STEP)
    for i in range(rows):
        lat = -90 + STEP * (i + 0.5)
        n = max(1, round((360 / STEP) * math.cos(math.radians(lat))))
        for j in range(n):
            lon = -180 + (j + 0.5) * 360 / n
            b = any(inside(lon, lat, p) for p in polys)
            bits.append(1 if b else 0)
            land += b
    data = bytearray()
    for k in range(0, len(bits), 8):
        byte = 0
        for m, b in enumerate(bits[k:k + 8]):
            byte |= b << (7 - m)
        data.append(byte)
    sys.stderr.write(f"{len(bits)} samples, {land} land\n")
    print(base64.b64encode(bytes(data)).decode())

if __name__ == "__main__":
    main(sys.argv[1])
