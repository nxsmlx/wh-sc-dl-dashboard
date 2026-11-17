# Warehouse Wallboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bina wallboard web full-screen yang memaparkan Shipping Check dan Delivery, bertukar setiap 30 saat, dan membaca data melalui read model yang tidak bergantung pada layout Excel.

**Architecture:** React + TypeScript + Vite menyediakan satu shell wallboard dengan dua surface. Data masuk melalui `DashboardDataSource`; importer workbook kekal di boundary Node/build-time dan menghasilkan JSON yang boleh diuji, manakala UI hanya menerima `DashboardSnapshot`. Rotation, freshness, theme dan chart primitives dipisahkan daripada view supaya boleh diuji dengan deterministic fake timers dan fixtures tanpa raw workbook.

**Tech Stack:** React, TypeScript, Vite, CSS custom properties, Vitest, Testing Library, SVG primitives. Gunakan `xlsx` hanya dalam importer Node/build-time; jangan bundle parser Excel ke browser. Jangan tambah chart UI library sehingga SVG primitives terbukti tidak mencukupi.

**Spec:** `docs/superpowers/specs/2026-11-17-warehouse-wallboard-design.md`

## Global Constraints

- SC dan Delivery rotate secara deterministik setiap `30_000` ms.
- Jangan bina grid kad identik, gradient ungu/biru, glassmorphism, emoji icons, atau decorative animation.
- Raw workbook ialah read-only operational input; jangan commit workbook atau data orang sebenar.
- Kekalkan sheet/table/header names di importer; UI tidak bergantung pada kedudukan cell Excel.
- UI mesti menyokong dark dan light theme, `prefers-reduced-motion`, keyboard focus, dan touch target smartboard.
- Gunakan sentence case, `tabular-nums` untuk angka, dan mono hanya untuk timestamp/ID/numeric readout yang memerlukan alignment.
- Semua chart mesti boleh dibaca tanpa hover; gunakan area/line untuk trend dan horizontal bars untuk kategori; tiada pie/3D.

## Review Focus

- Rotation boundary tepat pada 30 saat dan tidak berganda apabila component re-render — test fake timers dalam Task 3.
- Missing/invalid Excel dates tidak boleh menjadi tarikh palsu atau merosakkan snapshot — test importer normalization dalam Task 2.
- Stale, partial, empty dan error data mesti masih memaparkan primary KPI atau sebab kegagalan — test freshness/state rendering dalam Task 7.
- Theme persistence dan reduced-motion mesti tidak menyebabkan flash atau transition yang tidak perlu — test shell/theme dalam Task 4.
- Layout mesti kekal terbuka dan boleh dibaca pada 1920×1080 serta 1280×800 tanpa overflow — visual verification dalam Task 8.

---

### Task 1: Scaffold the React wallboard and test harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/test/setup.ts`
- Modify: `README.md`

**Interfaces:**
- Produces `npm run dev`, `npm run test`, `npm run typecheck`, and `npm run build`.
- Produces `App` as the browser entrypoint; later tasks may replace its placeholder content without changing `src/main.tsx`.

- [ ] **Step 1: Write the failing smoke test**

  Add `renders the wallboard root` in `src/app/App.test.tsx`; render `App` and assert the accessible wallboard landmark exists.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `npm test -- --run src/app/App.test.tsx`
  Expected: FAIL because the scaffold and `App` are not defined yet.

- [ ] **Step 3: Create the minimal Vite/React/TypeScript scaffold**

  Add only React, Vite, Vitest, Testing Library, jsdom and TypeScript. Configure Vitest with jsdom and `src/test/setup.ts`. Keep styling in CSS files; do not add Tailwind or a component kit.

- [ ] **Step 4: Run the focused test to verify it passes**

  Run: `npm test -- --run src/app/App.test.tsx`
  Expected: PASS.

- [ ] **Step 5: Verify the initial toolchain**

  Run: `npm run typecheck && npm run build`
  Expected: both commands exit 0 and produce the Vite build output.

### Task 2: Define the dashboard read model and workbook boundary

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/freshness.ts`
- Create: `src/data/fixture.ts`
- Create: `src/data/data-source.ts`
- Create: `scripts/import-workbook.mjs`
- Create: `src/data/__tests__/freshness.test.ts`
- Create: `src/data/__tests__/workbook-mapping.test.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- `DashboardDataSource.load(): Promise<DashboardSnapshot>`.
- `DashboardSnapshot` contains `source`, `lastUpdatedAt`, `selectedMonth`, `shipping`, `delivery`, and `freshness`.
- `ShippingSnapshot` contains line totals/delta, issue totals/rate, shipment statuses, recent issues and reason/workzone series.
- `DeliverySnapshot` contains one-day result/target, trip utilization/target, same-day share, region series, transporter issues and optional lorry timeline.
- `getFreshness(lastUpdatedAt: string, now: Date, staleAfterMs: number): 'fresh' | 'stale' | 'invalid'`.
- `normalizeExcelDate(value: number | string | Date): string | null` returns an ISO date or `null` for invalid input.

