/**
 * Builds the Markdown performance report from the results written by the Cypress performance
 * checks (cypress/perf). CI uses it for the job summary and for the comment on pull requests.
 *
 * Usage: `node scripts/perfReport.ts <results-directory>`, with optional `RUN_URL` and `HEAD_SHA`
 * environment variables. The report is printed to standard output.
 *
 * The results come from a pull request's CI run, so they are treated as untrusted: only known
 * metrics and finite numbers are rendered, and no free text from the results is included.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Marker used to find and update the existing report comment on a pull request. */
export const PERF_REPORT_MARKER = '<!-- pmr-perf-report -->';

interface MetricDefinition {
  label: string;
  unit: 'ms' | 'lines';
}

/** Known metrics, in the order they are reported. */
const METRICS: Record<string, MetricDefinition> = {
  firstScreenMs: { label: 'Time to highlighted first screen', unit: 'ms' },
  domLines: { label: 'Lines in the DOM', unit: 'lines' },
  endOfFileMs: { label: 'Time to render end of file', unit: 'ms' },
  searchMs: { label: 'Time from search to match', unit: 'ms' },
  longestBlockBeforeSearchMs: { label: 'Longest main-thread block (load and scroll)', unit: 'ms' },
  longestBlockOverallMs: { label: 'Longest main-thread block (including search)', unit: 'ms' },
};

/** Known performance checks and their report titles. */
const SPECS: Record<string, string> = {
  'large-file': 'Large file code view',
};

const OUTCOMES = ['success', 'failure', 'cancelled', 'skipped'] as const;

export type PerfOutcome = (typeof OUTCOMES)[number] | 'unknown';

export interface PerfMetric {
  id: string;
  value: number;
  limit: number;
}

export interface PerfSpecResults {
  spec: string;
  fileSizeMB: number;
  lines: number;
  complete: boolean;
  metrics: PerfMetric[];
}

