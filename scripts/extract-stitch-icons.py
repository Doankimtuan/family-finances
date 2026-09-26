"""Extract reviewed 24px Stitch glyphs from the numbered contact sheets.

Run from the repository root: python3 scripts/extract-stitch-icons.py
The source HTML is design input; only allowlisted SVG primitives and attributes
are emitted as typed, static React icon data.
"""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "artifacts/icon-system-stitch/DESIGN.md"
SHEETS = ROOT / "artifacts/icon-system-stitch/generated"
OUTPUT = ROOT / "shared/ui/stitch-icon-artwork.ts"
ALLOWED_TAGS = {"path", "circle", "rect", "line", "polyline", "polygon", "ellipse"}
ALLOWED_ATTRS = {
    "d", "cx", "cy", "r", "rx", "ry", "x", "y", "width", "height",
    "x1", "y1", "x2", "y2", "points", "fill", "stroke",
    "stroke-dasharray", "stroke-width", "stroke-linecap", "stroke-linejoin",
    "transform", "opacity",
}
ATTRIBUTE_NAMES = {
    "stroke-dasharray": "strokeDasharray",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
}


def inventory() -> list[list[str]]:
    items: list[str] = []
    for line in DESIGN.read_text().splitlines():
        match = re.match(r"\*\*([A-L])\. ([^:]+):\*\* (.+)", line)
        if not match:
            continue
        names = match.group(3).split(". Tags may reuse")[0].rstrip(".")
        items.extend(
            name.replace(" **[stored]**", "").replace("**", "")
            for name in names.split(", ")
        )
    assert len(items) == 271, f"Expected 271 entries, got {len(items)}"
    chunks = [items[:5]]
    position = 5
    for size in [23, 23] + [22] * 10:
        chunks.append(items[position:position + size])
        position += size
    assert position == len(items)
    return chunks


def exported_name(key: str) -> str:
    return "Stitch" + "".join(part.capitalize() for part in key.split("-")) + "Icon"


def extract_svg(document: str, number: int, key: str) -> ET.Element:
    marker = re.search(
        rf"<!--\s*0?{number}\s*[:.·]\s*{re.escape(key)}(?=\s|\(|-->)",
        document,
        re.IGNORECASE,
    )
    assert marker, f"Missing card marker: {number} {key}"
    match = re.search(r"<svg\b[^>]*>.*?</svg>", document[marker.end():], re.DOTALL)
    assert match, f"Missing SVG: {number} {key}"
    svg = ET.fromstring(match.group())
    assert svg.attrib.get("viewBox") == "0 0 24 24", f"Wrong viewBox: {key}"
    return svg


def primitive_data(svg: ET.Element, key: str) -> list[list[object]]:
    primitives: list[list[object]] = []
    for child in svg:
        assert child.tag in ALLOWED_TAGS, f"Unsupported SVG tag in {key}: {child.tag}"
        attrs: dict[str, str] = {}
        for name, value in child.attrib.items():
            assert name in ALLOWED_ATTRS, f"Unsupported SVG attribute in {key}: {name}"
            if name == "stroke-width":
                continue  # AppIcon owns the family-wide stroke weight.
            # Three contact-sheet glyphs used a paper-colored cutout. Transparent
            # openings keep them legible on every semantic surface and theme.
            if value in {"white", "#FFFFFF", "#FAFAF9"}:
                assert key in {"pending-money", "period", "unread"}, key
                value = "none"
            attrs[ATTRIBUTE_NAMES.get(name, name)] = value
        primitives.append([child.tag, attrs])
    assert primitives, f"Empty SVG: {key}"
    return primitives


def main() -> None:
    icons: dict[str, list[list[object]]] = {}
    source: dict[str, int] = {}
    for sheet_number, chunk in enumerate(inventory(), 1):
        document = (SHEETS / f"sheet-{sheet_number:02d}.html").read_text()
        for item_number, key in enumerate(chunk, 1):
            svg = extract_svg(document, item_number, key)
            if key in icons:
                continue  # One canonical drawing for repeated semantic keys.
            icons[key] = primitive_data(svg, key)
            source[key] = sheet_number
    assert len(icons) == 259, f"Expected 259 unique glyphs, got {len(icons)}"
    lines = [
        'import type { IconSvgElement } from "@hugeicons/react";',
        "",
        "/** Static, reviewed SVG primitives extracted from the ViNha Stitch atlas. */",
    ]
    for key, primitives in icons.items():
        lines.append(f"/** {key} · Stitch sheet {source[key]:02d} */")
        lines.append(f"export const {exported_name(key)}: IconSvgElement = {json.dumps(primitives, ensure_ascii=False, separators=(',', ':'))};")
        lines.append("")
    OUTPUT.write_text("\n".join(lines))
    print(f"Extracted {len(icons)} icons to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