- [ ] **Step 1: Write failing normalization and freshness tests**

  Pin an Excel serial date, an ISO date, an invalid value, a future timestamp, and a timestamp past `staleAfterMs`. Assert invalid values return `null`, fresh values return `fresh`, and old/invalid values return the correct state.

- [ ] **Step 2: Run the focused data tests to verify they fail**

  Run: `npm test -- --run src/data/__tests__`
  Expected: FAIL because the data types and functions do not exist.

- [ ] **Step 3: Implement the typed read model and pure normalization functions**

  Keep Excel parsing out of React components. Build a sanitized fixture with aggregate values and no live names, part numbers, or operational records. The fixture must represent complete, stale, partial and error-ready snapshots.

- [ ] **Step 4: Add the build-time workbook importer**

  Implement `scripts/import-workbook.mjs --input <path> --output <path>` using `xlsx` only in Node. Validate required sheet/table/header names, read cached dashboard outputs plus source tables needed for lists and recent records, convert dates/times at the boundary, and fail with the missing sheet/table name. Write generated JSON to an ignored path; never modify the workbook.

- [ ] **Step 5: Verify the data boundary**

  Run: `npm test -- --run src/data/__tests__ && npm run typecheck`
  Expected: PASS; browser-facing types must not import the `xlsx` package.

### Task 3: Implement deterministic 30-second rotation

**Files:**
- Create: `src/features/rotation/rotation.ts`
- Create: `src/features/rotation/use-rotation.ts`
- Create: `src/features/rotation/rotation.test.ts`

**Interfaces:**
- `type WallboardPage = 'shipping' | 'delivery'`.
- `type RotationState = { page: WallboardPage; elapsedMs: number; isPaused: boolean }`.
- `advanceRotation(state: RotationState, elapsedMs: number): RotationState`.
- `selectPage(state: RotationState, page: WallboardPage): RotationState`.
- `useRotation(options: { durationMs: number; enabled: boolean }): RotationState & { next(): void; previous(): void; pause(): void; resume(): void }`.

- [ ] **Step 1: Write failing state-machine tests**

  Assert the initial page is Shipping Check, it changes to Delivery at exactly `30_000` ms, wraps back after another interval, manual navigation resets elapsed time, and paused state does not advance.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `npm test -- --run src/features/rotation/rotation.test.ts`
  Expected: FAIL because the rotation functions do not exist.

- [ ] **Step 3: Implement the pure reducer and hook**

  Use one interval owned by the hook and clean it up on unmount. Keep `30_000` as a caller-provided value so tests can use small durations without waiting.

- [ ] **Step 4: Run the focused test to verify it passes**

  Run: `npm test -- --run src/features/rotation/rotation.test.ts`
  Expected: PASS.

### Task 4: Build the theme tokens and shared wallboard shell

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/ui/WallboardShell.tsx`
- Create: `src/ui/WallboardShell.test.tsx`
- Create: `src/ui/ThemeToggle.tsx`
- Create: `src/ui/RotationRail.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- `WallboardShell` accepts `activePage`, `rotation`, `freshness`, `theme`, `onThemeChange`, `onNext`, and `onPrevious`.
- `ThemeToggle` exposes an accessible button with the current theme and persists `wallboard-theme` in local storage.

- [ ] **Step 1: Write failing shell and theme tests**

  Assert the shell exposes the active page, selected month, freshness text, visible rotation progress, keyboard-operable navigation, and persisted theme choice.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `npm test -- --run src/ui/WallboardShell.test.tsx`
  Expected: FAIL because the shell does not exist.

- [ ] **Step 3: Implement the token spine and shell**

  Use graphite/paper neutrals, one restrained focus accent, semantic status colours, IBM Plex Sans/Mono roles, tabular numeric figures, and open horizontal bands. Use whitespace and tonal contrast for grouping; do not wrap every section in a card. Honour `prefers-reduced-motion` and visible `:focus-visible` states.

- [ ] **Step 4: Run the focused test and typecheck**

  Run: `npm test -- --run src/ui/WallboardShell.test.tsx && npm run typecheck`
  Expected: PASS.

### Task 5: Implement the Shipping Check surface

**Files:**
- Create: `src/features/shipping/ShippingView.tsx`
- Create: `src/features/shipping/ShippingView.module.css`
- Create: `src/features/shipping/ShippingView.test.tsx`
- Create: `src/ui/MetricReadout.tsx`
- Create: `src/ui/StatusStream.tsx`
- Create: `src/ui/HorizontalBars.tsx`
- Create: `src/ui/IssueList.tsx`

