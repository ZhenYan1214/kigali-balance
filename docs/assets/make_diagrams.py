"""Generate the README figures (light and dark variants) as plain SVG.

    python docs/assets/make_diagrams.py

No dependencies. Text uses the system UI font, so box widths are generous.
"""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).parent
FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace"

THEMES = {
    "light": dict(bg="#ffffff", card="#f6f8fa", border="#d0d7de", text="#1f2328", muted="#59636e",
                  teal="#0f766e", teal_bg="#e6f4f1", blue="#0969da", blue_bg="#ddf4ff",
                  amber="#9a6700", amber_bg="#fff8c5", red="#cf222e", red_bg="#ffebe9",
                  green="#1a7f37", green_bg="#dafbe1", line="#8c959f"),
    "dark": dict(bg="#0d1117", card="#151b23", border="#3d444d", text="#e6edf3", muted="#9198a1",
                 teal="#3fb9a6", teal_bg="#0f2a27", blue="#4493f8", blue_bg="#0c2d4f",
                 amber="#d29922", amber_bg="#2e2410", red="#f85149", red_bg="#3a1517",
                 green="#3fb950", green_bg="#12301b", line="#656c76"),
}


class Svg:
    def __init__(self, w, h, t):
        self.w, self.h, self.t, self.parts = w, h, t, []
        colors = ["line", "teal", "blue", "amber", "red", "green"]
        defs = "".join(
            f'<marker id="a-{c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{t[c]}"/></marker>' for c in colors)
        self.parts.append(f'<defs>{defs}</defs>')
        self.parts.append(f'<rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" rx="14" fill="{t["bg"]}" stroke="{t["border"]}"/>')

    def rect(self, x, y, w, h, fill, stroke, rx=10, dash=None, sw=1.5):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')

    def text(self, x, y, s, size=13, fill=None, weight=400, anchor="start", mono=False, italic=False):
        fam = MONO if mono else FONT
        st = ' font-style="italic"' if italic else ""
        self.parts.append(f'<text x="{x}" y="{y}" font-family="{escape(fam)}" font-size="{size}" font-weight="{weight}" '
                          f'fill="{fill or self.t["text"]}" text-anchor="{anchor}"{st}>{escape(s)}</text>')

    def line(self, pts, color="line", dash=None, sw=1.6, arrow=True, both=False):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        m = f' marker-end="url(#a-{color})"' if arrow else ""
        if both:
            m += f' marker-start="url(#a-{color})"'
        p = " ".join(f"{x},{y}" for x, y in pts)
        self.parts.append(f'<polyline points="{p}" fill="none" stroke="{self.t[color]}" stroke-width="{sw}"{d}{m} '
                          f'stroke-linejoin="round"/>')

    def pill(self, x, y, s, color, size=11.5, w=None):
        w = w or int(len(s) * size * 0.56 + 18)
        self.rect(x, y, w, 22, self.t[color + "_bg"], self.t[color], rx=11, sw=1)
        self.text(x + w / 2, y + 15, s, size=size, fill=self.t[color], weight=600, anchor="middle")
        return w

    def save(self, name, title):
        body = "".join(self.parts)
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
               f'viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{escape(title)}"><title>{escape(title)}</title>{body}</svg>\n')
        (OUT / name).write_text(svg, encoding="utf-8", newline="\n")


def node(s, x, y, w, h, color, title, lines, tag=None):
    t = s.t
    s.rect(x, y, w, h, t["card"], t[color], sw=1.8)
    s.rect(x, y, 5, h, t[color], t[color], rx=2, sw=0)
    s.text(x + 18, y + 26, title, size=15, weight=700)
    if tag:
        s.text(x + w - 14, y + 26, tag, size=11.5, fill=t[color], weight=700, anchor="end", mono=True)
    for i, ln in enumerate(lines):
        s.text(x + 18, y + 48 + i * 18, ln, size=12.5, fill=t["muted"])


