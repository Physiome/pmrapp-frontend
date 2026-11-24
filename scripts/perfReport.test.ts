import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildPerfReport,
  PERF_REPORT_MARKER,
  type PerfSpecResults,
  parseOutcome,
  parsePerfResults,
  readPerfResults,
} from './perfReport';

const completeResults: PerfSpecResults = {
  spec: 'large-file',
  fileSizeMB: 10.02,
  lines: 160004,
  complete: true,
  metrics: [
    { id: 'firstScreenMs', value: 1351, limit: 10000 },
    { id: 'domLines', value: 36, limit: 500 },
    { id: 'endOfFileMs', value: 26, limit: 3000 },
    { id: 'longestBlockBeforeSearchMs', value: 101, limit: 1000 },
    { id: 'searchMs', value: 624, limit: 5000 },
    { id: 'longestBlockOverallMs', value: 498, limit: 3000 },
  ],
};

describe('parsePerfResults', () => {
  it('accepts well-formed results', () => {
    expect(parsePerfResults(completeResults)).toEqual(completeResults);
  });

  it('rejects unknown checks and malformed data', () => {
    expect(parsePerfResults(null)).toBeNull();
    expect(parsePerfResults('text')).toBeNull();
    expect(parsePerfResults({ ...completeResults, spec: 'unknown-spec' })).toBeNull();
    expect(parsePerfResults({ ...completeResults, metrics: 'none' })).toBeNull();
  });

  it('drops unknown metrics and non-numeric values', () => {
    const parsed = parsePerfResults({
      ...completeResults,
      metrics: [
        { id: 'domLines', value: 36, limit: 500 },
        { id: '<script>alert(1)</script>', value: 1, limit: 2 },
        { id: 'searchMs', value: '624', limit: 5000 },
        { id: 'endOfFileMs', value: Number.NaN, limit: 3000 },
      ],
    });
    expect(parsed?.metrics).toEqual([{ id: 'domLines', value: 36, limit: 500 }]);
  });

  it('treats results as incomplete unless explicitly complete', () => {
    expect(parsePerfResults({ ...completeResults, complete: 'yes' })?.complete).toBe(false);
  });
});

describe('parseOutcome', () => {
  it('normalises known outcomes and rejects others', () => {
    expect(parseOutcome('success\n')).toBe('success');
    expect(parseOutcome('failure')).toBe('failure');
    expect(parseOutcome('something else')).toBe('unknown');
  });
});

describe('buildPerfReport', () => {
  it('starts with the comment marker and reports a pass', () => {
    const report = buildPerfReport({ results: [completeResults], outcome: 'success' });
    expect(report.startsWith(PERF_REPORT_MARKER)).toBe(true);
    expect(report).toContain('✅ All performance checks are within their limits.');
    expect(report).toContain('| Time to highlighted first screen | 1.35 s | 10.00 s | ✅ |');
    expect(report).toContain('| Lines in the DOM | 36 | 500 | ✅ |');
    expect(report).toContain('| Time to render end of file | 26 ms | 3.00 s | ✅ |');
    expect(report).toContain('Generated file: 10.02 MB, 160,004 lines.');
  });

  it('reports metrics in a fixed order', () => {
    const report = buildPerfReport({ results: [completeResults], outcome: 'success' });
    expect(report.indexOf('Time from search to match')).toBeLessThan(
      report.indexOf('Longest main-thread block (load and scroll)'),
    );
  });

  it('marks exceeded limits', () => {
    const results = {
      ...completeResults,
      metrics: [{ id: 'domLines', value: 160004, limit: 500 }],
    };
    const report = buildPerfReport({ results: [results], outcome: 'failure' });
    expect(report).toContain('❌ At least one performance limit was exceeded.');
    expect(report).toContain('| Lines in the DOM | 160,004 | 500 | ❌ |');
  });

  it('reports incomplete and missing results', () => {
    const incomplete = buildPerfReport({
      results: [{ ...completeResults, complete: false }],
      outcome: 'failure',
    });
    expect(incomplete).toContain('The check stopped before all measurements were recorded.');
    expect(incomplete).toContain('⚠️ The performance checks failed; see the CI run for details.');

    const missing = buildPerfReport({ results: [], outcome: 'failure' });
    expect(missing).toContain('failed before any measurements were recorded');
  });

  it('treats an unknown outcome as a pass when all measurements are within limits', () => {
    const report = buildPerfReport({ results: [completeResults], outcome: 'unknown' });
    expect(report).toContain('✅ All performance checks are within their limits.');
  });

  it('includes valid run details only', () => {
    const report = buildPerfReport({
      results: [completeResults],
      outcome: 'success',
      headSha: '36a43265abcdef',
      runUrl: 'https://github.com/akhuoa/pmrapp-frontend/actions/runs/123456',
    });
    expect(report).toContain('Commit 36a4326');
    expect(report).toContain(
      '[CI run](https://github.com/akhuoa/pmrapp-frontend/actions/runs/123456)',
    );

    const unsafe = buildPerfReport({
      results: [completeResults],
      outcome: 'success',
      headSha: 'not a sha',
      runUrl: 'https://example.com/phishing',
    });
    expect(unsafe).not.toContain('not a sha');
    expect(unsafe).not.toContain('example.com');
  });
});

describe('readPerfResults', () => {
  let directory = '';

  afterEach(() => {
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('reads results files and the outcome, ignoring malformed files', () => {
    directory = mkdtempSync(join(tmpdir(), 'perf-results-'));
    writeFileSync(join(directory, 'large-file.json'), JSON.stringify(completeResults));
    writeFileSync(join(directory, 'broken.json'), '{ not json');
    writeFileSync(join(directory, 'outcome.txt'), 'failure\n');

    expect(readPerfResults(directory)).toEqual({ results: [completeResults], outcome: 'failure' });
  });

  it('returns no results for a missing directory', () => {
    expect(readPerfResults(join(tmpdir(), 'missing-perf-results-directory'))).toEqual({
      results: [],
      outcome: 'unknown',
    });
  });
});
