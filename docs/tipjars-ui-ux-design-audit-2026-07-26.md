# TipJars UI/UX + Design System Audit — Consolidated

Date: 2026-07-26 (extends 07-25 audit)
Repo: `Clipstack` (TipJars)

---

## Executive Summary

Three visual systems coexist:

1. **Token-based app UI** — `bg-background`, `bg-card`, `text-foreground`, `border-border`
2. **Hard-coded light marketing UI** — `bg-white`, `bg-[#fbfbfa]`, `text-zinc-*`, `border-zinc-*`
3. **Glass/dark card primitive** — `bg-white/5`, `border-white/10`, backdrop-blur, hover-lift

The card primitive (`components/ui/card.tsx:10`) bakes glass styling into the base, making all cards dark-biased. Landing page is entirely hard-coded light. Blog pages are hard-coded dark (`bg-zinc-950`). Finance workflow cards (Plaid, Tax) use raw `bg-white`. Result: dark mode leaks in light, light mode leaks in dark, blogs ignore theme entirely.

**What changed since 07-25 audit:** Dashboard dark-mode leaks patched. Everything else remains. This doc adds new findings (blog pages, JarSplitCalculator glass, missing `color-scheme`, semantic color gaps) and tightens file:line specificity.

---

## P0 — Design System Foundation

### Card Primitive (CRITICAL)

| File | Line | Issue |
|---|---|---|
| `components/ui/card.tsx` | 10 | Base Card uses `bg-white/5 border-white/10 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl hover:border-white/20`. Should be `bg-card text-card-foreground border-border shadow-sm`. |

**Impact:** Every `<Card>` in the app inherits glass styling. Components that need glass (QuickAddFAB, JarSplitCalculator, BottomNav headers) should use a `variant="glass"` or local class override.

### Global Theme Gaps

| File | Line | Issue |
|---|---|---|
| `app/globals.css` | (missing) | No `color-scheme: light` on `:root`, no `color-scheme: dark` on `.dark`. Native form controls, scrollbars, and system UI won't adapt. |
| `app/layout.tsx` | 23 | `themeColor: '#18181b'` is static dark. Light mode gets wrong browser chrome color. Should be dynamic via `next-themes` or `<meta>` with media query. |
| `app/layout.tsx` | 18 | `statusBarStyle: 'default'` — not theme-aware for PWA. |
| `app/globals.css` | 128-138 | `.glass` utility uses hardcoded `rgba(255,255,255,*)` — works dark-only. Should use token-based surfaces or be scoped. |
| `app/globals.css` | 148-150 | `.glow-primary` hardcodes `rgba(99,102,241,0.3)` — not from token. |

### Transition Antipattern

| File | Line | Issue |
|---|---|---|
| `components/ui/card.tsx` | 10 | `transition-all` — animates layout properties, can cause perf jank. Use explicit properties. |
| `components/ui/button.tsx` | 8 | `transition-all` in base variant. Same issue. |
| `app/globals.css` | 141-145 | Global `transition-property` on `button, a, input, [role="button"]` — broad, may conflict with component transitions. |

### Recommended Fix

1. Reset Card to `bg-card text-card-foreground border-border shadow-sm rounded-2xl`.
2. Create `.card-glass` or `variant="glass"` for glass surfaces.
3. Add `color-scheme` to globals.css `:root` and `.dark`.
4. Replace `transition-all` with explicit property lists in primitives.
5. Make `themeColor` dynamic (media query `<meta>` or server-side theme detection).

---

## P1 — Dark Mode Completion

### Landing Page (`app/page.tsx`) — All Hard-coded Light

| Line | Issue |
|---|---|
| 110 | `bg-[#fbfbfa] text-zinc-900` — page root |
| 112 | `border-zinc-200/70 bg-[#fbfbfa]/80` — sticky header |
| 119,122,125,128 | `text-zinc-500 hover:text-zinc-900` — nav links |
| 145 | `border-zinc-200 bg-white/90 text-zinc-600` — eyebrow |
| 149 | `text-zinc-950` — hero heading |
| 152 | `text-zinc-500` — hero subtitle |
| 162-165 | `text-zinc-500`, `bg-white`, `border-zinc-200` — trust chips |
| 178-179 | `text-zinc-400`, `text-zinc-950` — section headers |
| 194+ | Feature cards `bg-white` |
| 209+ | How section `bg-white` |
| 219 | Step cards `bg-[#fbfbfa]` |
| 240+ | Testimonials `bg-white` |
| 253+ | Pricing `bg-white` |
| 266 | CTA card `bg-[#fbfbfa]` |
| 337 | CTA bottom `bg-white` |