# ---------------------------------------------------------------- life of a kilogram
def flow(theme):
    t = THEMES[theme]
    s = Svg(960, 486, t)
    s.text(28, 38, "Accepted transition", size=12, fill=t["muted"])
    s.line([(150, 34), (190, 34)], "teal")
    s.text(212, 38, "Kept on the ledger, never reclaimable or creditable", size=12, fill=t["muted"])
    s.line([(510, 34), (550, 34)], "amber", dash="2 3")

    W, H, Y = 200, 104, 70
    xs = [28, 262, 496]
    node(s, xs[0], Y, W, H, "blue", "VIRGIN lot", ["minted against a quota", "document, capped at its", "allowance"], "R1")
    node(s, xs[1], Y, W, H, "line", "In equipment", ["charged by a service", "company; the newest 180", "days are quarantined"])
    node(s, xs[2], Y, W, H, "teal", "RECOVERED lot", ["scale reading + owner", "co-signature; never more", "than is booked inside"], "R3")
    for a, b in [(0, 1), (1, 2)]:
        s.line([(xs[a] + W, Y + H / 2), (xs[b] - 4, Y + H / 2)], "teal", sw=2)

    RX, RW = 730, 202
    node(s, RX, Y, RW, H, "green", "RECLAIMED lot", ["output ≤ input × (1 − loss);", "lab certificate from an", "independent lab"], "R4")
    node(s, RX, 214, RW, H, "green", "DESTROYED", ["quantity and DRE signed", "by an independent", "verifier"], "R6")
    node(s, RX, 358, RW, 86, "teal", "Claimed once", ["one registry per", "destruction event"], "R7")
    s.line([(xs[2] + W, Y + H / 2), (RX - 4, Y + H / 2)], "teal", sw=2)
    s.line([(xs[2] + W, Y + H / 2), (710, Y + H / 2), (710, 266), (RX - 4, 266)], "teal", sw=2)
    s.line([(RX + RW / 2, 214 + H), (RX + RW / 2, 354)], "teal", sw=2)

    # rejected paths
    ry = 230
    s.rect(28, ry, 668, 228, t["card"], t["border"], rx=12, sw=1)
    s.text(46, ry + 28, "Rejected on chain", size=13.5, weight=700)
    s.text(678, ry + 28, "revert error", size=11.5, fill=t["muted"], anchor="end")
    rows = [
        ("R1", "Minting beyond the quota document's allowance", "QuotaExceeded"),
        ("R3", "Recovery without the unit owner's co-signature", "NotUnitOwner"),
        ("R3", "Recovering more than the unit could still hold", "RecoveryExceedsContent"),
        ("R4", "Reclaimed output above input minus losses", "ReclaimExceedsInput"),
        ("R5", "Virgin or unknown gas fed into reclamation", "ClassNotReclaimable"),
        ("R6", "Destruction certified by the destroyer itself", "VerifierNotIndependent"),
        ("R7", "A second registry claiming the same destruction", "AlreadyClaimed"),
    ]
    for i, (r, what, err) in enumerate(rows):
        yy = ry + 56 + i * 25
        s.text(46, yy, r, size=12, fill=t["red"], weight=700, mono=True)
        s.text(82, yy, what, size=12.5)
        s.text(678, yy, err, size=11.5, fill=t["muted"], anchor="end", mono=True)
    s.line([(xs[2] + W / 2, Y + H), (xs[2] + W / 2, 189)], "amber", dash="2 3", sw=1.4)
    s.rect(xs[2] - 6, 193, 212, 24, t["amber_bg"], t["amber"], rx=12, sw=1, dash="2 3")
    s.text(xs[2] + 100, 209, "charged < 180 days ago: tier C", size=11.5, fill=t["amber"], weight=600, anchor="middle")
    s.save(f"kilogram-flow-{theme}.svg", "Life of a kilogram on the Kigali Balance ledger")