**Interfaces:**
- `ShippingView` accepts `ShippingSnapshot` and renders no direct workbook cell references.
- `MetricReadout` accepts a label, formatted value, optional delta/target and semantic state.
- `HorizontalBars` accepts labelled numeric values and renders visible labels without hover-only information.

- [ ] **Step 1: Write failing view tests**

  Assert the primary line count, month delta, issue rate, three shipment statuses, recent issue text, and reason/workzone labels render from a fixture. Assert an optional breakdown can be absent without hiding the primary KPI.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `npm test -- --run src/features/shipping/ShippingView.test.tsx`
  Expected: FAIL because the surface components do not exist.

- [ ] **Step 3: Implement the open-band Shipping Check composition**

  Lead with the line count and delta; use a horizontal status stream and issue list below it. Keep comparisons as plain secondary text, not coloured pills. Use semantic text plus colour for urgency.

- [ ] **Step 4: Run the focused test and build**

  Run: `npm test -- --run src/features/shipping/ShippingView.test.tsx && npm run build`
  Expected: PASS and a successful production build.

### Task 6: Implement the Delivery surface

**Files:**
- Create: `src/features/delivery/DeliveryView.tsx`
- Create: `src/features/delivery/DeliveryView.module.css`
- Create: `src/features/delivery/DeliveryView.test.tsx`
- Create: `src/ui/TrendArea.tsx`
- Create: `src/ui/RegionBars.tsx`
- Create: `src/ui/OperationalTimeline.tsx`

**Interfaces:**
- `DeliveryView` accepts `DeliverySnapshot` and renders no direct workbook cell references.
- `TrendArea` accepts labelled time points and a single semantic series; it must render accessible text values as well as SVG geometry.
- `OperationalTimeline` accepts optional lorry plan records and renders an explicit empty state when absent.

- [ ] **Step 1: Write failing view tests**

  Assert one-day delivery result versus target, trip utilization versus target, same-day share, region labels, transporter issue count and the optional lorry-plan empty state.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `npm test -- --run src/features/delivery/DeliveryView.test.tsx`
  Expected: FAIL because the surface components do not exist.

- [ ] **Step 3: Implement the Delivery composition**

  Use an area/line trend for time series, horizontal bars for region comparison, and a compact timeline only when daily plan data exists. Do not use pie, 3D or hover-only values.

- [ ] **Step 4: Run the focused test and build**

  Run: `npm test -- --run src/features/delivery/DeliveryView.test.tsx && npm run build`
  Expected: PASS and a successful production build.

### Task 7: Integrate data, rotation and resilient states

**Files:**
- Modify: `src/app/App.tsx`
- Create: `src/app/App.integration.test.tsx`
- Create: `src/ui/DataState.tsx`
- Modify: `src/data/data-source.ts`

**Interfaces:**
- `App` receives or constructs a `DashboardDataSource`, renders the shell, and selects the Shipping/Delivery surface from `useRotation`.
- `DataState` accepts `loading`, `empty`, `stale`, `partial`, and `error` states with a recovery message and optional last-updated time.

- [ ] **Step 1: Write failing integration tests**

  Assert the fixture renders Shipping Check first, switches to Delivery after a fake 30-second interval, manual next/previous works, and loading/stale/error/partial states remain understandable.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `npm test -- --run src/app/App.integration.test.tsx`
  Expected: FAIL because the application is still the scaffold.

- [ ] **Step 3: Wire the app**

  Load the sanitized fixture by default, keep importer output as the replaceable data source, pass freshness into the shell, and keep optional breakdown failures local to their section. The primary KPI must remain visible when optional data is missing.

- [ ] **Step 4: Run the full test and typecheck suite**

  Run: `npm test -- --run && npm run typecheck`
  Expected: all tests PASS and TypeScript exits 0.

### Task 8: Document and verify the wallboard acceptance bar

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Create: `docs/data-contract.md`
- Modify: `.gitignore`

- [ ] **Step 1: Document the local workflow**

  Record the exact commands for dev, test, typecheck, build and workbook import. Document that generated workbook JSON and raw files remain untracked.

- [ ] **Step 2: Run automated verification**

  Run: `npm test -- --run && npm run typecheck && npm run build`
  Expected: all commands exit 0 with no new warnings.

- [ ] **Step 3: Run visual verification at target sizes**

  Run: `npm run dev`, inspect at 1920×1080 and 1280×800, and verify no horizontal overflow, the primary signal is readable at distance, both themes retain contrast, and the rotation rail is legible. Test keyboard focus and reduced motion.

- [ ] **Step 4: Run the anti-slop review**

  Scan the final UI source with the repository UI anti-slop checker if available. Remove identical card grids, decorative gradients, emoji icons, hover-only chart values, and unnecessary animation before considering the wallboard ready.