export interface PerfReportInput {
  results: PerfSpecResults[];
  outcome: PerfOutcome;
  runUrl?: string;
  headSha?: string;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Validate the parsed contents of a results file.
 * @param data - The parsed JSON.
 * @returns The validated results, or null when the data is not a known, well-formed result.
 */
export const parsePerfResults = (data: unknown): PerfSpecResults | null => {
  if (typeof data !== 'object' || data === null) return null;

  const record = data as Record<string, unknown>;
  if (typeof record.spec !== 'string' || !(record.spec in SPECS)) return null;
  if (!Array.isArray(record.metrics)) return null;

  const metrics: PerfMetric[] = [];
  for (const item of record.metrics) {
    if (typeof item !== 'object' || item === null) continue;
    const metric = item as Record<string, unknown>;
    if (typeof metric.id !== 'string' || !(metric.id in METRICS)) continue;
    if (!isFiniteNumber(metric.value) || !isFiniteNumber(metric.limit)) continue;
    metrics.push({ id: metric.id, value: metric.value, limit: metric.limit });
  }

  return {
    spec: record.spec,
    fileSizeMB: isFiniteNumber(record.fileSizeMB) ? record.fileSizeMB : 0,
    lines: isFiniteNumber(record.lines) ? record.lines : 0,
    complete: record.complete === true,
    metrics,
  };
};

/**
 * Normalise a CI step outcome.
 * @param value - The raw outcome text.
 * @returns A known outcome, or 'unknown'.
 */
export const parseOutcome = (value: string): PerfOutcome => {
  const trimmed = value.trim();
  return (OUTCOMES as readonly string[]).includes(trimmed) ? (trimmed as PerfOutcome) : 'unknown';
};

const formatValue = (value: number, unit: MetricDefinition['unit']): string => {
  if (unit === 'lines') return value.toLocaleString('en-GB');
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
};

const formatSpec = (results: PerfSpecResults): string[] => {
  const title = SPECS[results.spec];
  const lines = [
    `#### ${title}`,
    '',
    `Generated file: ${results.fileSizeMB.toFixed(2)} MB, ${results.lines.toLocaleString('en-GB')} lines.`,
    '',
    '| Metric | Result | Limit | Status |',
    '| --- | ---: | ---: | :---: |',
  ];

  // Report metrics in a fixed order.
  for (const id of Object.keys(METRICS)) {
    const metric = results.metrics.find((item) => item.id === id);
    const definition = METRICS[id];
    if (!metric || !definition) continue;
    const status = metric.value <= metric.limit ? '✅' : '❌';
    lines.push(
      `| ${definition.label} | ${formatValue(metric.value, definition.unit)} | ${formatValue(metric.limit, definition.unit)} | ${status} |`,
    );
  }

  if (!results.complete) {
    lines.push('', '⚠️ The check stopped before all measurements were recorded.');
  }

  return lines;
};

const summarise = ({ results, outcome }: PerfReportInput): string => {
  const exceeded = results.some((spec) =>
    spec.metrics.some((metric) => metric.value > metric.limit),
  );
  const incomplete = results.length === 0 || results.some((spec) => !spec.complete);

  // The outcome is unknown when the report is built locally, without CI's outcome file.
  if ((outcome === 'success' || outcome === 'unknown') && !exceeded && !incomplete) {
    return '✅ All performance checks are within their limits.';
  }
  if (exceeded) {
    return '❌ At least one performance limit was exceeded.';
  }
  if (results.length === 0) {
    return '⚠️ The performance checks failed before any measurements were recorded.';
  }
  if (outcome === 'cancelled') {
    return '⚠️ The performance checks were cancelled.';
  }
  return '⚠️ The performance checks failed; see the CI run for details.';
};

/**
 * Build the Markdown performance report.
 * @param input - The validated results, the outcome of the CI step and optional run details.
 * @returns The report as Markdown, starting with the comment marker.
 */
export const buildPerfReport = (input: PerfReportInput): string => {
  const lines = [PERF_REPORT_MARKER, '### Performance checks', '', summarise(input)];

  for (const results of input.results) {
    lines.push('', ...formatSpec(results));
  }

  const details: string[] = [];
  if (input.headSha && /^[0-9a-f]{7,40}$/i.test(input.headSha)) {
    details.push(`Commit ${input.headSha.slice(0, 7)}`);
  }
  if (
    input.runUrl &&
    /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/\d+/.test(input.runUrl)
  ) {
    details.push(`[CI run](${input.runUrl})`);
  }

  lines.push(
    '',
    `<sub>${[...details, 'Limits are generous and only catch severe regressions. Timings vary between runs and depend on the demo API.'].join(' · ')}</sub>`,
  );

  return `${lines.join('\n')}\n`;
};

/**
 * Read the results files and the step outcome from a results directory.
 * @param directory - The directory written by the performance checks and CI.
 * @returns The report input, without run details.
 */
export const readPerfResults = (
  directory: string,
): Pick<PerfReportInput, 'results' | 'outcome'> => {
  const results: PerfSpecResults[] = [];

  if (existsSync(directory)) {
    for (const file of readdirSync(directory).sort()) {
      if (!file.endsWith('.json')) continue;
      try {
        const parsed = parsePerfResults(JSON.parse(readFileSync(join(directory, file), 'utf8')));
        if (parsed) results.push(parsed);
      } catch {
        // Ignore unreadable or malformed results files.
      }
    }
  }

  const outcomeFile = join(directory, 'outcome.txt');
  const outcome = existsSync(outcomeFile)
    ? parseOutcome(readFileSync(outcomeFile, 'utf8'))
    : 'unknown';

  return { results, outcome };
};

// Print the report when run as a script.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = process.argv[2] ?? 'cypress/perf-results';
  process.stdout.write(
    buildPerfReport({
      ...readPerfResults(directory),
      runUrl: process.env.RUN_URL,
      headSha: process.env.HEAD_SHA,
    }),
  );
}