# ---------------------------------------------------------------- architecture
def architecture(theme):
    t = THEMES[theme]
    s = Svg(960, 640, t)

    def header(x, y, s_, color):
        s.text(x, y, s_.upper(), size=11.5, fill=t[color], weight=700)

    # left: independent signers
    header(28, 40, "Independent signers · EIP-712", "blue")
    signers = [("Scale device", "weighs every transfer, bound", "to one cylinder ID"),
               ("Equipment owner", "co-signs each recovery from", "its unit"),
               ("Accredited lab", "certifies reclaimed purity,", "independent of the reclaimer"),
               ("Destruction verifier", "certifies quantity and DRE,", "independent of the destroyer")]
    for i, (a, b, c) in enumerate(signers):
        y = 58 + i * 92
        s.rect(28, y, 232, 76, t["card"], t["blue"], sw=1.4)
        s.text(44, y + 25, a, size=14, weight=700)
        s.text(44, y + 46, b, size=12, fill=t["muted"])
        s.text(44, y + 63, c, size=12, fill=t["muted"])

    # middle: contracts
    header(338, 40, "Shared ledger · Solidity (OP Sepolia testnet)", "teal")
    cx, cw = 338, 300
    s.rect(cx, 58, 144, 58, t["card"], t["border"], sw=1.2)
    s.text(cx + 14, 82, "Governance", size=13.5, weight=700)
    s.text(cx + 14, 101, "3-of-4 multisig", size=12, fill=t["muted"])
    s.rect(cx + 156, 58, 144, 58, t["card"], t["border"], sw=1.2)
    s.text(cx + 170, 82, "IdentityRegistry", size=13.5, weight=700)
    s.text(cx + 170, 101, "roles, operator keys", size=12, fill=t["muted"])

    s.rect(cx, 130, cw, 190, t["teal_bg"], t["teal"], sw=2)
    s.text(cx + 18, 160, "KigaliLedger", size=17, weight=700)
    s.text(cx + cw - 16, 160, "R1–R6", size=12, fill=t["teal"], weight=700, anchor="end", mono=True)
    for i, ln in enumerate(["Lots by class: VIRGIN, RECOVERED,", "RECLAIMED, UNKNOWN", "Per-gas mass conservation",
                            "180-day residence quarantine", "One open lot per cylinder",
                            "Checks every signature on chain"]):
        s.text(cx + 18, 186 + i * 21, ("· " if i != 1 else "  ") + ln, size=12.5)

    s.rect(cx, 334, 144, 58, t["card"], t["border"], sw=1.2)
    s.text(cx + 14, 358, "EquipmentRegistry", size=13.5, weight=700)
    s.text(cx + 14, 377, "units, owners, caps", size=12, fill=t["muted"])
    s.rect(cx + 156, 334, 144, 58, t["card"], t["teal"], sw=1.6)
    s.text(cx + 170, 358, "DestructionClaims", size=13.5, weight=700)
    s.text(cx + 170, 377, "R7 claim lock", size=12, fill=t["muted"])
    s.rect(cx, 406, cw, 46, t["card"], t["amber"], sw=1.4, dash="6 4")
    s.text(cx + 14, 434, "FlagRegistry", size=13.5, weight=700)
    s.text(cx + cw - 14, 434, "AI flags + model hash", size=12, fill=t["muted"], anchor="end")

    # signer arrows into the ledger
    for i in range(4):
        y = 58 + i * 92 + 38
        ty = 175 + i * 34
        s.line([(260, y), (300, y), (300, ty), (cx - 4, ty)], "blue", sw=1.4)
    s.line([(cx + 72, 116), (cx + 72, 126)], "line", sw=1.2)
    s.line([(cx + 228, 116), (cx + 228, 126)], "line", sw=1.2)
    s.line([(cx + 72, 320), (cx + 72, 334)], "line", sw=1.4, arrow=False)
    s.line([(cx + 228, 320), (cx + 228, 330)], "teal", sw=1.4)

    # right: who uses it
    header(700, 40, "Who relies on it", "green")
    users = [("Carbon registries", "claim each destruction event", "once, without sharing databases"),
             ("Reclaimers and buyers", "prove reclaimed gas came from", "real recovered kilograms"),
             ("Regulators", "see cross-segment balances", "and AI warning signals")]
    for i, (a, b, c) in enumerate(users):
        y = 58 + i * 106
        s.rect(700, y, 232, 82, t["card"], t["green"], sw=1.4)
        s.text(716, y + 26, a, size=14, weight=700)
        s.text(716, y + 48, b, size=12, fill=t["muted"])
        s.text(716, y + 65, c, size=12, fill=t["muted"])
    s.line([(cx + cw, 225), (668, 225), (668, 99), (696, 99)], "green", sw=1.4)
    s.line([(668, 225), (668, 205), (696, 205)], "green", sw=1.4)
    s.line([(cx + cw, 363), (668, 363), (668, 311), (696, 311)], "green", sw=1.4)
    s.line([(668, 225), (668, 311)], "green", sw=1.4, arrow=False)

    # bottom: AI band
    by = 478
    s.rect(28, by, 904, 140, t["amber_bg"], t["amber"], sw=1.4)
    header(46, by + 26, "AI · off chain · observations only", "amber")
    mods = [("A  Leakage gap", "refills vs IPCC leak rates;", "units that never get refilled"),
            ("B  Mass balance", "invoices vs ledger transfers;", "reclamation yields"),
            ("C  Recovery plausibility", "recovered share of the charge;", "co-signature concentration")]
    for i, (a, b, c) in enumerate(mods):
        x = 46 + i * 222
        s.rect(x, by + 40, 206, 82, t["card"], t["amber"], sw=1.2)
        s.text(x + 14, by + 64, a, size=13.5, weight=700)
        s.text(x + 14, by + 85, b, size=12, fill=t["muted"])
        s.text(x + 14, by + 102, c, size=12, fill=t["muted"])
    s.rect(724, by + 40, 190, 82, t["card"], t["amber"], sw=1.2)
    s.text(738, by + 64, "Flags with reasons", size=13.5, weight=700)
    s.text(738, by + 85, "for human review; never", size=12, fill=t["muted"])
    s.text(738, by + 102, "an automatic sanction", size=12, fill=t["muted"])
    s.line([(46 + 3 * 222 - 16, by + 81), (720, by + 81)], "amber", sw=1.4)
    s.line([(cx, 300), (318, 300), (318, by + 36)], "amber", dash="2 3", sw=1.3)
    s.text(308, 466, "reads ledger events + invoices", size=11.5, fill=t["amber"], anchor="end")
    s.line([(819, by + 36), (819, 429), (cx + cw + 4, 429)], "amber", sw=1.3)
    s.text(812, 470, "flags + model hash written back", size=11.5, fill=t["amber"], anchor="end")
    s.save(f"architecture-{theme}.svg", "Kigali Balance architecture")


