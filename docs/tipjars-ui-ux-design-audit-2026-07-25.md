# TipJars UI/UX + Design System Audit

Date: 2026-07-25
Repo: `/Users/andrewpeltekci/.openclaw/workspace/Clipstack`
Scope: app shell, dashboard, public landing page, core finance flows, shared UI primitives, mobile interactions, theming, accessibility, and design-system consistency.

## Executive Summary

The app is close structurally, but the UI is split between two visual systems:

1. Token-based app UI using `bg-background`, `bg-card`, `text-foreground`, `border-border`.
2. Hard-coded light marketing/demo UI using `bg-white`, `bg-[#fbfbfa]`, `text-zinc-*`, `border-zinc-*`.
3. A glass/dark default card primitive using `bg-white/5`, `border-white/10`, and `transition-all`.

That split is the main reason dark mode feels incomplete and some screens feel inconsistent. The dashboard dark-mode leak was already patched in:

- `app/(app)/dashboard/page.tsx`
- `components/DailyMomentumCard.tsx`

Remaining work should standardize the theme primitives first, then sweep the landing page and financial workflow components.

## Priority 0 - Design System Foundation

### Findings

- `components/ui/card.tsx:10` - Card primitive hard-codes glass/dark styling: `bg-white/5`, `border-white/10`, `transition-all`, hover lift, shadow. This makes every card inherit a dark/glass personality even when a screen expects normal light/dark token surfaces.
- `components/ui/button.tsx:8` - Button primitive uses `transition-all`. Should list properties explicitly.
- `components/ui/input.tsx:11` - `outline-none` is paired with focus-visible replacement, acceptable, but inputs using custom classes often use `focus:` instead of `focus-visible:`.
- `app/layout.tsx:14` - `appleWebApp.statusBarStyle` is always `default`, not theme-aware.
- `app/layout.tsx:20` - static `themeColor: '#18181b'`; acceptable for dark, wrong for light if the landing/app background is light.
- `app/layout.tsx:30` - `<html>` lacks explicit color-scheme support. Add CSS `color-scheme: light dark` or dark-specific `color-scheme: dark` when `.dark` is active.

### Fix Plan

1. Make primitives neutral:
   - `Card`: default to `bg-card text-card-foreground border-border shadow-sm`.
   - Move glass/marketing cards into named variants or local classes.
   - Replace `transition-all` with `transition-[background-color,border-color,box-shadow,transform,color]` where needed.
2. Add global theme support:
   - `:root { color-scheme: light; }`
   - `.dark { color-scheme: dark; }`
   - Add tap highlight and touch-action defaults for mobile.
3. Add design tokens for app surfaces:
   - `surface-page`, `surface-card`, `surface-subtle`, `surface-elevated`, or Tailwind utility aliases if using Tailwind v4 theme tokens.

## Priority 1 - Dark Mode Completion

### Findings

- `app/page.tsx:110` - landing page root hard-codes `bg-[#fbfbfa] text-zinc-900`.
- `app/page.tsx:112` - landing header hard-codes `border-zinc-200/70 bg-[#fbfbfa]/80`.
- `app/page.tsx:145` - hero eyebrow uses `border-zinc-200 bg-white/90 text-zinc-600`.
- `app/page.tsx:149` - hero heading uses `text-zinc-950`.
- `app/page.tsx:163-165` - trust chips hard-code white backgrounds and zinc borders.
- `app/page.tsx:194` - feature cards hard-code `bg-white`.
- `app/page.tsx:209` - How section hard-codes `bg-white`.
- `app/page.tsx:219` - step cards hard-code `bg-[#fbfbfa]`.
- `app/page.tsx:240` - testimonials hard-code `bg-white`.
- `app/page.tsx:253` - pricing section hard-codes `bg-white`.
- `app/page.tsx:337` - CTA card hard-codes `bg-white` and zinc border.
- `components/HeroCommand.tsx:32` - landing coach command hard-codes `bg-white`, `border-zinc-200/80`.
- `components/HeroCommand.tsx:42` - input text hard-codes `text-zinc-900`.
- `components/HeroProductPreview.tsx:25` - product preview hard-codes `bg-white`, zinc borders, light shadows.
- `components/HeroProductPreview.tsx:58` - preview right panel hard-codes a white linear gradient.
- `components/PlaidConnectionCard.tsx:125` - connection card uses `border-blue-200 bg-blue-50/40`, poor dark-mode contrast.
- `components/PlaidConnectionCard.tsx:151-164` - stats boxes use `bg-white`.
- `components/PlaidConnectionCard.tsx:192` - account rows use `bg-white`.
- `components/PlaidConnectionCard.tsx:247` - transaction list uses `bg-white`.
- `components/PlaidTransactionReview.tsx:153` - transaction review rows use `bg-white`.
- `components/TaxEstimateCard.tsx:65` - advisory box uses `bg-blue-50 text-blue-700`, not dark-safe.