### Marketing Components — Hard-coded Light

| File | Line | Issue |
|---|---|---|
| `components/HeroCommand.tsx` | 32 | `bg-white border-zinc-200/80` |
| `components/HeroCommand.tsx` | 42 | `text-zinc-900` input |
| `components/HeroCommand.tsx` | 59 | `bg-zinc-50 text-zinc-600 border-zinc-200` suggestion chip |
| `components/HeroProductPreview.tsx` | 25 | `bg-white border-zinc-200/90` |
| `components/HeroProductPreview.tsx` | 58+ | White linear gradient on right panel |
| `components/HeroProductPreview.tsx` | 76 | `border-zinc-200 bg-white text-zinc-700` |
| `components/HeroProductPreview.tsx` | 84 | `border-zinc-200 bg-white/80` |

### Blog Pages — Hard-coded Dark (NEW)

| File | Line | Issue |
|---|---|---|
| `app/(public)/blog/tax-tips-for-stylists/page.tsx` | 12 | `bg-zinc-950 text-zinc-100` — always dark regardless of theme |
| `app/(public)/blog/tips-for-managing-barber-income/page.tsx` | 12 | Same |
| `app/(public)/blog/why-barbers-need-a-budget/page.tsx` | (likely same) | **Uncertainty:** not read directly, inferred from pattern |

All blog text uses `text-zinc-100/300/400/500` — none are token-aware.

### Finance Workflow Components — `bg-white` Leaks

| File | Line | Issue |
|---|---|---|
| `components/PlaidConnectionCard.tsx` | 125 | `border-blue-200 bg-blue-50/40` — light-only info state |
| `components/PlaidConnectionCard.tsx` | 151,155,160,164 | Stats boxes `bg-white` |
| `components/PlaidConnectionCard.tsx` | 192 | Account rows `bg-white` |
| `components/PlaidConnectionCard.tsx` | 247 | Transaction list `bg-white` |
| `components/PlaidTransactionReview.tsx` | 153 | Transaction rows `bg-white` |
| `components/TaxEstimateCard.tsx` | 65 | `bg-blue-50 text-blue-700` — light-only advisory |
| `components/CoachCard.tsx` | 123 | `border-red-200 bg-red-50 text-red-600` — light-only error |

### Glass/White-Alpha Everywhere (NEW — partial)

These use `bg-white/5 border-white/10` which works dark but is invisible/wrong in light:

| File | Key Lines | Count |
|---|---|---|
| `components/JarSplitCalculator.tsx` | 260,265,332,385,469,526,566,582,600,623 | ~15 instances |
| `components/QuickAddFAB.tsx` | 364,419,483,488,494,512,553,577,603,617,630,633 | ~14 instances |
| `components/BottomNav.tsx` | 23 | `border-white/10` |
| `components/ForecastCard.tsx` | 36 | `border-white/10` |
| `components/WhatIfCard.tsx` | 119 | `border-white/10` |
| `components/StreakRewardsCard.tsx` | 42 | `border-white/10` |
| `app/(app)/review/page.tsx` | 8 | `border-white/10` |

**Note:** If the app is currently dark-only in practice, these work. But they break if a user selects light theme. Card primitive cleanup (P0) will cascade-fix some, but component-level `border-white/10` must also be replaced with `border-border`.

### Recommended Fix

1. Landing page → tokenized: `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`.
2. Blog pages → same token conversion (or accept always-dark and document intentional override).
3. Finance workflow cards → replace `bg-white` with `bg-card`, info states with `bg-blue-500/10 text-blue-600 dark:text-blue-400`.
4. All `border-white/10` outside glass variant → `border-border`.
5. Grep guard: `bg-white(?!/)|bg-\[#fbfbfa\]|text-zinc-950|text-zinc-900|border-zinc-200` in `app/` and `components/` should flag.

