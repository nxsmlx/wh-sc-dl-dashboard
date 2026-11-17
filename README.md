<img src="assets/icon.svg" width="64" height="64" alt="">

# WH SC / Delivery wallboard

Smartboard dashboard for warehouse Shipping Check and Delivery. It rotates from Shipping Check to Delivery every 30 seconds, supports dark and light themes, and runs from a single HTML file without a server.

## Quick start

```bash
npm install
npm test -- --run
npm run build
```

`npm run build` produces `dist/index.html` with the CSS, JavaScript and dashboard data inlined. Double-click that file to open the wallboard full-screen.

```bash
npm run dev        # live development at http://localhost:5173
npm run data:import -- --input "<path to workbook.xlsx>"
npm run build      # rebuild the double-clickable wallboard
```

## Load the workbook data

```bash
npm run data:import -- --input "C:\Users\nazrulizam\OneDrive - Hong Leong Yamaha Motor Sdn Bhd\SP - Documents\WH_OUTBOUND\Dashboard for SC and Delivery Data.xlsx"
npm run build
```

The importer reads the workbook read-only and writes `src/data/generated-dashboard.json` (git-ignored). Without that file the wallboard shows clearly labelled demo data. Re-run both commands whenever the workbook changes.

WSL path for this machine:

```bash
npm run data:import -- --input "/mnt/c/Users/nandh/OneDrive - Hong Leong Yamaha Motor Sdn Bhd/Sp - Documents/WH_OUTBOUND/Dashboard for SC and Delivery Data.xlsx"
```

## URL options for the smartboard

- `?page=delivery` opens on Delivery instead of Shipping Check.
- `?theme=light` opens in light theme; the toggle otherwise remembers the last choice.

Example: `dist/index.html?page=delivery&theme=light`

## Dependencies per machine

`node_modules` must not sync through OneDrive. Each machine keeps its own copy:

- **Windows:** `npm install` normally, or create a junction outside OneDrive if the sync client complains:
  `mklink /J node_modules C:\Users\<you>\.cache\wh-dashboard-deps\node_modules`
- **WSL on this PC:** install once outside OneDrive, then symlink:
  `npm install --prefix /home/$USER/.cache/wh-dashboard-deps` and
  `ln -s /home/$USER/.cache/wh-dashboard-deps/node_modules node_modules`

Editing source needs no build step. Run the tests and build on one machine at a time so the two copies do not fight over generated files.

## Layout and design rules

- Fixed 1920×1080 board: KPI row on top, panel grid below, no page scroll.
- Readable from the floor: no text below 18px; KPI figures 92px.
- Steel blue is structure, cyan is the one live state, green/amber/red are status only. Amber always means warning.
- Every status is an icon plus a word, never colour alone. KPI status uses the official targets in the workbook `Lists` sheet.
- Barlow / Barlow Condensed are bundled (SIL OFL, `src/assets/fonts`) and inlined into `dist/index.html`.
- Dark is the default wallboard theme; light stays available.
- "Workbook updated" is the workbook file time, not the import time. Panels name the report month they show.

## Remote admin and notice board

The board is served by `server/index.mjs`, which adds a small admin API:

- `GET /admin` — password-protected control page.
- `GET /api/state` — current notice, forced page, pause flag and theme.
- `POST /api/state` — publish changes (signed session cookie required).
- `GET /api/dashboard` — optional fresher data file from `data/dashboard.json`.

Set `ADMIN_PASSWORD` (and optionally `SESSION_SECRET`) before starting. The board polls every 15 seconds, so a published change appears without touching the smartboard. If the API is unreachable the board keeps its last state and embedded data.

```bash
cp env.example .env        # set a real password
docker compose up -d --build
```

Open `http://<server>:8080/admin`.

## Deploy on a VPS

```bash
git clone <repo> wallboard && cd wallboard
cp env.example .env        # edit ADMIN_PASSWORD
docker compose up -d --build
```

Update later:

```bash
git pull
docker compose up -d --build
```

Workbook data is not committed. On a machine that has the workbook run:

```bash
npm run data:import -- --input "<workbook path>" --output data/dashboard.json
```

then copy `data/dashboard.json` to the VPS `data/` directory (or let the Docker volume mount it). Without that file the board shows embedded data from the build, or demo data.

## Project files

- `src/data/` — read model, workbook mapping, freshness and data sources.
- `src/features/rotation/` — deterministic 30-second page rotation.
- `src/features/shipping/`, `src/features/delivery/` — the two wallboard surfaces.
- `src/ui/` — shell, theme, states and SVG chart primitives.
- `scripts/import-workbook.mjs` — dependency-free XLSX reader.
- `scripts/inline-build.mjs` — turns the Vite build into one self-contained HTML file.
- `docs/superpowers/` — design and implementation plan.