### Fix Plan

1. Convert public landing page to tokenized light/dark classes:
   - root: `bg-background text-foreground`
   - sections: `border-border`, `bg-background`, `bg-card`, `bg-muted`
   - text: `text-foreground`, `text-muted-foreground`
   - inverse pricing card remains intentionally dark but should use `bg-primary text-primary-foreground`.
2. Convert marketing demo components to token-aware surfaces.
3. Convert finance workflow cards with semantic color tokens:
   - Info: `border-blue-500/20 bg-blue-500/10 text-blue-foreground equivalent` or existing `text-blue-400 dark:text-blue-300` pairs.
   - Error: `border-destructive/20 bg-destructive/10 text-destructive`.
4. Add a grep guard or lint note for forbidden hard-coded page surfaces:
   - `bg-white`, `bg-[#fbfbfa]`, `text-zinc-950`, `text-zinc-900`, `border-zinc-200` in app UI.

## Priority 2 - Accessibility + Interaction

### Findings

- `app/(app)/admin/page.tsx:213` - icon-only back button missing `aria-label`.
- `app/(app)/coach/page.tsx:65` - icon-only back button missing `aria-label`.
- `app/(app)/coach/page.tsx:115` - icon-only back button missing `aria-label`.
- `app/(app)/coach/page.tsx:181` - promo input lacks visible label and likely `name`, `autoComplete`, and `spellCheck={false}`.
- `components/HeroCommand.tsx:38` - input has `aria-label`, but no `name`; ok for demo, better with `name="coachPrompt"`.
- `components/QuickAddFAB.tsx:453` - select uses custom focus with `outline-none focus:*`, should use `focus-visible:*`.
- `components/QuickAddFAB.tsx:550` - select uses custom focus with `outline-none focus:*`, should use `focus-visible:*`.
- `components/WhatIfCard.tsx:182` - range input needs accessible label if not already wrapped/associated nearby.
- `components/RecentTransactions.tsx:163`, `271` - clickable transaction rows appear to use `div` with conditional click behavior. If interactive, use `<button>` or add keyboard handling and role.
- `components/UpcomingBillsCard.tsx:386` - calendar day cells appear to use `div`; if clickable or stateful, use `<button>`.
- Multiple loading strings use `...` instead of `…`:
  - `app/(auth)/login/page.tsx:73`
  - `app/(auth)/login/page.tsx:94`
  - `app/(auth)/reset-password/page.tsx:119`
  - `app/(auth)/reset-password/page.tsx:168`
  - `components/LoginForm.tsx:192`
  - `components/CoachChat.tsx:220`
  - `components/WithdrawButton.tsx:172`
  - `components/PlaidJarMovementCard.tsx:152`
  - `components/PlaidReviewInbox.tsx:120`

### Fix Plan

1. Add missing `aria-label`s to icon-only buttons.
2. Ensure every input/select has visible `<Label>` or intentional `aria-label`, plus `name` and autocomplete.
3. Replace interactive rows/cells with buttons where they perform actions.
4. Replace `...` with `…` in UI copy.
5. Add `aria-live="polite"` to async status areas: coach thinking, syncing, saving, form errors, and toasts if provider does not already handle it.

## Priority 3 - Mobile UX + Safe Areas

### Findings

- `components/QuickAddFAB.tsx:301-302` - mobile quick log bottom sheet uses safe-area bottom positioning and overscroll containment, good. It still uses glass `white/10` borders which can look inconsistent after card primitive cleanup.
- `components/CoachChat.tsx:236` - input dock has `pb-32` on mobile. This likely compensates for bottom nav but can create too much vertical gap on some devices.
- `app/(app)/layout.tsx:8` - global app wrapper uses `pb-24`; child pages and fixed elements also add bottom padding, creating risk of duplicate bottom spacing.
- `components/BottomNav.tsx:23` - nav uses safe-area bottom padding, good. Border uses `border-white/10`, should be `border-border` for light mode.
- `components/QuickExpenseEntry.tsx:105`, `components/BucketCard.tsx:281`, `components/JarSplitCalculator.tsx:261`, `app/(app)/settings/page.tsx:562` - `autoFocus` on mobile can force keyboard jumps. Use only when modal opens on desktop, or delay/disable for mobile.

