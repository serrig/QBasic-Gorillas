# QBasic Gorillas Landing v3: Direction & Decisions

## Design Read

Reading this as: **software / gaming** landing page for retro-gaming and macOS/desktop players, in an **EGA-meets-editorial** style, dial **ENERGY 2 / RHYTHM 3 / MOTION 2**.

## Dials

- **ENERGY 2 (Balanced)**: Bold display title (`Bricolage Grotesque`) paired with an interactive EGA canvas directly in the hero, restrained everywhere else.
- **RHYTHM 3 (Varied)**: Alternating compositions across sections: split hero + canvas, sticky word-highlight statement, interactive sandbox lab, asymmetric feature grid, 3-column game modes, split Hall of Fame preview, and yellow brand download band.
- **MOTION 2 (Purposeful)**: One-shot hero entrance on load, scroll-driven word highlight in `#juego`, and feature-card micro-animations triggered on hover/focus rather than endless background loops.

## Purpose-Gate Decisions (R-31)

- **Palette (`#F5F0E6` / `#0B0E17` + `#FFD23F` banana accent)**: Warm paper and EGA night sky frame the `#0000AA` canvas without competing with it; `#FFD23F` banana yellow serves as the single deliberate action accent across both themes.
- **Typography (`Bricolage Grotesque`, `Geist`, `Geist Mono`, `Press Start 2P`)**: `Bricolage Grotesque` gives editorial weight to headings, `Geist` keeps Spanish body copy legible at small sizes, `Geist Mono` aligns telemetry (`-90°/+90°`, `9,8 m/s²`) tabularly, and `Press Start 2P` is reserved strictly for in-canvas EGA HUD strings.
- **Layout (`#ciudad` asymmetric pairs, no bento mosaic / no fake window dots)**: Replaces the uniform bento mosaic and macOS traffic-light chrome with an asymmetric two-column showcase and plain window title bars so the EGA game canvas remains the focal point.
