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
- Glass cards over an ambient aurora background. Indigo/violet is structure, aqua is the one live state, green/amber/rose are status only. Amber always means warning; the aurora never encodes data.
- Every status is an icon plus a word, never colour alone. KPI status uses the official targets in the workbook `Lists` sheet.
- Manrope (UI) and Space Grotesk (figures, headings) are bundled as variable fonts (SIL OFL, `src/assets/fonts`) and inlined into `dist/index.html`.
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

**If you recreate the container without the `./data` volume, published admin state is lost.** Always use `docker compose up` (which mounts `./data`), not a bare `docker run`.

## Deploy: push once, the VPS updates itself

GitHub Actions builds, tests and pushes the image, then switches the VPS over.
**A failed build never reaches the VPS**, so the last working version keeps
running.

On the operating PC:

```bash
npm run ship                    # commit everything, push, wait for the deploy
npm run ship -- -m "message"    # with your own commit message
```

That is the whole operation. Nothing is run on the VPS by hand.

### One-time setup

**1. Create a deploy key for the VPS** (on the VPS):

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy          # paste this as VPS_SSH_KEY
```

**2. Create a GitHub token that can read packages** (Settings → Developer
settings → Personal access tokens → *read:packages*). The VPS uses it to pull
the image.

**3. Add these repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `VPS_HOST` | IP or hostname of the VPS |
| `VPS_USER` | SSH user, e.g. `root` |
| `VPS_PORT` | SSH port (optional, defaults to 22) |
| `VPS_SSH_KEY` | contents of the private key from step 1 |
| `VPS_APP_DIR` | directory holding `docker-compose.yml`, e.g. `/opt/stacks/wh-sc-dl-dashboard` |
| `GHCR_USER` | your GitHub username |
| `GHCR_TOKEN` | token from step 2 |

**4. Prepare the VPS directory once:**

```bash
mkdir -p /opt/stacks/wh-sc-dl-dashboard && cd /opt/stacks/wh-sc-dl-dashboard
git clone git@github.com:nxsmlx/wh-sc-dl-dashboard.git .
cp env.example .env        # set ADMIN_PASSWORD, SESSION_SECRET, INGEST_TOKEN
```

After that, every `npm run ship` updates the board.

### Sending workbook data to the VPS

The board reads `/api/dashboard` on load, so fresh data does not need a rebuild:

```bash
WORKBOOK="<path to Dashboard for SC and Delivery Data.xlsx>" \
INGEST_URL="http://<vps>:8080/api/dashboard" \
INGEST_TOKEN="<same INGEST_TOKEN as the VPS>" \
npm run watch:workbook
```

It checks the workbook every 30 seconds, waits until OneDrive has finished
writing, imports, and uploads. A broken workbook is logged and skipped, so the
board keeps the last good numbers.

To keep it running in WSL without an open terminal:

```bash
bash deploy/install-watcher.sh
```

The script asks for `INGEST_URL` and `INGEST_TOKEN` once, installs a systemd
user service, and prints how to read the log:

```bash
journalctl --user -u wallboard-watch -f
```

Run `sudo loginctl enable-linger $USER` once so the watcher keeps running after
you close the terminal.

## Project files

- `src/data/` — read model, workbook mapping, freshness and data sources.
- `src/features/rotation/` — deterministic 30-second page rotation.
- `src/features/shipping/`, `src/features/delivery/` — the two wallboard surfaces.
- `src/ui/` — shell, theme, states and SVG chart primitives.
- `scripts/import-workbook.mjs` — dependency-free XLSX reader.
- `scripts/inline-build.mjs` — turns the Vite build into one self-contained HTML file.
- `docs/superpowers/` — design and implementation plan.
