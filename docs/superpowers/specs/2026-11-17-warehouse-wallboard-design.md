# Warehouse SC / Delivery wallboard design

## Intent

Bina dashboard web full-screen untuk smartboard warehouse. Operator perlu boleh membaca keadaan Shipping Check dan Delivery dari jarak jauh tanpa membuka Excel atau mencari dalam banyak panel.

## Goals

- Paparkan dua surface utama: `Shipping Check` dan `Delivery`.
- Rotate automatik: SC selama 30 saat, Delivery selama 30 saat, berulang.
- Kekalkan satu bahasa visual untuk tema dark dan light.
- Jadikan angka operasi, perubahan berbanding bulan lepas, isu dan trend boleh dibaca sepintas lalu.
- Gunakan raw workbook sebagai sumber data/reference tanpa menjadikan UI bergantung kepada layout Excel.

## Non-goals

- Bukan aplikasi untuk mengedit workbook atau menggantikan proses input Excel pada fasa pertama.
- Bukan dashboard admin dengan sidebar dan grid kad yang sama berulang.
- Bukan sistem live tracking lori atau event stream; refresh/data-ingestion cadence perlu ditentukan apabila adapter data dibina.

## Anti-goals

- Jangan bina susunan 3–6 kad identik, gradient ungu/biru, glassmorphism, emoji sebagai icon, atau decorative animation.
- Jangan paparkan formula/helper sheet sebagai UI.
- Jangan commit salinan raw workbook atau operational/person data sebenar.

## Selected approach

### A — Web wallboard operational

Gunakan React + TypeScript sebagai UI wallboard dengan data adapter yang mengubah workbook kepada read model yang stabil. UI hanya consume read model; parser/importer berada di boundary data dan boleh diganti kemudian dengan API atau scheduled export.

Approach B (Excel sebagai runtime) terlalu mengehadkan responsive layout, theme dan maintainability. Approach C (browser baca `.xlsx` terus) menjadikan formula cache, tarikh, refresh OneDrive dan error handling sebahagian daripada UI runtime.

## Source contract

Raw workbook: `Dashboard for SC and Delivery Data.xlsx`.

- Input/master sheets: `SC_MonthlyLine`, `SC_Status`, `SC_IssueLog`, `SC_UserPerf`, `DL_MonthlyTrip`, `DL_TripBreakdown`, `DL_RegionBreakdown`, `DL_TransporterIssue`, `DL_LorryPlan`, `Lists`.
- Output/helper sheets: `DB_Shipping`, `DB_Delivery`, `DB_Calc`.
- Reference-only sheets: `Topic Summary`, `Shipping Check Operation`, `Delivery Operation`.
- Preserve the existing sheet names, table names and headers at the import boundary.
- Read dates as dates and times as 24-hour times; never infer display strings from Excel serial numbers in the UI layer.
- Read-model records need `lastUpdatedAt` and a stale/error state so the wallboard can show data freshness instead of silently showing old values.

## Surface design

### Shared frame

- Full-screen canvas with a small, calm top rail: current section, selected month/date, last updated time, theme control and rotation progress.
- A visible `SC 00:30` / `Delivery 00:30` cycle indicator makes the automatic transition predictable.
- Manual previous/next controls are available for setup and testing; operator mode still auto-rotates.
- Default theme proposal: dark for the smartboard, with light theme available and persisted per device.

### Shipping Check

- Dominant signal: current-month shipping-check line count and change versus previous month.
- Supporting signal: issue count and issue rate per 10k line.
- Status stream: Not Yet Invoice, Not Confirm, Release to Invoicing.
- Lower field: recent issues and reason/workzone breakdown, using an open list and horizontal comparison marks rather than repeated metric cards.
- The most urgent issue is identified by semantic status and direct text, not colour alone.

### Delivery

- Dominant signal: 1-Day Delivery Result against target.
- Supporting signal: trip utilization against target and same-day delivery share.
- Lower field: region performance and transporter issues; lorry plan is available as a compact operational timeline when daily data exists.
- Use area/line charts for time trends and horizontal bars for categorical comparisons. Do not use pie, 3D or decorative charts.

## Visual direction

**Warehouse control room, bukan SaaS admin.**

- Typography: IBM Plex Sans for UI and IBM Plex Mono only for timestamps, IDs and numeric readouts that benefit from alignment.
- Layout: open horizontal bands, strong left alignment, generous negative space around the primary signal, and thin structural rules only where they explain grouping.
- Colour: neutral graphite/paper surfaces, one restrained signal accent for focus/selection, and subdued semantic success/warning/danger/info colours for operational state only. No competing accent colours.
- Numbers use tabular figures. Labels stay sentence case except compact data headings where the workbook vocabulary requires otherwise.
- Surfaces are separated by whitespace, alignment and tonal contrast; do not wrap every section in a rounded bordered card.
- Signature detail: a slim rotation rail that combines progress, current surface and freshness in one persistent orientation cue.

## Interaction and motion

- Transition between SC and Delivery is purposeful and short; it must not interrupt reading with a long entrance animation.
- Data refresh updates values in place and briefly marks changed figures; no blanket fade/stagger on the page.
- Honour `prefers-reduced-motion`.
- All manual controls need keyboard focus, readable labels and touch targets suitable for a smartboard.

## Data states

Design loading, empty, stale, partial and error states before the happy path. A stale wallboard must say when it was last updated and which section is affected. Missing optional breakdown data must not blank the primary KPI.

## Acceptance signals

- At a glance, an operator can identify the active surface, freshness, primary KPI, target/delta and urgent issue.
- The 30-second rotation is visible, deterministic and testable without waiting in real time.
- Dark and light themes preserve hierarchy and contrast rather than merely inverting colours.
- The result still reads as a warehouse operations tool when all decorative styling is removed.

## Open implementation decisions

- Choose the data refresh mechanism and its interval after confirming how the office workbook is published/synced.
- Confirm the final brand accent and whether the smartboard should lock dark theme or allow operator switching.
- Confirm the target smartboard resolution/orientation; desktop and tablet fallback remain required.
