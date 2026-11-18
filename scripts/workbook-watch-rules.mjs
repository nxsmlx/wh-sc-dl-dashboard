/**
 * Pure decisions for the workbook watcher, kept apart from file and network
 * calls so the tricky cases (half-synced OneDrive files, two PCs) stay testable.
 */

/** A file is safe to read only when two consecutive samples agree. */
export function isStable(previous, current) {
  if (!previous || !current) {
    return false;
  }
  return previous.size === current.size && previous.mtimeMs === current.mtimeMs;
}

/** True when the workbook changed after the last successful import. */
export function isNewer(current, lastImportedMtimeMs) {
  if (!current) {
    return false;
  }
  return current.mtimeMs > lastImportedMtimeMs;
}

/** With the same OneDrive folder on several PCs, the newest copy wins. */
export function pickSource(sources) {
  const available = sources.filter(Boolean);
  if (available.length === 0) {
    return null;
  }
  return available.reduce((newest, candidate) => (candidate.mtimeMs > newest.mtimeMs ? candidate : newest));
}
