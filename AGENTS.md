# Agent instructions

## Project scope

- This project is the smartboard dashboard for warehouse Shipping Check (SC) and Delivery operations.
- The wallboard rotates from SC to Delivery every 30 seconds and repeats continuously.
- This OneDrive folder is the working root. Source lives here; `node_modules` stays outside OneDrive and is linked in per machine (WSL symlink, Windows junction) so OneDrive does not sync build dependencies.

## Commands

- `npm run dev` — Vite dev server.
- `npm test -- --run` — full Vitest suite once.
- `npm run typecheck` — TypeScript only.
- `npm run build` — typecheck, production build, and single-file inline to `dist/index.html`.
- `npm run data:import -- --input <xlsx>` — write `src/data/generated-dashboard.json` (git-ignored) for the build to embed.
- `npm start` — serve `dist/` plus `/admin` and the state API on port 8080.
- `docker compose up -d --build` — production deploy on the VPS.

## Node modules

- Never let OneDrive sync `node_modules`. Keep it outside OneDrive and expose it through a symlink (WSL) or junction (Windows); see `README.md`.
- `dist/index.html` is the deliverable: it opens by double-click with no server. Editing `index.html` at the repo root does not run without Node.

## Raw workbook

- Operational source: `Dashboard for SC and Delivery Data.xlsx` in `WH_OUTBOUND`.
- Office path: `C:\Users\nazrulizam\OneDrive - Hong Leong Yamaha Motor Sdn Bhd\SP - Documents\WH_OUTBOUND`.
- Current WSL path: `/mnt/c/Users/nandh/OneDrive - Hong Leong Yamaha Motor Sdn Bhd/Sp - Documents/WH_OUTBOUND`.
- The project folder and raw-data folder are separate OneDrive folders (`Spare Parts - Documents` vs `SP - Documents`); do not assume one is nested under the other.
- Treat the raw workbook as read-only. Never commit it or expose live operational/person data in fixtures or logs.

## Workbook boundaries

- Input sheets: `SC_MonthlyLine`, `SC_Status`, `SC_IssueLog`, `SC_UserPerf`, `DL_MonthlyTrip`, `DL_TripBreakdown`, `DL_RegionBreakdown`, `DL_TransporterIssue`, `DL_LorryPlan`, and `Lists`.
- `DB_Shipping`, `DB_Delivery`, and `DB_Calc` are calculated/output sheets; do not turn formula cells into hardcoded UI data.
- `Topic Summary`, `Shipping Check Operation`, and `Delivery Operation` are reference-only sheets.
- Preserve workbook sheet names, table names, headers, real dates, and 24-hour times at the import boundary; the workbook `Guide` sheet defines update rules.

## UI rules

- Fixed 1920×1080 stage: KPI row + panel grid. No panel may overflow and no text may be below 18px (it is read from 3–6 m).
- Colour roles in `src/styles/tokens.css`: indigo/violet = structure, aqua = live state, green/amber/rose = status only. Do not use amber for chrome; the aurora background is ambient decoration and never encodes data.
- Status is an icon plus a word (`StatusChip`), never colour alone. KPI targets come from the workbook `Lists` sheet; do not invent targets.
- Dark is the default wallboard theme; light must stay available, persist per device, and keep the deep navy glass top bar.
- Numbers use `tabular-nums`; charts print every value and must be readable without hover.
- `.gitignore` ignores `/data` (server runtime data) only; `src/data/` is source and must stay tracked.

## Hybrid workflow

- OneDrive is the sync mechanism; there is no git remote. Do not edit on both machines at the same time, and re-run `npm run build` after pulling sync changes.
- Keep `node_modules` outside OneDrive on every machine; source, tests and docs are the synced artifacts.
- `dist/index.html` is generated and can be opened by double-click. The root `index.html` is only a Vite template and stays blank without Node.