---

## P2 — Accessibility

### Missing `aria-label` on Icon-only Buttons

| File | Line | Issue |
|---|---|---|
| `app/(app)/admin/page.tsx` | 213 | Back button, no label |
| `app/(app)/coach/page.tsx` | 65 | Back button, no label |
| `app/(app)/coach/page.tsx` | 115 | Back button, no label |

**Uncertainty:** There may be more icon-only buttons in BottomNav, UserMenu, QuickAddFAB — not fully traced. Grep for `size="icon"` or `size="icon-sm"` and verify each has `aria-label`.

### Missing Input Attributes

| File | Line | Issue |
|---|---|---|
| `app/(app)/coach/page.tsx` | 181 | Promo input lacks visible label, `name`, `autoComplete`, `spellCheck={false}` |
| `components/HeroCommand.tsx` | 38 | Has `aria-label` but no `name` |

### Focus vs Focus-visible

| File | Line | Issue |
|---|---|---|
| `components/QuickAddFAB.tsx` | 453,550 | `outline-none focus:*` should be `focus-visible:*` |
| `components/QuickAddFAB.tsx` | 553 | `focus:border-primary focus:ring-2` — should be `focus-visible:` |

### Non-semantic Interactive Elements

| File | Line | Issue |
|---|---|---|
| `components/RecentTransactions.tsx` | 163,271 | Clickable `div` rows — need `<button>` or `role="button"` + keyboard handler |
| `components/UpcomingBillsCard.tsx` | 386 | Calendar day cells as `div` — if clickable, need button semantics |
| `components/QuickAddFAB.tsx` | 617 | Quick amount buttons use `div` with onClick — should be `<button>` |

### Typographic Inconsistency

| Pattern | Files |
|---|---|
| `...` instead of `…` (ellipsis) | `LoginForm.tsx:192`, `CoachChat.tsx:220`, `WithdrawButton.tsx:172`, `PlaidJarMovementCard.tsx:152`, `PlaidReviewInbox.tsx:120`, auth pages (login:73,94; reset-password:119,168) |

### Missing `aria-live`

Async status areas (coach thinking, sync progress, form errors, toast provider) should have `aria-live="polite"`. **Uncertainty:** Sonner toast provider may handle this — needs verification.

### Recommended Fix

1. Grep `size="icon"` / `size="icon-sm"` / `size="icon-xs"`, audit each for `aria-label`.
2. Convert interactive divs → `<button>`.
3. Replace `focus:` → `focus-visible:` in QuickAddFAB selects.
4. Add `name`, `autoComplete` to inputs.
5. `…` sweep.
6. Verify Sonner handles `aria-live`; add to custom async status if not.

---

## P3 — Mobile UX + Safe Areas

### autoFocus on Mobile

| File | Line |
|---|---|
| `components/QuickExpenseEntry.tsx` | 105 |
| `components/BucketCard.tsx` | 281 |
| `components/JarSplitCalculator.tsx` | 261 |
| `app/(app)/settings/page.tsx` | 562 |

All force keyboard open on mobile. Gate with `@media (pointer: fine)` or remove.

### Bottom Spacing Overlap

| File | Line | Issue |
|---|---|---|
| `app/(app)/layout.tsx` | 8 | App wrapper uses `pb-24` |
| `components/CoachChat.tsx` | 236 | Input dock `pb-32` on mobile — may double with layout `pb-24` |
| `components/BottomNav.tsx` | 23 | Uses `pb-[max(env(safe-area-inset-bottom),0.5rem)]` — good |

Risk: pages with both BottomNav padding AND their own `pb-*` get double bottom space.

### Bottom Nav Border

| File | Line | Issue |
|---|---|---|
| `components/BottomNav.tsx` | 23 | `border-white/10` — invisible in light mode. Should be `border-border`. |

### Recommended Fix

1. Remove `autoFocus` on mobile or gate with media query.
2. Centralize bottom-safe-area as CSS variable; remove per-page `pb-24` if BottomNav already handles it.
3. BottomNav border → `border-border`.
4. Test: iPhone SE viewport, keyboard open in QuickAddFAB and CoachChat.

