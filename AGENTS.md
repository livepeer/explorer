Concise rules for building accessible, fast, delightful UIs Use MUST/SHOULD/NEVER to guide decisions

## Interactions

- Keyboard
  - MUST: Full keyboard support per [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/)
  - MUST: Visible focus rings (`:focus-visible`; group with `:focus-within`)
  - MUST: Manage focus (trap, move, and return) per APG patterns
- Targets & input
  - MUST: Hit target ≥24px (mobile ≥44px) If visual <24px, expand hit area
  - MUST: Mobile `<input>` font-size ≥16px (avoids iOS focus zoom without locking scale)
  - NEVER: Disable browser zoom (`maximum-scale`, `user-scalable=no`, or equivalent)
  - SHOULD: Viewport meta stays zoomable, e.g.:
    ```html
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    ```
  - MUST: `touch-action: manipulation` to prevent double-tap zoom; set `-webkit-tap-highlight-color` to match design
- Inputs & forms (behavior)
  - MUST: Hydration-safe inputs (no lost focus/value)
  - NEVER: Block paste in `<input>/<textarea>`
  - MUST: Loading buttons show spinner and keep original label
  - MUST: Enter submits focused text input In `<textarea>`, ⌘/Ctrl+Enter submits; Enter adds newline
  - MUST: Keep submit enabled until request starts; then disable, show spinner, use idempotency key
  - MUST: Don’t block typing; accept free text and validate after
  - MUST: Allow submitting incomplete forms to surface validation
  - MUST: Errors inline next to fields; on submit, focus first error
  - MUST: `autocomplete` + meaningful `name`; correct `type` and `inputmode`
  - SHOULD: Disable spellcheck for emails/codes/usernames
  - SHOULD: Placeholders end with ellipsis and show example pattern (eg, `+1 (123) 456-7890`, `sk-012345…`)
  - MUST: Warn on unsaved changes before navigation
  - MUST: Compatible with password managers & 2FA; allow pasting one-time codes
  - MUST: Trim values to handle text expansion trailing spaces
  - MUST: No dead zones on checkboxes/radios; label+control share one generous hit target
