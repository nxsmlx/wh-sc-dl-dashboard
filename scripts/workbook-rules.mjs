/**
 * Pure rules applied while reading the workbook. Kept free of file and zip
 * handling so they can be tested without the live operational workbook.
 */

const TARGET_KEYS = {
  oneDayPct: '1-Day Delivery %',
  tripUtilizationPct: 'Trip Utilization %',
};

/** Sentence-case free text typed into the workbook; words with digits (part numbers, codes) are kept as typed. */
export function sentenceCase(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      if (/\d/.test(word)) {
        return word;
      }
      const lower = word.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
}

/** Read the official KPI targets from the `Lists` sheet `tblTarget` rows, as percentages. */
export function readTargets(rows) {
  const targets = {};
  for (const [key, label] of Object.entries(TARGET_KEYS)) {
    const row = rows.find((entry) => String(entry['kpi target'] ?? '').trim().toLowerCase() === label.toLowerCase());
    const value = Number(row?.value);
    if (!row || !Number.isFinite(value)) {
      throw new Error(`Lists sheet is missing the "${label}" target`);
    }
    targets[key] = Number((value * 100).toFixed(1));
  }
  return targets;
}

/** Rows whose ISO `date` falls in the given YYYY-MM month, newest first. */
export function latestForMonth(rows, monthPrefix, limit) {
  return rows
    .filter((row) => row.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
