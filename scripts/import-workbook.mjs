#!/usr/bin/env node
/**
 * Build-time workbook reader. Converts the SC / Delivery workbook into the raw
 * dashboard read model. Runs in Node only, never in the browser, and never
 * writes to the workbook.
 *
 * Usage:
 *   npm run data:import -- --input <workbook.xlsx> --output public/data/dashboard.json
 */
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { latestForMonth, readTargets, sentenceCase } from './workbook-rules.mjs';

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;

function findEndOfCentralDirectory(buffer) {
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }
  throw new Error('Not a valid .xlsx workbook (zip end record not found)');
}

function readZip(buffer) {
  const eocd = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Workbook zip directory is corrupt');
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    entries.set(name, { method, compressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return {
    names: () => [...entries.keys()],
    read(name) {
      const entry = entries.get(name);
      if (!entry) {
        throw new Error(`Workbook is missing part: ${name}`);
      }
      const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
      const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
      const start = entry.localOffset + 30 + nameLength + extraLength;
      const data = buffer.subarray(start, start + entry.compressedSize);
      return entry.method === 0 ? data : inflateRawSync(data);
    },
  };
}

const ENTITY = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };

function decodeXml(value) {
  return value.replace(/&(amp|lt|gt|quot|apos);/g, (match) => ENTITY[match]);
}

function readAttributes(attributeText) {
  const attributes = {};
  const pattern = /([\w:]+)="([^"]*)"/g;
  let match;
  while ((match = pattern.exec(attributeText)) !== null) {
    attributes[match[1]] = decodeXml(match[2]);
  }
  return attributes;
}

function readSharedStrings(zip) {
  if (!zip.names().includes('xl/sharedStrings.xml')) {
    return [];
  }
  const xml = zip.read('xl/sharedStrings.xml').toString('utf8');
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1])).join(''),
  );
}

function readWorkbookSheets(zip) {
  const workbook = zip.read('xl/workbook.xml').toString('utf8');
  const rels = zip.read('xl/_rels/workbook.xml.rels').toString('utf8');
  const targets = new Map();
  for (const match of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attributes = readAttributes(match[1]);
    targets.set(attributes.Id, attributes.Target);
  }

  const sheets = new Map();
  for (const match of workbook.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const attributes = readAttributes(match[1]);
    const target = targets.get(attributes['r:id']);
    if (!target) {
      continue;
    }
    sheets.set(attributes.name, target.startsWith('/') ? target.slice(1) : `xl/${target}`);
  }
  return sheets;
}

function readSheet(zip, path, sharedStrings) {
  const xml = zip.read(path).toString('utf8');
  const rows = new Map();

  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(readAttributes(rowMatch[1]).r);
    const cells = new Map();
    const cellPattern = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowMatch[2])) !== null) {
      const attributes = readAttributes(cellMatch[1]);
      const column = (attributes.r ?? '').replace(/\d+/g, '');
      const body = cellMatch[2] ?? '';
      const type = attributes.t;
      let value = null;

      if (type === 'inlineStr') {
        value = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1])).join('');
      } else {
        const raw = body.match(/<v>([\s\S]*?)<\/v>/);
        if (raw) {
          const rawText = decodeXml(raw[1]);
          if (type === 's') {
            value = sharedStrings[Number(rawText)] ?? '';
          } else if (type === 'str' || type === 'e') {
            value = rawText;
          } else if (type === 'b') {
            value = rawText === '1';
          } else {
            value = rawText === '' ? null : Number(rawText);
          }
        }
      }
      cells.set(column, value);
    }
    rows.set(rowNumber, cells);
  }
  return rows;
}

class SheetReader {
  constructor(rows) {
    this.rows = rows;
  }

  at(row, column) {
    const cells = this.rows.get(row);
    return cells ? cells.get(column) ?? null : null;
  }