- State & navigation
  - MUST: URL reflects state (deep-link filters/tabs/pagination/expanded panels) Prefer libs like [nuqs](https://nuqs.dev)
  - MUST: Back/Forward restores scroll
  - MUST: Links are links—use `<a>/<Link>` for navigation (support Cmd/Ctrl/middle-click)
- Feedback
  - SHOULD: Optimistic UI; reconcile on response; on failure show error and rollback or offer Undo
  - MUST: Confirm destructive actions or provide Undo window
  - MUST: Use polite `aria-live` for toasts/inline validation
  - SHOULD: Ellipsis (`…`) for options that open follow-ups (eg, "Rename…") and loading states (eg, "Loading…", "Saving…", "Generating…")
- Touch/drag/scroll
  - MUST: Design forgiving interactions (generous targets, clear affordances; avoid finickiness)
  - MUST: Delay first tooltip in a group; subsequent peers no delay
  - MUST: Intentional `overscroll-behavior: contain` in modals/drawers
  - MUST: During drag, disable text selection and set `inert` on dragged element/containers
  - MUST: No “dead-looking” interactive zones—if it looks clickable, it is
- Autofocus
  - SHOULD: Autofocus on desktop when there’s a single primary input; rarely on mobile (to avoid layout shift)

## Animation

- MUST: Honor `prefers-reduced-motion` (provide reduced variant)
- SHOULD: Prefer CSS > Web Animations API > JS libraries
- MUST: Animate compositor-friendly props (`transform`, `opacity`); avoid layout/repaint props (`top/left/width/height`)
- SHOULD: Animate only to clarify cause/effect or add deliberate delight
- SHOULD: Choose easing to match the change (size/distance/trigger)
- MUST: Animations are interruptible and input-driven (avoid autoplay)
- MUST: Correct `transform-origin` (motion starts where it “physically” should)

## Layout

- SHOULD: Optical alignment; adjust by ±1px when perception beats geometry
- MUST: Deliberate alignment to grid/baseline/edges/optical centers—no accidental placement
- SHOULD: Balance icon/text lockups (stroke/weight/size/spacing/color)
- MUST: Verify mobile, laptop, ultra-wide (simulate ultra-wide at 50% zoom)
- MUST: Respect safe areas (use env(safe-area-inset-\*))
- MUST: Avoid unwanted scrollbars; fix overflows

## Content & Accessibility

- SHOULD: Inline help first; tooltips last resort
- MUST: Skeletons mirror final content to avoid layout shift
- MUST: `<title>` matches current context
- MUST: No dead ends; always offer next step/recovery
- MUST: Design empty/sparse/dense/error states
- SHOULD: Curly quotes (“ ”); avoid widows/orphans
- MUST: Tabular numbers for comparisons (`font-variant-numeric: tabular-nums` or a mono like Geist Mono)
- MUST: Redundant status cues (not color-only); icons have text labels
- MUST: Don’t ship the schema—visuals may omit labels but accessible names still exist
- MUST: Use the ellipsis character `…` (not `...`)
- MUST: `scroll-margin-top` on headings for anchored links; include a “Skip to content” link; hierarchical `<h1–h6>`
- MUST: Resilient to user-generated content (short/avg/very long)
- MUST: Locale-aware dates/times/numbers/currency
- MUST: Accurate names (`aria-label`), decorative elements `aria-hidden`, verify in the Accessibility Tree
- MUST: Icon-only buttons have descriptive `aria-label`
- MUST: Prefer native semantics (`button`, `a`, `label`, `table`) before ARIA
- SHOULD: Right-clicking the nav logo surfaces brand assets
- MUST: Use non-breaking spaces to glue terms: `10&nbsp;MB`, `⌘&nbsp;+&nbsp;K`, `Vercel&nbsp;SDK`

## Performance

- SHOULD: Test iOS Low Power Mode and macOS Safari
- MUST: Measure reliably (disable extensions that skew runtime)
- MUST: Track and minimize re-renders (React DevTools/React Scan)
- MUST: Profile with CPU/network throttling
- MUST: Batch layout reads/writes; avoid unnecessary reflows/repaints
- MUST: Mutations (`POST/PATCH/DELETE`) target <500 ms
- SHOULD: Prefer uncontrolled inputs; make controlled loops cheap (keystroke cost)
- MUST: Virtualize large lists (eg, `virtua`)
- MUST: Preload only above-the-fold images; lazy-load the rest
- MUST: Prevent CLS from images (explicit dimensions or reserved space)

## Design

- SHOULD: Layered shadows (ambient + direct)
- SHOULD: Crisp edges via semi-transparent borders + shadows
- SHOULD: Nested radii: child ≤ parent; concentric
- SHOULD: Hue consistency: tint borders/shadows/text toward bg hue
- MUST: Accessible charts (color-blind-friendly palettes)
- MUST: Meet contrast—prefer [APCA](https://apcacontrast.com/) over WCAG 2
- MUST: Increase contrast on `:hover/:active/:focus`
- SHOULD: Match browser UI to bg
- SHOULD: Avoid gradient banding (use masks when needed)

## Governance & Voting

- MUST: Use "For / Against / Abstain" terminology across all voting interfaces
- MUST: Color code votes consistently:
  - For: Grass (`$grass11` text, `$grass9` bars, `$grass3` backgrounds)
  - Against: Tomato (`$tomato11` text, `$tomato9` bars, `$tomato3` backgrounds)
  - Abstain: Neutral (`$neutral11` text, `$neutral8` bars, `$neutral3` backgrounds)
- MUST: Ensure voting colors are distinct from the primary brand green to maintain neutrality in governance signal.

## MFS & Delegation (Livepeer 2.0)

- MUST: Lead with what helps the prospective delegator decide; put mechanism and jargon in tooltips/docs
- MUST: Use plain state labels ("Room to earn" / "Full" / "Balanced"), not insider terms like "headroom" or "MFS" in visible chrome
- MUST: Color maps to quantity, not good/bad (Livepeer brand palette):
  - Fees: brand blue
  - Stake: brand green (LPT / shares; green means stake quantity, not “good”)
  - State chip takes the color of whichever side is the `min()` (binding side)
  - NEVER: amber = fee-capped “warning”
- MUST: Rewards follow the smaller of fee share and stake share; do not imply a shared cut applies as a slice of both bars
- MUST: Frame cut splits as pool shares of the capped LPT pot and of USDC fees separately (pro-rata by stake), not “you get 92%”
- MUST: Keep reward-history and validator-score UX out of MFS list/detail design; those are separate tickets
- SHOULD: Primary compare on `/orchestrators`; one-node explanation on `/accounts/[account]/orchestrating`; already-bonded status on `/accounts/[account]/delegating`
- SHOULD: Optional checkout-style disclosure for reward/fee breakdown; one shell, flat line-items inside
- Design notes and mocks: `design/mocks/mfs-delegation-802/`
- Protocol cliff notes (802/803/804): `design/livepeer-2.0-litepaper-cliffnotes.md` — prefer over inventing; do not contradict the litepaper PDF

## Learned User Preferences

- Never use em dashes in copy or PR text.
- Write plain language a smart twelve-year-old can follow; be direct about what is a good decision for the user; avoid insider jargon in UI copy.
- Use eyebrows sparingly for supplementary labels only; prefer normal card/section headers for titles. Repeated eyebrows look tacky.
- Prefer meaningful status icons over generic colored dots in pills/chips.
- Do not color-code neutral protocol states as good/bad (brand green = positive, amber = warning) unless the state is actually good or bad.
- Avoid obvious nested boxes; one container with flat line-items is usually enough.
- Design-bounty tickets stay as mockups until stakeholder approval; do not implement product features from them without go-ahead.
- Keep unrelated fixes on separate branches/PRs.
- Prefer Fontsource (self-hosted) over Google Fonts for Explorer typography, and say why in PR descriptions when relevant.
- When the user asks only for a command or a commit, give that and nothing else.

## Learned Workspace Facts

- Design-bounty mocks live under `design/mocks/` (`index.html` per issue); share Inter from `design/mocks/shared/`. Colocate issue notes beside the mock. Not product implementation until approved.
- Body font is Inter via `$body` in `@livepeer/design-system`; load it with Fontsource, not Google Fonts `display=optional` links.