---

## P4 — Visual Hierarchy + Polish

### Inconsistent Page Shells

- Dashboard: `max-w-7xl`, 64px header
- Coach: 56px header
- Other pages: `container mx-auto`, 64px header
- No shared `AppPage`/`AppHeader` component

### Semantic Color Tokens Missing

Status colors are ad-hoc: `text-red-400`, `bg-red-500/10`, `text-green-500`, `bg-blue-50 text-blue-700`. These need a small semantic set:

```
--color-info: ...
--color-success: ...
--color-warning: ...
--color-danger: ...  (+ /10, /20 surface variants)
```

Or use Tailwind pairs consistently: `text-red-600 dark:text-red-400` + `bg-red-500/10`.

### Finance Card Polish

PlaidConnectionCard and PlaidTransactionReview use raw `bg-white` boxes and dense rows. After P1 token swap, consider extracting `MetricTile` and `ActionRow` components.

---

## Recommended PR Phases

### Phase 1 — Token Foundation (1 small PR)
- Refactor `components/ui/card.tsx` → neutral defaults
- Create `.card-glass` utility or variant
- Add `color-scheme: light` / `color-scheme: dark` to globals.css
- Replace `transition-all` in card.tsx, button.tsx
- Fix `themeColor` meta (media query approach)
- Smoke test: dashboard, settings, coach, jars in both themes

### Phase 2 — Dark Mode Sweep (1 medium PR)
- Convert `app/page.tsx` to tokens
- Convert `HeroCommand.tsx`, `HeroProductPreview.tsx`
- Convert `PlaidConnectionCard.tsx`, `PlaidTransactionReview.tsx`
- Convert `CoachCard.tsx` error, `TaxEstimateCard.tsx` advisory
- Convert blog pages (or document as intentionally dark)
- Replace all stray `border-white/10` with `border-border` outside glass contexts
- Replace all stray `bg-white` with `bg-card`

### Phase 3 — Accessibility Sweep (1 small PR)
- `aria-label` on all icon-only buttons
- Interactive divs → `<button>`
- `focus:` → `focus-visible:` in QuickAddFAB
- Input `name` + `autoComplete` attributes
- `...` → `…`
- `aria-live` verification

### Phase 4 — Mobile Interaction (1 small PR)
- Remove/gate `autoFocus` on mobile
- Normalize bottom spacing (centralize)
- BottomNav `border-border`
- PWA safe-area verification

### Phase 5 — Visual System (1 medium PR)
- Extract `AppPage`, `AppHeader`, `AppSection` shell components
- Extract `MetricTile`, `InlineAlert`, `ActionRow`
- Normalize header heights, max widths
- Apply to Activity, Jars, Review, Settings, Plaid flows

---

## Acceptance Criteria

- [ ] No unintended white cards in dark mode on any app route
- [ ] No unintended invisible elements in light mode (white-alpha borders/backgrounds)
- [ ] `grep -rE "bg-white(?!/)|bg-\[#fbfbfa\]|text-zinc-950|text-zinc-900|border-zinc-200" app/ components/` returns only documented exceptions
- [ ] `npm run lint` passes
- [ ] Manual mobile pass: dashboard, quick log, coach chat, review inbox, settings
- [ ] Keyboard-only pass: tab through all interactive flows
- [ ] Screen-reader basics: icon buttons named, form fields labeled, async status announced

---

## Uncertainty Log

| Item | Status |
|---|---|
| `why-barbers-need-a-budget` blog page | Inferred same pattern as other blogs, not directly read |
| Additional icon-only buttons beyond 3 found | Need exhaustive `size="icon"` grep |
| Sonner toast `aria-live` handling | Likely handled by library, needs runtime verification |
| CoachChat `pb-32` overlap with layout `pb-24` | Visual verification needed on device |
| `HeroProductPreview.tsx:58` gradient details | Line 58 referenced in prior audit, may have shifted |
| `OfflineProvider.tsx:38` `bg-green-500 text-white` | Likely fine (status badge) but should use semantic token |
| `StabilityMeter.tsx:73-77` raw color classes | `bg-green-500`, `bg-yellow-500`, `bg-red-500` — status meter, probably intentional but should have dark variants verified |