  /** Locate a header row by its required labels, then read the rows underneath. */
  table(requiredHeaders) {
    for (const [rowNumber, cells] of this.rows) {
      const labels = [...cells.entries()]
        .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
        .map(([column, value]) => [column, value.trim()]);
      const matches = requiredHeaders.every((required) =>
        labels.some(([, label]) => label.toLowerCase() === required.toLowerCase()),
      );
      if (!matches) {
        continue;
      }

      const headerMap = new Map();
      for (const [column, label] of labels) {
        headerMap.set(label.toLowerCase(), column);
      }

      const data = [];
      for (const dataRow of [...this.rows.keys()].filter((value) => value > rowNumber).sort((a, b) => a - b)) {
        const record = {};
        let hasValue = false;
        for (const [key, column] of headerMap) {
          const value = this.at(dataRow, column);
          record[key] = value;
          if (value !== null && value !== '') {
            hasValue = true;
          }
        }
        if (!hasValue) {
          break;
        }
        data.push(record);
      }
      return data;
    }
    throw new Error(`Workbook table not found: ${requiredHeaders.join(', ')}`);
  }
}

function excelDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 1) {
      return null;
    }
    return new Date(EXCEL_EPOCH_UTC + Math.round(value) * DAY_MS).toISOString().slice(0, 10);
  }
  const parsed = Date.parse(String(value).trim());
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString().slice(0, 10);
}

