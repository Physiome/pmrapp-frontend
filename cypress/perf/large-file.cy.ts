// Performance check for the code viewer with a large generated CellML file.
// It is not part of the regular e2e suite; run it with `bun run test:perf`.
// Measurements are printed with a "PERF>" prefix and written to cypress/perf-results/, which CI
// uses to post a report on the pull request (see scripts/perfReport.ts).

const WORKSPACE_FILE_URL = '/workspace/6b0/file/a8a92308e217ac5626809237dd90a31240b22834';
const LINE_PAIRS = 80000; // About 10 MB. Increase to test larger files (the preview limit is 20 MB).
const RESULTS_FILE = 'cypress/perf-results/large-file.json';

// Generous limits that only catch severe regressions. Typical local values are noted alongside;
// CI runners are slower and the page also waits for the remote demo API.
const LIMITS = {
  firstScreenMs: 10000, // Typically about 1.3 s.
  domLines: 500, // Typically 36; a large value means only visible lines are no longer rendered.
  endOfFileMs: 3000, // Typically about 30 ms.
  searchMs: 5000, // Typically about 0.6 s.
  longestBlockBeforeSearchMs: 1000, // Typically about 100 ms.
  longestBlockOverallMs: 3000, // Typically about 0.5 s (the search itself).
};

type MetricId = keyof typeof LIMITS;

interface Metric {
  id: MetricId;
  value: number;
  limit: number;
}

interface PerfResults {
  spec: string;
  fileSizeMB: number;
  lines: number;
  complete: boolean;
  metrics: Metric[];
}

const buildLargeCellML = (): string => {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model xmlns="http://www.cellml.org/cellml/2.0#" name="big">',
  ];
  for (let i = 0; i < LINE_PAIRS; i++) {
    lines.push(`  <!-- Component ${i} comment text -->`);
    lines.push(
      `  <variable name="v_${i}" units="millivolt" initial_value="${(i * 0.37).toFixed(3)}" interface="public"/>`,
    );
  }
  lines.push('  <variable name="needle_at_the_end" units="dimensionless"/>');
  lines.push('</model>');
  return lines.join('\n');
};

type PerfWindow = Window & { __longTasks: number[]; __searchStart: number };

// The application window is extended with fields that collect measurements during the test.
const asPerfWindow = (win: Window): PerfWindow => win as unknown as PerfWindow;

const longestTask = (win: Window): number => Math.max(0, ...asPerfWindow(win).__longTasks);

describe('Large file code view', () => {
  it('renders, scrolls and searches a large CellML file without freezing', () => {
    const body = buildLargeCellML();
    const results: PerfResults = {
      spec: 'large-file',
      fileSizeMB: Number((body.length / 1024 / 1024).toFixed(2)),
      lines: LINE_PAIRS * 2 + 4,
      complete: false,
      metrics: [],
    };

    // Results are written after every measurement, so a failure part-way through still leaves
    // the measurements taken so far.
    const record = (id: MetricId, value: number) => {
      results.metrics.push({ id, value: Math.round(value), limit: LIMITS[id] });
      cy.task('log', `${id}: ${Math.round(value)} (limit ${LIMITS[id]})`);
      cy.writeFile(RESULTS_FILE, results);
    };

    cy.task('log', `file size: ${results.fileSizeMB} MB, lines: ${results.lines}`);
    cy.writeFile(RESULTS_FILE, results);

    // Serve the generated file in place of README.md, and rename README.md to big.cellml in the
    // workspace info so the page treats it as an existing CellML file.
    cy.intercept('GET', '**/rawfile/**/big.cellml', {
      body,
      headers: { 'content-type': 'text/plain' },
    });
    cy.intercept('POST', '**/api/get_workspace_info', (req) => {
      const reqBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (reqBody.path === 'big.cellml') {
        reqBody.path = 'README.md';
        req.body = reqBody;
        req.continue((res) => {
          res.body = JSON.parse(JSON.stringify(res.body).split('README.md').join('big.cellml'));
        });
      }
    });

    let start = 0;
    cy.visit(`${WORKSPACE_FILE_URL}/big.cellml`, {
      onBeforeLoad(win) {
        const perfWin = asPerfWindow(win);
        start = win.performance.now();
        perfWin.__longTasks = [];
        new win.PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            perfWin.__longTasks.push(Math.round(entry.duration));
        }).observe({ type: 'longtask', buffered: true });
      },
    });

    // A token with a colour other than the default foreground (`mtk1`) means highlighting is shown.
    const highlightedToken = 'span[class*="mtk"]:not(.mtk1)';
    // The editor sits in a sticky file panel and scrolls with the page, so scroll the page.
    const scrollPage = (position: 'top' | 'bottom') => cy.scrollTo(position);

    // 1. First highlighted screen.
    cy.get(`.code-block .view-line ${highlightedToken}`, { timeout: 60000 }).should('exist');
    cy.window().then((win) => {
      record('firstScreenMs', win.performance.now() - start);
      record('domLines', win.document.querySelectorAll('.code-block .view-line').length);
    });

    // 2. Jump to the end of the file by scrolling the page, without focusing the editor.
    cy.window().then((win) => {
      const scrollStart = win.performance.now();
      scrollPage('bottom');
      cy.contains('.code-block .view-line', 'needle_at_the_end', { timeout: 60000 })
        .should('exist')
        .then(() => {
          record('endOfFileMs', win.performance.now() - scrollStart);
        });
    });
    cy.contains('.code-block .view-line', 'needle_at_the_end')
      .find(highlightedToken, { timeout: 60000 })
      .should('exist');

    // 3. Search for the last line with the built-in find widget.
    scrollPage('top');
    cy.contains('.code-block .view-line', 'needle_at_the_end').should('not.exist');
    cy.get('.code-block .view-line').first().click();
    cy.window().then((win) => {
      record('longestBlockBeforeSearchMs', longestTask(win));
      asPerfWindow(win).__searchStart = win.performance.now();
    });
    const searchShortcut = Cypress.platform === 'darwin' ? '{meta}f' : '{ctrl}f';
    cy.get('.code-block .monaco-editor textarea').first().type(searchShortcut, { force: true });
    cy.get('.code-block .find-widget textarea').first().type('needle_at_the_end{enter}', {
      force: true,
    });
    cy.contains('.code-block .view-line', 'needle_at_the_end', { timeout: 30000 }).should(
      'be.visible',
    );
    cy.window().then((win) => {
      record('searchMs', win.performance.now() - asPerfWindow(win).__searchStart);
      record('longestBlockOverallMs', longestTask(win));
    });

    // 4. Check the limits after all measurements have been recorded.
    cy.then(() => {
      results.complete = true;
      cy.writeFile(RESULTS_FILE, results);

      const exceeded = results.metrics.filter((metric) => metric.value > metric.limit);
      const details = exceeded.map(
        (metric) => `${metric.id} = ${metric.value} (limit ${metric.limit})`,
      );
      expect(details, 'performance limits exceeded').to.be.empty;
    });
  });
});
