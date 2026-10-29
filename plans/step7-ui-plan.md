# Design Plan (before rewriting UI)

Colors (6 named):
- bg-canvas: #F4F6F8 (light gray, engineering paper feel)
- bg-panel: #FFFFFF (clean white for results)
- neutral-ink: #1A1D1F (near-black, high contrast)
- neutral-muted: #6B7280 (secondary text)
- tension: #2F81F7 (semantic: tension)
- compression: #E5534B (semantic: compression)
- overload: #F2A20C (semantic: overload)
- support: #2DA44E (semantic: pinned/roller)
- divider: #D0D7DE (1px hairline)
- load-arrow: #C73E1D

Typefaces:
- UI: system-ui / Inter (sans-serif, sentence case, scale 12/14/16/20/28)
- Numbers: JetBrains Mono or monospace (forces, coordinates, utilization)

Layout (ASCII):
+-------------------------------------------------+
|  BridgeLab  |  Design · Connect · Load · Test   |  <- header (quiet, white bg, dark text)
+-------------------------------------------------+
| [toolbar]    |  [canvas hero]          [results]  |  <- left toolbar narrow; center canvas large; right results narrow
|  160px       |  flexible               300px    |     toolbar buttons styled individually, not identical cards
+-------------------------------------------------+
|  Status bar  [mode] [message] [Disclaimer]    |  <- footer small, muted
+-------------------------------------------------+

Principles:
1) Canvas is the hero; everything else stays quiet. Only the drawing competes for attention.
2) Structure is information: different radii and weights for different roles (small radius controls, none on canvas frame, thin dividers).
3) No decoration: no gradients on buttons, no glows, no identical rounded cards, no ALL-CAPS labels.

Changes from previous web build:
- Replaced generic light theme with #F4F6F8 canvas background.
- Replaced identical rounded toolbar buttons with individually styled buttons (different hover/active/focus states, no shadow cards).
- Added 1px hairline dividers between sections.
- Font stack changed to Inter + monospace for numbers.
- Added engineering-style legend and status bar only.

Confirm: proceed with this plan as Step 7? (Yes = rewrite CSS/JS to match; No = adjust first.)