### Fix Plan

1. Centralize bottom-safe-area spacing:
   - App layout owns bottom nav spacing.
   - Chat and quick log use a shared `pb-bottom-nav` style or CSS variable.
2. Remove mobile `autoFocus`, or gate with `(pointer: fine)`.
3. Convert bottom nav border to `border-border`.
4. Test quick log on iPhone viewport: open, switch income/expense, add manual account, save, keyboard open/close.

## Priority 4 - Visual Hierarchy + Product Polish

### Findings

- App pages have mixed header heights: dashboard 64px, coach subscribed 56px, other pages 64px.
- Some pages use `container mx-auto`, dashboard uses custom `max-w-7xl`, creating uneven page rhythm.
- Landing page is highly polished but visually disconnected from in-app surfaces because it uses a bespoke zinc/white palette.
- `components/WeeklySummaryCard.tsx:64` and `components/WhatIfCard.tsx:132` use gradients with `via-white/5`, acceptable in dark but should be tokenized or verified in light.
- `components/CoachCard.tsx:123` uses `border-red-200 bg-red-50 text-red-600`, light-only error styling.
- `components/PlaidConnectionCard.tsx` and `components/PlaidTransactionReview.tsx` feel more admin/raw than productized due to plain white boxes and dense rows.

### Fix Plan

1. Define page shell component:
   - `AppPage`, `AppHeader`, `AppMain`, `AppSection`.
   - Use consistent header size, max width, bottom padding, and sticky behavior.
2. Define surface components:
   - `SurfaceCard`, `MetricTile`, `ActionRow`, `EmptyState`, `InlineAlert`.
3. Apply to:
   - Jars
   - Activity
   - Review Inbox
   - Settings
   - Plaid connection/review
4. Keep landing page expressive, but powered by the same tokens.

## Recommended Execution Order

### Phase 1 - Token Foundation, 1 short PR

- Refactor `components/ui/card.tsx` to neutral card defaults.
- Add explicit glass/elevated utility class or variant where needed.
- Add global `color-scheme` rules.
- Replace `transition-all` in primitives.
- Smoke test dashboard, settings, coach, jars.

### Phase 2 - Complete Dark Mode Sweep, 1 short PR

- Convert `app/page.tsx`.
- Convert `components/HeroCommand.tsx`.
- Convert `components/HeroProductPreview.tsx`.
- Convert `components/PlaidConnectionCard.tsx`.
- Convert `components/PlaidTransactionReview.tsx`.
- Convert light-only alert boxes in `CoachCard` and `TaxEstimateCard`.

### Phase 3 - Accessibility Sweep, 1 short PR

- Add missing labels and aria labels.
- Replace clickable div rows/cells with buttons.
- Add `aria-live` to async statuses.
- Replace `...` with `…` in UI text.
- Add `name`, `autoComplete`, `spellCheck` where missing.

### Phase 4 - Mobile Interaction Pass, 1 short PR

- Remove/gate mobile autoFocus.
- Normalize bottom nav/chat/FAB spacing.
- Verify bottom sheet with keyboard open.
- Add safe-area top/bottom checks for PWA mode.

### Phase 5 - Visual System Cleanup, 1 medium PR

- Create shared page shell and surface components.
- Apply to Activity, Jars, Review, Settings.
- Normalize headers, empty states, metric cards, and action rows.

## Acceptance Criteria

- No unintended white cards in dark mode on Dashboard, Jars, Activity, Review, Settings, Coach, or Landing.
- `grep -R "bg-white\|bg-\[#fbfbfa\]\|text-zinc-950\|text-zinc-900\|border-zinc-200" app components` only returns intentional inverse/marketing exceptions with comments or local token replacements.
- `npm run lint` passes.
- Manual mobile pass: dashboard, quick log, coach chat, review inbox, settings manual account creation.
- Keyboard-only pass: tab through dashboard, quick log, settings, review inbox, coach.
- Screen-reader basics: icon-only controls have names, form fields announce labels, async status has polite updates.

## Current Verification

- `npm run lint` passed after the dashboard dark-mode patch.
- Audit grep found remaining hard-coded light styling concentrated in landing/marketing and Plaid review/connection flows.
