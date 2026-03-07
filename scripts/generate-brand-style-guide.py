#!/usr/bin/env python3
"""
Generate a concise, marketing-friendly Brand Style Guide PDF from frontend source tokens.

Usage:
  python3 scripts/generate-brand-style-guide.py
  python3 scripts/generate-brand-style-guide.py --output brand/Sessionly_Brand_Style_Guide.pdf
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
from collections import Counter
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.utils import simpleSplit
    from reportlab.pdfgen import canvas
except ModuleNotFoundError as exc:  # pragma: no cover
    raise SystemExit(
        "Missing dependency: reportlab. Install it with "
        "`python3 -m pip install reportlab` (or in a virtualenv), then rerun."
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = ROOT / "src"
THEME_CSS = SRC_ROOT / "styles" / "theme.css"
FONTS_CSS = SRC_ROOT / "styles" / "fonts.css"
LANDING_TSX = SRC_ROOT / "app" / "pages" / "LandingPage.tsx"
LOGO_COMPONENT = SRC_ROOT / "app" / "components" / "SessionlyLogo.tsx"
HEX_PATTERN = re.compile(r"#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})")


# ---------- Parsing ----------


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_var_block(css: str, selector: str) -> Dict[str, str]:
    # Handles selectors like :root and .dark
    pattern = re.compile(rf"{re.escape(selector)}\s*\{{(.*?)\}}", re.S)
    match = pattern.search(css)
    if not match:
        return {}

    out: Dict[str, str] = {}
    for name, value in re.findall(r"--([a-zA-Z0-9-]+)\s*:\s*([^;]+);", match.group(1)):
        out[name.strip()] = value.strip()
    return out


def resolve_css_value(value: str, token_map: Dict[str, str], seen: set[str] | None = None) -> str:
    seen = seen or set()
    current = value.strip()

    var_ref = re.fullmatch(r"var\(--([a-zA-Z0-9-]+)(?:,[^)]+)?\)", current)
    if var_ref:
        name = var_ref.group(1)
        if name in seen:
            return current
        if name not in token_map:
            return current
        seen.add(name)
        return resolve_css_value(token_map[name], token_map, seen)

    # Handle mixed values, e.g. linear-gradient(... var(--x) ...)
    def _replace(match: re.Match[str]) -> str:
        name = match.group(1)
        if name in seen or name not in token_map:
            return match.group(0)
        seen.add(name)
        return resolve_css_value(token_map[name], token_map, seen)

    return re.sub(r"var\(--([a-zA-Z0-9-]+)(?:,[^)]+)?\)", _replace, current)


def resolve_var_map(raw_vars: Dict[str, str]) -> Dict[str, str]:
    return {name: resolve_css_value(value, raw_vars) for name, value in raw_vars.items()}


def parse_selector_block(css: str, selector: str) -> Dict[str, str]:
    pattern = re.compile(rf"\b{re.escape(selector)}\s*\{{(.*?)\}}", re.S)
    m = pattern.search(css)
    if not m:
        return {}
    block = m.group(1)
    return {k.strip(): v.strip() for k, v in re.findall(r"([a-zA-Z-]+)\s*:\s*([^;]+);", block)}


def parse_google_fonts(fonts_css: str) -> Dict[str, List[int]]:
    families: Dict[str, List[int]] = {}
    for chunk in re.findall(r"family=([^&']+)", fonts_css):
        chunk = chunk.strip()
        if ":" in chunk:
            family, axes = chunk.split(":", 1)
        else:
            family, axes = chunk, ""
        family = family.replace("+", " ")
        weights = sorted({int(w) for w in re.findall(r"(?<!\d)(\d{3})(?!\d)", axes)})
        families[family] = weights
    return families


def extract_logo_spec(logo_code: str) -> Dict[str, object]:
    stops = re.findall(r'stopColor="(#[0-9A-Fa-f]{3,8})"', logo_code)
    path_match = re.search(r'd="\s*([\s\S]*?)"\s*\n\s*stroke=\{`url\(#\$\{sId\}\)`\}', logo_code)
    s_path = " ".join(path_match.group(1).split()) if path_match else ""

    app_name_match = re.search(r">\s*([A-Za-z][A-Za-z0-9 ]+)\s*<\s*\/span>", logo_code)
    app_name = app_name_match.group(1).strip() if app_name_match else "Sessionly"

    gold_match = re.search(r'<circle[^>]*r="2"[^>]*fill="(#[0-9A-Fa-f]{3,8})"', logo_code)
    gold = gold_match.group(1) if gold_match else "#D4A853"

    return {
        "app_name": app_name,
        "gradient_stops": stops or ["#D4926E", "#C17A5A", "#A3613F"],
        "s_path": s_path,
        "gold": gold,
    }


def extract_tagline(landing_code: str) -> str:
    h1_match = re.search(r"<h1[^>]*>([\s\S]*?)</h1>", landing_code)
    if not h1_match:
        return "Everything you want to say in therapy — organized."

    raw = h1_match.group(1)
    clean = re.sub(r"<[^>]+>", " ", raw)
    clean = re.sub(r"\{[^}]+\}", " ", clean)
    clean = " ".join(clean.split())
    if clean:
        return clean
    return "Everything you want to say in therapy — organized."


def extract_spacing_usage(paths: Iterable[Path]) -> Counter:
    pattern = re.compile(
        r"(?<![\w-])(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)-(?:\[[^\]]+\]|-?\d+(?:\.\d+)?|px)(?![\w-])"
    )
    counter: Counter = Counter()
    for path in paths:
        text = read_text(path)
        counter.update(pattern.findall(text))
    return counter


def extract_shadow_usage(paths: Iterable[Path]) -> Counter:
    pattern = re.compile(
        r"(?<![\w-])(?:shadow(?:-(?:xs|sm|md|lg|xl|2xl|inner|none|\[[^\]]+\]))?|drop-shadow(?:-[a-z0-9\[\]-]+)?)(?![\w-])"
    )
    counter: Counter = Counter()
    for path in paths:
        text = read_text(path)
        counter.update(pattern.findall(text))
    return counter


def spacing_token_to_px(token: str) -> float | None:
    raw = token.split("-", 1)[1]
    if raw == "px":
        return 1.0
    if raw.startswith("[") and raw.endswith("]"):
        v = raw[1:-1]
        if v.endswith("px"):
            try:
                return float(v[:-2])
            except ValueError:
                return None
        return None
    try:
        return float(raw) * 4
    except ValueError:
        return None


def parse_px_or_rem(value: str) -> float | None:
    value = value.strip()
    if value.endswith("px"):
        try:
            return float(value[:-2])
        except ValueError:
            return None
    if value.endswith("rem"):
        try:
            return float(value[:-3]) * 16
        except ValueError:
            return None
    return None


def eval_radius(radius_expr: str) -> float | None:
    # only need --radius directly for this guide
    return parse_px_or_rem(radius_expr)


# ---------- Drawing helpers ----------


def hex_value(text: str) -> str:
    m = HEX_PATTERN.search(text)
    if not m:
        return text.strip()

    raw = m.group(0).upper()
    if len(raw) == 4:  # #RGB -> #RRGGBB
        return "#" + "".join(ch * 2 for ch in raw[1:])
    if len(raw) == 9:  # #RRGGBBAA -> #RRGGBB for swatch display
        return raw[:7]
    return raw


def as_color(text: str, fallback: str = "#000000") -> colors.Color:
    hv = hex_value(text)
    if not hv.startswith("#"):
        hv = fallback
    return colors.HexColor(hv)


def luminance(c: colors.Color) -> float:
    return 0.2126 * c.red + 0.7152 * c.green + 0.0722 * c.blue


def pick_text_on(bg: colors.Color) -> colors.Color:
    return colors.white if luminance(bg) < 0.52 else colors.HexColor("#1A1814")


def draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, width: float, font: str, size: float, leading: float) -> float:
    c.setFont(font, size)
    lines = simpleSplit(text, font, size, width)
    yy = y
    for line in lines:
        c.drawString(x, yy, line)
        yy -= leading
    return yy


def draw_logo(c: canvas.Canvas, x: float, y: float, size: float, logo_spec: Dict[str, object]) -> None:
    stops = list(logo_spec.get("gradient_stops", ["#D4926E", "#C17A5A", "#A3613F"]))
    base_col = colors.HexColor(stops[1] if len(stops) > 1 else "#C17A5A")
    light_col = colors.HexColor(stops[0])
    dark_col = colors.HexColor(stops[2] if len(stops) > 2 else stops[-1])
    gold_col = colors.HexColor(str(logo_spec.get("gold", "#D4A853")))

    path_d = str(logo_spec.get("s_path", ""))
    nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", path_d)]

    c.saveState()
    scale = size / 48.0
    c.translate(x, y)
    c.scale(scale, scale)
    c.translate(0, 48)
    c.scale(1, -1)

    c.setFillColor(base_col)
    c.roundRect(0, 0, 48, 48, 12, fill=1, stroke=0)

    c.setFillColor(light_col)
    c.setFillAlpha(0.22)
    c.roundRect(0, 24, 48, 24, 12, fill=1, stroke=0)
    c.setFillColor(dark_col)
    c.setFillAlpha(0.18)
    c.roundRect(0, 0, 48, 18, 12, fill=1, stroke=0)
    c.setFillAlpha(1)

    c.setStrokeColor(colors.Color(1, 1, 1, alpha=0.14))
    c.setLineWidth(0.75)
    c.roundRect(1, 1, 46, 46, 11, fill=0, stroke=1)

    if len(nums) >= 8:
        p = c.beginPath()
        p.moveTo(nums[0], nums[1])
        i = 2
        while i + 5 < len(nums):
            p.curveTo(nums[i], nums[i + 1], nums[i + 2], nums[i + 3], nums[i + 4], nums[i + 5])
            i += 6

        c.setStrokeColor(colors.white)
        c.setLineWidth(3.4)
        c.setLineCap(1)
        c.drawPath(p, fill=0, stroke=1)

        c.setStrokeColor(colors.Color(1, 1, 1, alpha=0.32))
        c.setLineWidth(0.6)
        c.drawPath(p, fill=0, stroke=1)

    c.setFillColor(gold_col)
    c.circle(33, 11, 2, fill=1, stroke=0)
    c.setFillColor(colors.Color(0.93, 0.85, 0.64, alpha=0.7))
    c.circle(33, 11, 0.8, fill=1, stroke=0)

    c.restoreState()


def draw_page_label(c: canvas.Canvas, width: float, height: float, title: str, subtitle: str | None = None) -> float:
    m = 40
    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(m, height - m, title)
    y = height - m - 18
    if subtitle:
        c.setFillColor(colors.HexColor("#6B645D"))
        c.setFont("Helvetica", 10)
        c.drawString(m, y, subtitle)
        y -= 10
    c.setStrokeColor(colors.HexColor("#E0D9D0"))
    c.line(m, y, width - m, y)
    return y - 14


# ---------- Pages ----------


def page_cover(c: canvas.Canvas, width: float, height: float, app_name: str, tagline: str, logo_spec: Dict[str, object], root_vars: Dict[str, str]) -> None:
    bg = as_color(root_vars.get("background", "#F7F4F0"))
    fg = as_color(root_vars.get("foreground", "#1A1814"))
    secondary = as_color(root_vars.get("secondary", "#F0EDE8"))

    c.setFillColor(bg)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    m = 44
    logo_size = 94
    draw_logo(c, m, height - m - logo_size, logo_size, logo_spec)

    c.setFillColor(fg)
    c.setFont("Times-Bold", 44)
    c.drawString(m + logo_size + 22, height - m - 26, app_name)

    c.setFont("Helvetica-Bold", 26)
    c.drawString(m, height - m - logo_size - 38, "Brand Style Guide")

    c.setFillColor(colors.HexColor("#4F4944"))
    draw_wrapped(
        c,
        tagline,
        m,
        height - m - logo_size - 62,
        width - 2 * m,
        "Helvetica",
        14,
        18,
    )

    chip_y = 122
    chips = [
        ("Primary", root_vars.get("primary", "#C17A5A")),
        ("Accent", root_vars.get("accent", "#4A6741")),
        ("Background", root_vars.get("background", "#F7F4F0")),
        ("Foreground", root_vars.get("foreground", "#1A1814")),
    ]

    x = m
    for name, value in chips:
        col = as_color(value)
        c.setFillColor(col)
        c.roundRect(x, chip_y, 116, 40, 10, fill=1, stroke=0)
        c.setFillColor(pick_text_on(col))
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 10, chip_y + 24, name)
        c.setFont("Helvetica", 8)
        c.drawString(x + 10, chip_y + 10, hex_value(value))
        x += 126

    c.setFillColor(secondary)
    c.roundRect(m, 52, width - 2 * m, 44, 12, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#6B645D"))
    c.setFont("Helvetica", 9)
    c.drawString(m + 14, 70, "Extracted from theme variables, typography rules, and logo component in the codebase")
    c.drawRightString(width - m - 14, 58, dt.datetime.now().strftime("Generated %Y-%m-%d"))

    c.showPage()


def draw_swatch(c: canvas.Canvas, x: float, y: float, w: float, h: float, name: str, value: str, big: bool = True) -> None:
    col = as_color(value)
    c.setFillColor(col)
    c.roundRect(x, y, w, h, 10 if big else 8, fill=1, stroke=0)

    txt = pick_text_on(col)
    c.setFillColor(txt)
    c.setFont("Helvetica-Bold", 11 if big else 9)
    c.drawString(x + 10, y + h - (20 if big else 15), name)
    c.setFont("Helvetica", 9 if big else 8)
    c.drawString(x + 10, y + (12 if big else 9), hex_value(value))


def page_palette_typography(
    c: canvas.Canvas,
    width: float,
    height: float,
    root_vars: Dict[str, str],
    fonts: Dict[str, List[int]],
    type_rules: Dict[str, Dict[str, str]],
) -> None:
    y = draw_page_label(c, width, height, "Core Visual System", "Primary + extended palette, then typography")
    m = 40

    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(m, y, "Primary Palette")
    y -= 16

    primary_tokens = [
        ("Primary", root_vars.get("primary", "#C17A5A")),
        ("Secondary", root_vars.get("secondary", "#F0EDE8")),
        ("Accent", root_vars.get("accent", "#4A6741")),
        ("Background", root_vars.get("background", "#F7F4F0")),
        ("Foreground", root_vars.get("foreground", "#1A1814")),
        ("Muted", root_vars.get("muted", "#F0EDE8")),
    ]

    gap = 12
    sw_w = (width - 2 * m - 2 * gap) / 3
    sw_h = 74
    for i, (name, value) in enumerate(primary_tokens):
        row = i // 3
        col = i % 3
        x = m + col * (sw_w + gap)
        yy = y - row * (sw_h + gap) - sw_h
        draw_swatch(c, x, yy, sw_w, sw_h, name, value, big=True)

    y = y - 2 * (sw_h + gap) - 10

    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(m, y, "Extended Palette")
    y -= 14

    extended_tokens = [
        ("Success", root_vars.get("sage", "#4A6741")),
        ("Error", root_vars.get("destructive", "#C0392B")),
        ("Warning", root_vars.get("gold", "#D4A853")),
        ("Info", root_vars.get("ring", "#C17A5A")),
        ("Border", root_vars.get("border", "#E0D9D0")),
        ("Muted Text", root_vars.get("text-secondary", "#8A7F75")),
    ]

    sm_w = (width - 2 * m - 5 * 8) / 6
    sm_h = 46
    for i, (name, value) in enumerate(extended_tokens):
        x = m + i * (sm_w + 8)
        yy = y - sm_h
        draw_swatch(c, x, yy, sm_w, sm_h, name, value, big=False)

    y = y - sm_h - 18

    c.setStrokeColor(colors.HexColor("#E0D9D0"))
    c.line(m, y, width - m, y)
    y -= 14

    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(m, y, "Typography")
    y -= 14

    # Family and weight summary
    fam_text = []
    for fam, weights in fonts.items():
        w = ", ".join(str(v) for v in weights) if weights else "default"
        fam_text.append(f"{fam} ({w})")
    c.setFillColor(colors.HexColor("#6B645D"))
    c.setFont("Helvetica", 9)
    draw_wrapped(c, "Fonts: " + "  •  ".join(fam_text), m, y, width - 2 * m, "Helvetica", 9, 12)
    y -= 26

    samples = [
        ("h1", "Therapy clarity, organized", 600),
        ("h2", "Weekly session preparation", 600),
        ("h3", "Actionable reflection", 500),
        ("h4", "What stood out", 500),
        ("p", "Body copy supports calm readability and clear hierarchy.", 400),
    ]

    for selector, text, fallback_weight in samples:
        rule = type_rules.get(selector, {})
        family = rule.get("font-family", "Inter")
        size_str = rule.get("font-size", "15px")
        weight_str = rule.get("font-weight", str(fallback_weight))

        try:
            weight = int(re.findall(r"\d+", weight_str)[0])
        except Exception:
            weight = fallback_weight

        size_px = parse_px_or_rem(size_str) or 15
        if "playfair" in family.lower():
            font_name = "Times-Bold" if weight >= 600 else "Times-Roman"
        elif "mono" in family.lower():
            font_name = "Courier-Bold" if weight >= 500 else "Courier"
        else:
            font_name = "Helvetica-Bold" if weight >= 600 else "Helvetica"

        c.setFillColor(colors.HexColor("#8A7F75"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(m, y + 2, selector.upper())

        c.setFillColor(colors.HexColor("#1A1814"))
        c.setFont(font_name, max(9, min(size_px, 22)))
        c.drawString(m + 46, y, text)

        c.setFillColor(colors.HexColor("#6B645D"))
        c.setFont("Helvetica", 8)
        c.drawString(m + 46, y - 10, f"{family} • {size_str} • {weight_str}")
        y -= 24

    c.showPage()


def page_shape_spacing_logo(
    c: canvas.Canvas,
    width: float,
    height: float,
    root_vars: Dict[str, str],
    spacing_usage: Counter,
    shadow_usage: Counter,
    app_name: str,
    logo_spec: Dict[str, object],
) -> None:
    y = draw_page_label(c, width, height, "Shape, Spacing & Logo")
    m = 40

    # Shape
    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(m, y, "Shape Language")
    y -= 14

    radius_raw = root_vars.get("radius", "0.5rem")
    radius_px = eval_radius(radius_raw) or 8
    if radius_px <= 4:
        radius_style = "Sharp"
    elif radius_px <= 12:
        radius_style = "Rounded"
    else:
        radius_style = "Pill"

    c.setFillColor(colors.HexColor("#6B645D"))
    c.setFont("Helvetica", 10)
    c.drawString(m, y, f"Base radius token: {radius_raw} (~{radius_px:.0f}px) · visual style: {radius_style}")

    y -= 18
    for i, r in enumerate([4, radius_px, min(radius_px + 8, 18)]):
        x = m + i * 90
        c.setFillColor(colors.white)
        c.setStrokeColor(colors.HexColor("#D8D1C8"))
        c.roundRect(x, y - 26, 76, 26, r, fill=1, stroke=1)
        c.setFillColor(colors.HexColor("#5E5650"))
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + 38, y - 36, f"{r:.0f}px")

    # Spacing
    y -= 54
    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(m, y, "Spacing Feel")
    y -= 14

    top_spacing = spacing_usage.most_common(7)
    weighted = [(spacing_token_to_px(tok), count) for tok, count in spacing_usage.items()]
    weighted = [(px, ct) for px, ct in weighted if px is not None]
    avg_px = sum(px * ct for px, ct in weighted) / max(1, sum(ct for _, ct in weighted)) if weighted else 0
    if avg_px >= 14:
        density = "Relaxed"
    elif avg_px >= 8:
        density = "Balanced"
    else:
        density = "Compact"

    c.setFillColor(colors.HexColor("#6B645D"))
    c.setFont("Helvetica", 10)
    c.drawString(m, y, f"General spacing density: {density} (avg utility step ≈ {avg_px:.1f}px)")
    y -= 14

    max_px = max([(spacing_token_to_px(tok) or 0) for tok, _ in top_spacing] + [1])
    for tok, count in top_spacing:
        px = spacing_token_to_px(tok)
        bar_w = 180 * ((px or 0) / max_px)
        c.setFillColor(colors.HexColor("#1A1814"))
        c.setFont("Helvetica", 8)
        c.drawString(m, y, tok)
        c.setFillColor(colors.HexColor("#C17A5A"))
        c.roundRect(m + 62, y - 5, max(8, bar_w), 7, 3, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#7A7168"))
        c.drawString(m + 252, y, f"{(px or 0):.0f}px · {count}x")
        y -= 12

    # Shadow feel
    y -= 4
    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(m, y, "Shadow Style")
    y -= 14

    top_shadows = shadow_usage.most_common(3)
    label = ", ".join(f"{name} ({count}x)" for name, count in top_shadows) if top_shadows else "Minimal shadow usage"
    c.setFillColor(colors.HexColor("#6B645D"))
    c.setFont("Helvetica", 10)
    c.drawString(m, y, label)

    y -= 20

    # Logo on light/dark
    c.setStrokeColor(colors.HexColor("#E0D9D0"))
    c.line(m, y, width - m, y)
    y -= 18

    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(m, y, "Logo & Mark")
    y -= 14

    panel_w = (width - 2 * m - 14) / 2
    panel_h = 180

    light_bg = as_color(root_vars.get("background", "#F7F4F0"))
    dark_bg = colors.HexColor("#1A1814")

    # Light panel
    c.setFillColor(light_bg)
    c.roundRect(m, y - panel_h, panel_w, panel_h, 12, fill=1, stroke=0)
    draw_logo(c, m + 28, y - panel_h + 50, 76, logo_spec)
    c.setFillColor(colors.HexColor("#1A1814"))
    c.setFont("Times-Bold", 24)
    c.drawString(m + 112, y - panel_h + 92, app_name)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#6B645D"))
    c.drawString(m + 112, y - panel_h + 74, "Logo on light background")

    # Dark panel
    x2 = m + panel_w + 14
    c.setFillColor(dark_bg)
    c.roundRect(x2, y - panel_h, panel_w, panel_h, 12, fill=1, stroke=0)
    draw_logo(c, x2 + 28, y - panel_h + 50, 76, logo_spec)
    c.setFillColor(colors.HexColor("#F0EDE8"))
    c.setFont("Times-Bold", 24)
    c.drawString(x2 + 112, y - panel_h + 92, app_name)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#B7AEA5"))
    c.drawString(x2 + 112, y - panel_h + 74, "Logo on dark background")

    c.showPage()


# ---------- Build ----------


def collect_data() -> Dict[str, object]:
    theme = read_text(THEME_CSS)
    fonts_css = read_text(FONTS_CSS)
    landing = read_text(LANDING_TSX)
    logo_code = read_text(LOGO_COMPONENT)

    root_vars_raw = parse_var_block(theme, ":root")
    root_vars = resolve_var_map(root_vars_raw)
    fonts = parse_google_fonts(fonts_css)
    logo_spec = extract_logo_spec(logo_code)
    tagline = extract_tagline(landing)

    type_rules = {
        "h1": parse_selector_block(theme, "h1"),
        "h2": parse_selector_block(theme, "h2"),
        "h3": parse_selector_block(theme, "h3"),
        "h4": parse_selector_block(theme, "h4"),
        "p": parse_selector_block(theme, "p"),
    }

    files = [p for p in SRC_ROOT.rglob("*") if p.suffix in {".ts", ".tsx", ".css"}]
    spacing_usage = extract_spacing_usage(files)
    shadow_usage = extract_shadow_usage(files)

    return {
        "root_vars": root_vars,
        "fonts": fonts,
        "logo_spec": logo_spec,
        "app_name": logo_spec.get("app_name", "Sessionly"),
        "tagline": tagline,
        "type_rules": type_rules,
        "spacing_usage": spacing_usage,
        "shadow_usage": shadow_usage,
    }


def write_logo_asset(logo_spec: Dict[str, object], output_svg: Path) -> None:
    stops = logo_spec.get("gradient_stops", ["#D4926E", "#C17A5A", "#A3613F"])
    s_path = str(logo_spec.get("s_path", "")).strip()
    gold = str(logo_spec.get("gold", "#D4A853"))
    svg = f"""<svg width=\"96\" height=\"96\" viewBox=\"0 0 48 48\" xmlns=\"http://www.w3.org/2000/svg\">\n  <defs>\n    <linearGradient id=\"bg\" x1=\"4\" y1=\"4\" x2=\"44\" y2=\"44\" gradientUnits=\"userSpaceOnUse\">\n      <stop stop-color=\"{stops[0]}\"/>\n      <stop offset=\"0.5\" stop-color=\"{stops[1] if len(stops) > 1 else stops[0]}\"/>\n      <stop offset=\"1\" stop-color=\"{stops[2] if len(stops) > 2 else stops[-1]}\"/>\n    </linearGradient>\n  </defs>\n  <rect width=\"48\" height=\"48\" rx=\"12\" fill=\"url(#bg)\"/>\n  <rect x=\"1\" y=\"1\" width=\"46\" height=\"46\" rx=\"11\" stroke=\"white\" stroke-opacity=\"0.14\" stroke-width=\"0.75\"/>\n  <path d=\"{s_path}\" stroke=\"white\" stroke-width=\"3.4\" stroke-linecap=\"round\" fill=\"none\"/>\n  <path d=\"{s_path}\" stroke=\"white\" stroke-width=\"0.6\" stroke-linecap=\"round\" stroke-opacity=\"0.3\" fill=\"none\"/>\n  <circle cx=\"33\" cy=\"11\" r=\"2\" fill=\"{gold}\" opacity=\"0.85\"/>\n  <circle cx=\"33\" cy=\"11\" r=\"0.8\" fill=\"#EDD9A3\" opacity=\"0.6\"/>\n</svg>\n"""
    output_svg.write_text(svg, encoding="utf-8")


def generate(output: Path) -> None:
    data = collect_data()
    output.parent.mkdir(parents=True, exist_ok=True)

    logo_asset = output.parent / "sessionly-logo-extracted.svg"
    write_logo_asset(data["logo_spec"], logo_asset)

    c = canvas.Canvas(str(output), pagesize=A4)
    w, h = A4

    page_cover(c, w, h, str(data["app_name"]), str(data["tagline"]), data["logo_spec"], data["root_vars"])
    page_palette_typography(c, w, h, data["root_vars"], data["fonts"], data["type_rules"])
    page_shape_spacing_logo(
        c,
        w,
        h,
        data["root_vars"],
        data["spacing_usage"],
        data["shadow_usage"],
        str(data["app_name"]),
        data["logo_spec"],
    )

    c.save()


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate concise brand style guide PDF from frontend tokens.")
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "brand" / "Sessionly_Brand_Style_Guide.pdf",
        help="Output PDF path (default: frontend/brand/Sessionly_Brand_Style_Guide.pdf)",
    )
    args = parser.parse_args()

    generate(args.output)
    print(f"Brand style guide generated at: {args.output}")


if __name__ == "__main__":
    main()
