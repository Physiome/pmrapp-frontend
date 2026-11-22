describe('Workspace file view', () => {
  const workspaceId = '6b0';
  const commitId = 'a8a92308e217ac5626809237dd90a31240b22834';
  // The app may be served below a base path (`VITE_BASE_PATH`), which `baseUrl` already includes.
  const basePath = new URL(Cypress.config('baseUrl') ?? '/', 'http://localhost').pathname;

  /** Prefix an app route with the base path, as it appears in hrefs and the location. */
  const appPath = (route: string) => `${basePath.replace(/\/$/, '')}${route}`;

  /**
   * Serve a file of the given name and content in place of README.md,
   * so tests can open files that the demo workspace does not contain.
   */
  const serveFile = (filename: string, body: string, contentType = 'text/plain') => {
    cy.intercept('GET', `**/rawfile/**/${filename}`, {
      body,
      headers: { 'content-type': contentType },
    });
    cy.intercept('POST', '**/api/get_workspace_info', (req) => {
      const reqBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (reqBody.path === filename) {
        reqBody.path = 'README.md';
        req.body = reqBody;
        req.continue((res) => {
          res.body = JSON.parse(JSON.stringify(res.body).split('README.md').join(filename));
        });
      }
    });
  };

  /**
   * Scroll the page to the end and check that the file panel, with its toolbar,
   * sits directly below the sticky header and reaches the bottom of the viewport.
   */
  const assertPanelFitsBelowHeader = () => {
    cy.get('.code-block .view-line').should('exist');
    cy.get('[data-sticky="true"]').then(($panel) => {
      const panel = $panel[0];
      const win = panel.ownerDocument.defaultView as Window;
      const header = panel.ownerDocument.querySelector('header') as HTMLElement;
      // Scroll so that the panel's top meets the header's bottom.
      win.scrollBy(0, panel.getBoundingClientRect().top - header.getBoundingClientRect().bottom);
    });
    cy.get('header').then(($header) => {
      const headerBottom = $header[0].getBoundingClientRect().bottom;
      cy.get('[data-sticky="true"]').should(($panel) => {
        const rect = $panel[0].getBoundingClientRect();
        expect(rect.top).to.be.closeTo(headerBottom, 1);
        expect(rect.bottom).to.be.closeTo(Cypress.config('viewportHeight'), 1);
      });
    });
  };

  /** Check that the file panel is stuck directly below the sticky header. */
  const assertPanelStuckBelowHeader = () => {
    cy.get('header').then(($header) => {
      const headerBottom = $header[0].getBoundingClientRect().bottom;
      cy.get('[data-sticky="true"]').should(($panel) => {
        expect($panel[0].getBoundingClientRect().top).to.be.closeTo(headerBottom, 1);
      });
    });
  };

  it('renders the file view page with action buttons', () => {
    cy.visit(`/workspace/${workspaceId}/file/${commitId}/README.md`);

    // The file name is on the left of the toolbar.
    cy.get('[data-sticky="true"]').contains('span', 'README.md').should('be.visible');

    cy.get('button').contains('Preview').should('exist');
    cy.get('button[aria-label="Copy code"]').should('exist');
    cy.get('a[download="README.md"]').should('exist');

    // Wrap words button should be disabled when in Preview mode, and enabled when in Code mode.
    cy.get('button[aria-label="Wrap words"]').should('be.disabled');
    cy.get('button').contains('Code').click();
    cy.get('button[aria-label="Wrap words"]').should('not.be.disabled');
  });

  it('copies the file content to the clipboard', () => {
    const content = 'The content to copy.\nOn two lines.';
    serveFile('copy.txt', content);

    cy.visit(`/workspace/${workspaceId}/file/${commitId}/copy.txt`, {
      onBeforeLoad(win) {
        cy.stub(win.navigator.clipboard, 'writeText').as('writeText').resolves();
      },
    });

    cy.get('button[aria-label="Copy code"]').click();

    cy.get('@writeText').should('have.been.calledOnceWith', content);
    cy.get('button[aria-label="Copied!"]').should('exist');
  });

  it('downloads the file with its name and content', () => {
    const content = 'The content to download.\nOn two lines.';
    serveFile('download.txt', content);

    cy.visit(`/workspace/${workspaceId}/file/${commitId}/download.txt`);

    // Interactive runs (`cypress open`) keep earlier downloads, which could hide a failure.
    cy.task('clearDownloads');
    cy.get('a[download="download.txt"]').click();

    cy.readFile(`${Cypress.config('downloadsFolder')}/download.txt`).should('eq', content);
  });

  it('switches an SVG file between the image preview and its source code', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20">' +
      '<rect width="40" height="20" fill="red"/></svg>';
    serveFile('image.svg', svg, 'image/svg+xml');

    cy.visit(`/workspace/${workspaceId}/file/${commitId}/image.svg`);

    // Preview shows the rendered image; there is no code to wrap or copy.
    cy.get('img[alt="image.svg"]').should(($img) => {
      expect(($img[0] as HTMLImageElement).naturalWidth).to.equal(40);
    });
    cy.get('.code-block').should('not.exist');
    cy.get('button[aria-label="Wrap words"]').should('be.disabled');
    cy.get('button[aria-label="Copy code"]').should('be.disabled');

    // Code shows the SVG source, which can be wrapped and copied.
    cy.get('button').contains('Code').click();
    cy.get('img[alt="image.svg"]').should('not.exist');
    cy.get('.code-block[data-language="xml"]').should('exist');
    cy.contains('.code-block .view-line', '<rect').should('exist');
    cy.get('button[aria-label="Wrap words"]').should('not.be.disabled');
    cy.get('button[aria-label="Copy code"]').should('not.be.disabled');

    // Preview shows the image again.
    cy.get('button').contains('Preview').click();
    cy.get('img[alt="image.svg"]').should('be.visible');
    cy.get('.code-block').should('not.exist');
  });

  it('links an OpenCOR file to the OpenCOR Web app', () => {
    serveFile('model.cellml', '<model xmlns="http://www.cellml.org/cellml/2.0#" name="m"/>');

    cy.visit(`/workspace/${workspaceId}/file/${commitId}/model.cellml`);

    cy.get('a[aria-label="Open with OpenCOR\'s Web app"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'href')
      .and('match', /^\/\/opencor\.ws\/app\/\?opencor:\/\/openFile\/https?:\/\//)
      .and('include', `/workspace/${workspaceId}/rawfile/${commitId}/model.cellml`);
  });

  it('does not link other files to the OpenCOR Web app', () => {
    cy.visit(`/workspace/${workspaceId}/file/${commitId}/README.md`);

    // The button needs the workspace info, which also renders the page heading:
    // wait for both before checking that the button is absent.
    cy.get('h1').should('contain.text', '12 L Platform 1 model codes');
    cy.get('a[download="README.md"]').should('exist');
    cy.get('a[aria-label="Open with OpenCOR\'s Web app"]').should('not.exist');
  });

  it('offers a download instead of a preview for a file over 20 MB', () => {
    // One byte over the preview limit (`MAX_PREVIEW_FILE_SIZE_BYTES`).
    serveFile('large.txt', 'x'.repeat(20 * 1024 * 1024 + 1));

    cy.visit(`/workspace/${workspaceId}/file/${commitId}/large.txt`);

    // The message comes with its own Download button, besides the one in the toolbar.
    cy.contains('p', 'This file is too large to preview in the browser.')
      .should('be.visible')
      .parent()
      .contains('a', 'Download')
      .should('be.visible')
      .and('have.attr', 'download', 'large.txt');
    cy.get('.code-block').should('not.exist');
    cy.get('button[aria-label="Wrap words"]').should('not.exist');
    cy.get('button[aria-label="Copy code"]').should('not.exist');
  });

  it('renders the code view with line numbers and syntax highlighting', () => {
    cy.visit(`/workspace/${workspaceId}/file/${commitId}/README.md`);

    cy.get('button').contains('Code').click();

    cy.get('.code-block[data-language="markdown"]').should('exist');
    cy.get('.code-block .monaco-editor').should('exist');
    cy.get('.code-block .line-numbers').should('exist');
    cy.get('.code-block .view-line span[class*="mtk"]:not(.mtk1)').should('exist');
  });

  it('wraps and unwraps long lines in the code view', () => {
    // A single line far wider than the viewport.
    serveFile('long-line.txt', 'word '.repeat(500));

    cy.visit(`/workspace/${workspaceId}/file/${commitId}/long-line.txt`);

    // Unwrapped, the line is rendered as a single view line.
    cy.get('.code-block .view-line').should('have.length', 1);

    // Wrapped, the same line is split across several view lines.
    cy.get('button[aria-label="Wrap words"]').click();
    cy.get('.code-block .view-line').should('have.length.greaterThan', 1);

    // Unwrapped again, it returns to a single view line.
    cy.get('button[aria-label="Unwrap words"]').click();
    cy.get('.code-block .view-line').should('have.length', 1);
  });

  it('renders the page breadcrumb', () => {
    cy.visit(`/workspace/${workspaceId}/file/${commitId}/README.md`);

    cy.get('nav[aria-label="Breadcrumb"]').within(() => {
      cy.get('a')
        .should('have.length', 1)
        .and('have.attr', 'href', appPath(`/workspace/${workspaceId}/file/${commitId}`));
      cy.get('[aria-current="page"]').should('contain.text', 'README.md');
    });
  });

  it('renders no breadcrumb for a file that does not exist', () => {
    cy.visit(`/workspace/${workspaceId}/file/${commitId}/missing/file.txt`);

    // The path resolves to neither a file nor a folder, so it shows the workspace error.
    cy.contains('Workspace not found').should('exist');
    cy.get('nav[aria-label="Breadcrumb"]').should('not.exist');
  });

  it('returns to the workspace file browser when going back from a file', () => {
    cy.visit('/workspace/add', {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleError');
      },
    });
    // Dismiss the cookie banner, as a user would, so that it does not cover the file list.
    cy.contains('button', 'Accept').click();
    cy.get('button[aria-label="Close cookie banner"]').should('not.exist');
    cy.get('a.text-link').contains('README.rst').click();
    cy.get('nav[aria-label="Breadcrumb"] [aria-current="page"]').should(
      'contain.text',
      'README.rst',
    );
    // Wait for the workspace crumb to become a link before leaving.
    cy.get('nav[aria-label="Breadcrumb"] a').should('exist');

    cy.go('back');

    cy.location('pathname').should('eq', appPath('/workspace/add'));
    cy.get('a.text-link').contains('README.rst').should('exist');
    cy.get('nav[aria-label="Breadcrumb"] [aria-current="page"]').should(
      'not.contain.text',
      'README.rst',
    );
    // The file view must not render with the folder's route params on the way out.
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /Missing required param/);
  });

  describe('long file', () => {
    /** A file far longer than the viewport, with one numbered line per row. */
    const LONG_FILE = Array.from({ length: 2000 }, (_, i) => `line ${i}`).join('\n');

    beforeEach(() => {
      serveFile('long.txt', LONG_FILE);
      cy.visit(`/workspace/${workspaceId}/file/${commitId}/long.txt`);
    });

    /**
     * Measure the rendered line height and the page scroll position
     * at which the panel sticks below the header.
     * Past that point, each line of page scroll scrolls the code by one line.
     */
    const measureLayout = () => {
      cy.get('.code-block .view-line').should('exist');

      return cy.get('[data-sticky="true"]').then(($panel) => {
        const doc = $panel[0].ownerDocument;
        const win = doc.defaultView as Window;
        const header = doc.querySelector('header') as HTMLElement;
        const line = doc.querySelector('.code-block .view-line') as HTMLElement;
        const trackTop = $panel.parent()[0].getBoundingClientRect().top + win.scrollY;

        return {
          lineHeight: line.offsetHeight,
          stickyStart: trackTop - header.getBoundingClientRect().bottom,
        };
      });
    };

    it('fits the panel below the header, including the notification bar', () => {
      cy.get('button[aria-label="Close notification"]').should('be.visible');
      assertPanelFitsBelowHeader();

      // The panel grows to fill the space when the notification bar is closed.
      cy.get('button[aria-label="Close notification"]').click();
      assertPanelFitsBelowHeader();
    });

    it('keeps the file panel below the header and scrolls the code with the page', () => {
      cy.contains('.code-block .view-line', 'line 0').should('be.visible');

      // Scroll the page by 900 lines past the point where the panel sticks:
      // the panel stays below the header and the code scrolls with the page.
      measureLayout().then(({ lineHeight, stickyStart }) => {
        cy.scrollTo(0, stickyStart + 900 * lineHeight);
      });
      assertPanelStuckBelowHeader();
      cy.contains('.code-block .view-line', 'line 0').should('not.exist');
      cy.contains('.code-block .view-line', 'line 900').should('be.visible');

      // The end of the page shows the end of the file.
      cy.scrollTo('bottom');
      cy.contains('.code-block .view-line', 'line 1999').should('be.visible');
    });

    it('scrolls the page to a search match', () => {
      measureLayout().then(({ lineHeight, stickyStart }) => {
        cy.get('.code-block .view-line').first().click();
        const searchShortcut = Cypress.platform === 'darwin' ? '{meta}f' : '{ctrl}f';
        cy.get('.code-block .monaco-editor textarea').first().type(searchShortcut, { force: true });
        cy.get('.code-block .find-widget textarea')
          .first()
          .type('line 1500{enter}', { force: true });

        cy.contains('.code-block .view-line', 'line 1500').should('be.visible');
        assertPanelStuckBelowHeader();

        // The page, not only the editor, scrolled to the match:
        // line 1500 is within one viewport of the top of the panel.
        const matchOffset = stickyStart + 1500 * lineHeight;
        cy.window()
          .its('scrollY')
          .should('be.within', matchOffset - Cypress.config('viewportHeight'), matchOffset);
      });
    });
  });
});