# ---------------------------------------------------------------- logo
def logo():
    """The mark: a refrigerant cylinder with gauge ticks and its fill level, copper on ink (same file as web/assets/logo.svg)."""
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Kigali Balance"><title>Kigali Balance</title>'
           '<rect width="64" height="64" fill="#161A20"/>'
           '<path d="M20.87 36.13H43.08V43.71A5.9 5.9 0 0 1 37.18 49.61H26.77A5.9 5.9 0 0 1 20.87 43.71Z" fill="#C5703B"/>'
           '<path d="M26.39 15.6V10.75A1.1 1.1 0 0 1 27.49 9.65H36.46A1.1 1.1 0 0 1 37.56 10.75V15.6Z" fill="#FCF6E6"/>'
           '<rect x="29.09" y="12.3" width="5.77" height="1.53" fill="#161A20"/>'
           '<path d="M19.45 24.71A8.22 8.22 0 0 1 27.67 16.49H36.28A8.22 8.22 0 0 1 44.5 24.71V43.63A7.3 7.3 0 0 1 37.2 50.93H26.75A7.3 7.3 0 0 1 19.45 43.63Z" '
           'fill="none" stroke="#FCF6E6" stroke-width="2.76"/>'
           '<path d="M39.2 24.57H43.5M39.2 29.27H43.5" stroke="#FCF6E6" stroke-width="1.33" stroke-linecap="round"/></svg>\n')
    (OUT / "logo.svg").write_text(svg, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    for th in THEMES:
        flow(th)
        architecture(th)
    logo()
    print("wrote", sorted(f.name for f in OUT.glob("*.svg")))