function excelTime(value) {
  if (value === null || value === undefined || value === '') {
    return '--:--';
  }
  if (typeof value === 'number') {
    const minutes = Math.round((value % 1) * 24 * 60);
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '--:--';
}

function number(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function buildRawSnapshot(zip, workbookModifiedAt) {
  const sharedStrings = readSharedStrings(zip);
  const sheets = readWorkbookSheets(zip);
  const open = (name) => {
    const path = sheets.get(name);
    if (!path) {
      throw new Error(`Workbook is missing required sheet: ${name}`);
    }
    return new SheetReader(readSheet(zip, path, sharedStrings));
  };

  const monthlyRows = open('SC_MonthlyLine')
    .table(['Month', 'No. of Line'])
    .map((row) => ({ month: excelDate(row.month), lines: number(row['no. of line']) }))
    .filter((row) => row.month !== null && row.lines > 0)
    .sort((a, b) => a.month.localeCompare(b.month));

  if (monthlyRows.length === 0) {
    throw new Error('SC_MonthlyLine contains no dated rows');
  }
  const currentMonth = monthlyRows[monthlyRows.length - 1];
  const previousMonth = monthlyRows[monthlyRows.length - 2] ?? currentMonth;
  const currentPrefix = currentMonth.month.slice(0, 7);
  const previousPrefix = previousMonth.month.slice(0, 7);

  const issueRows = open('SC_IssueLog')
    .table(['Date', 'Month', 'Reason'])
    .map((row) => ({
      date: excelDate(row.date),
      workzone: text(row.workzone) || 'Unassigned',
      reason: text(row.reason) || 'Unknown',
      detail: sentenceCase(row['action / remark']) || 'No remark',
      variance: number(row['qty variance']),
    }))
    .filter((row) => row.date !== null);

  const currentIssues = issueRows.filter((row) => row.date.startsWith(currentPrefix));
  const previousIssueCount = issueRows.filter((row) => row.date.startsWith(previousPrefix)).length;

  const reasonOrder = ['Extra parts', 'Wrong parts', 'Shortage', 'Mix parts', 'Rusty'];
  const reasonLabels = new Map(reasonOrder.map((reason) => [reason.toUpperCase(), reason]));
  const reasonCounts = new Map(reasonOrder.map((reason) => [reason, 0]));
  for (const row of currentIssues) {
    const key = reasonLabels.get(row.reason.toUpperCase());
    if (key) {
      reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    }
  }
  for (const row of issueRows) {
    row.reason = reasonLabels.get(row.reason.toUpperCase()) ?? row.reason;
  }

  const qtyVarianceTotal = Math.round(currentIssues.reduce((total, row) => total + Math.abs(row.variance), 0));
  const workzoneCounts = new Map();
  for (const row of currentIssues) {
    workzoneCounts.set(row.workzone, (workzoneCounts.get(row.workzone) ?? 0) + 1);
  }
  const workzoneBreakdown = [...workzoneCounts.entries()]
    .map(([workzone, count]) => ({ workzone, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const statusRows = open('SC_Status').table(['Status', 'Total Line']);
  const statusValue = (label) => {
    const row = statusRows.find((entry) => text(entry.status).toLowerCase() === label.toLowerCase());
    return row ? number(row['total line']) : 0;
  };

  const targets = readTargets(open('Lists').table(['KPI Target', 'Value']));

  const tripRows = open('DL_MonthlyTrip')
    .table(['Month', 'No. of Trip', 'Target Trip'])
    .map((row) => ({
      month: excelDate(row.month),
      trips: number(row['no. of trip']),
      target: number(row['target trip']),
      oneDay: number(row['1-day delivery result %']),
    }))
    .filter((row) => row.month !== null && row.trips > 0)
    .sort((a, b) => a.month.localeCompare(b.month));
  const currentTrip = tripRows[tripRows.length - 1] ?? { month: currentMonth.month, trips: 0, target: 0, oneDay: 0 };
  const previousTrip = tripRows[tripRows.length - 2] ?? currentTrip;

  const breakdownRows = open('DL_TripBreakdown')
    .table(['Month', 'Same Day', '1 Day', 'Total Line'])
    .map((row) => ({
      month: excelDate(row.month),
      sameDay: number(row['same day']),
      oneDay: number(row['1 day']),
      moreThanOneDay: number(row['more than 1 day']),
      total: number(row['total line']),
      achievement: number(row['1-day achievement %']),
    }))
    .filter((row) => row.month !== null && row.total > 0)
    .sort((a, b) => a.month.localeCompare(b.month));
  const currentBreakdown = breakdownRows[breakdownRows.length - 1] ?? { sameDay: 0, oneDay: 0, moreThanOneDay: 0, total: 0, achievement: 0 };

  const regionRows = open('DL_RegionBreakdown')
    .table(['Month', 'Region', '1-Day Delivery Result %'])
    .map((row) => ({
      month: excelDate(row.month),
      region: text(row.region),
      oneDayPct: Number((number(row['1-day delivery result %']) * 100).toFixed(1)),
      lineCount: 0,
    }))
    .filter((row) => row.month === currentTrip.month && row.region !== '');

  const transporterRows = open('DL_TransporterIssue')
    .table(['Case Date', 'Month', 'Issue'])
    .map((row) => ({
      date: excelDate(row['case date']),
      issue: sentenceCase(row.issue) || 'Unknown issue',
      region: text(row['destination region']) || 'Unknown region',
    }))
    .filter((row) => row.date !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  const selectedPrefix = currentTrip.month.slice(0, 7);
  const transporterToDate = transporterRows.filter((row) => row.date.slice(0, 7) <= selectedPrefix);
  const transporterThisMonth = transporterToDate.filter((row) => row.date.startsWith(selectedPrefix));
  const transporterIssueTypes = new Map();
  for (const row of transporterThisMonth.length > 0 ? transporterThisMonth : transporterToDate) {
    transporterIssueTypes.set(row.issue, (transporterIssueTypes.get(row.issue) ?? 0) + 1);
  }
  const transporterByType = [...transporterIssueTypes.entries()]
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  let lorryPlan = [];
  try {
    lorryPlan = open('DL_LorryPlan')
      .table(['Time Slot', 'Lot No', 'Plate No'])
      .filter((row) => text(row['plate no']) !== '')
      .slice(0, 8)
      .map((row) => ({
        timeSlot: excelTime(row['time slot']),
        lot: text(row['lot no']) || '-',
        transporter: text(row.transporter) || '-',
        plate: text(row['plate no']),
        arrivalStatus: text(row['arrival status']).toUpperCase() === 'NG' ? 'NG' : 'OK',
      }));
  } catch {
    lorryPlan = [];
  }

  const monthlyIssueRate = monthlyRows
    .filter((row) => row.month <= currentMonth.month)
    .slice(-6)
    .map((row) => {
      const prefix = row.month.slice(0, 7);
      const count = issueRows.filter((issue) => issue.date.startsWith(prefix)).length;
      return { month: row.month, value: Number(((count / row.lines) * 10_000).toFixed(1)) };
    });

  return {
    lastUpdatedAt: workbookModifiedAt,
    selectedMonth: currentMonth.month,
    shipping: {
      lineCount: currentMonth.lines,
      previousLineCount: previousMonth.lines,
      issueCount: currentIssues.length,
      previousIssueCount,
      previousIssueRatePer10k: Number(
        (previousIssueCount / Math.max(1, previousMonth.lines) * 10_000).toFixed(1),
      ),
      qtyVarianceTotal,
      workzoneBreakdown,
      notYetInvoice: statusValue('Shipment Not Yet Invoice'),
      notConfirm: statusValue('Shipment Not Confirm'),
      releaseToInvoicing: statusValue('Shipment Release to Invoicing'),
      reasonBreakdown: [...reasonCounts.entries()].map(([reason, count]) => ({ reason, count })),
      recentIssues: latestForMonth(issueRows, currentPrefix, 5).map((row) => ({
        date: row.date,
        workzone: row.workzone,
        reason: row.reason,
        detail: row.detail,
      })),
      monthlyLines: monthlyRows
        .filter((row) => row.month <= currentMonth.month)
        .slice(-6)
        .map((row) => ({ month: row.month, lineCount: row.lines })),
      monthlyIssueRate,
    },
    delivery: {
      oneDayResultPct:
        Number((currentTrip.oneDay * 100).toFixed(1)) || Number((currentBreakdown.achievement * 100).toFixed(1)),
      oneDayTargetPct: targets.oneDayPct,
      tripUtilizationTargetPct: targets.tripUtilizationPct,
      previousOneDayResultPct: Number((previousTrip.oneDay * 100).toFixed(1)),
      tripCount: currentTrip.trips,
      tripTarget: currentTrip.target,
      sameDayLineCount: currentBreakdown.sameDay,
      totalLineCount: currentBreakdown.total,
      mix: {
        sameDay: currentBreakdown.sameDay,
        oneDay: currentBreakdown.oneDay,
        moreThanOneDay: currentBreakdown.moreThanOneDay,
      },
      regions: regionRows,
      transporterIssueCount: transporterThisMonth.length,
      transporterIssuesYearToDate: transporterToDate.length,
      transporterByType,
      lorryPunctuality: {
        ok: lorryPlan.filter((slot) => slot.arrivalStatus === 'OK').length,
        ng: lorryPlan.filter((slot) => slot.arrivalStatus === 'NG').length,
      },
      recentTransporterIssues: transporterToDate.slice(0, 3),
      monthlyTrend: tripRows.slice(-6).map((row) => ({ month: row.month, value: Number((row.oneDay * 100).toFixed(1)) })),
      lorryPlan,
    },
  };
}

function parseArgs(argv) {
  const args = { input: '', output: 'src/data/generated-dashboard.json' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--input') args.input = argv[index + 1];
    if (argv[index] === '--output') args.output = argv[index + 1];
    if (argv[index] === '--help' || argv[index] === '-h') args.help = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input) {
    console.log(`Usage:
  npm run data:import -- --input <workbook.xlsx> [--output src/data/generated-dashboard.json]

Reads the SC / Delivery workbook read-only and writes the dashboard read model
that the single-file build embeds. The workbook is never modified.`);
    process.exit(args.help ? 0 : 1);
  }

  const input = resolve(args.input);
  const output = resolve(args.output);
  const zip = readZip(await readFile(input));
  const workbookModifiedAt = (await stat(input)).mtime.toISOString();
  const raw = buildRawSnapshot(zip, workbookModifiedAt);

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${output}`);
}

main().catch((error) => {
  console.error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
