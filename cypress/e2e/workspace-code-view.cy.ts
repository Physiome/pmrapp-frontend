describe('Workspace detail page', () => {
  const commitId = 'a8a92308e217ac5626809237dd90a31240b22834';

  it('renders the workspace detail page with correct title', () => {
    cy.visit('/workspace/6b0');

    cy.get('h1').should('exist');
    cy.get('h1').should('contain.text', '12 L Platform 1 model codes');
  });

  it('renders the README.md link and navigates to the file view page', () => {
    cy.visit('/workspace/6b0');

    cy.get('a.text-link').contains('README.md').should('exist');
    // The link is sometimes covered by the cookie banner.
    cy.get('a.text-link').contains('README.md').click({ force: true });

    cy.url().should('include', `/workspace/6b0/file/${commitId}/README.md`);
  });

  it('renders the file view page with action buttons', () => {
    cy.visit(`/workspace/6b0/file/${commitId}/README.md`);

    cy.get('button').contains('Preview').should('exist');
    cy.get('button').contains('Code').should('exist');
    cy.get('button[aria-label="Wrap words"]').should('exist');
    cy.get('button[aria-label="Copy code"]').should('exist');
    cy.get('a[download="README.md"]').should('exist');

    // Wrap words button should be disabled when in Preview mode, and enabled when in Code mode.
    cy.get('button[aria-label="Wrap words"]').should('be.disabled');
    cy.get('button').contains('Code').click();
    cy.get('button[aria-label="Wrap words"]').should('not.be.disabled');
  });

  it('renders the code view with line numbers, syntax highlighting and line wrapping', () => {
    cy.visit(`/workspace/6b0/file/${commitId}/README.md`);

    cy.get('button').contains('Code').click();

    cy.get('.code-block[data-language="markdown"]').should('exist');
    cy.get('.code-block .monaco-editor').should('exist');
    cy.get('.code-block .line-numbers').should('exist');
    cy.get('.code-block .view-line span[class*="mtk"]:not(.mtk1)').should('exist');

    cy.get('.code-block').should('have.attr', 'data-wrapped', 'false');
    cy.get('button[aria-label="Wrap words"]').click();
    cy.get('.code-block').should('have.attr', 'data-wrapped', 'true');
  });

  /**
   * Serve a file of the given name and content in place of README.md, so tests can open files
   * that the demo workspace does not contain.
   */
  const serveFile = (filename: string, body: string) => {
    cy.intercept('GET', `**/rawfile/**/${filename}`, {
      body,
      headers: { 'content-type': 'text/plain' },
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
   * Scroll the page to the end and check that the file panel, with its toolbar, sits directly
   * below the sticky header and reaches the bottom of the viewport.
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

  it('fits a long file panel below the header, including the notification bar', () => {
    const code = Array.from({ length: 2000 }, (_, i) => `x${i} = ${i}; % line ${i}`).join('\n');
    serveFile('long.m', code);

    cy.visit(`/workspace/6b0/file/${commitId}/long.m`);

    cy.get('button[aria-label="Close notification"]').should('be.visible');
    assertPanelFitsBelowHeader();

    // The panel grows to fill the space when the notification bar is closed.
    cy.get('button[aria-label="Close notification"]').click();
    assertPanelFitsBelowHeader();
  });

  /** Check that the file panel is stuck directly below the sticky header. */
  const assertPanelStuckBelowHeader = () => {
    cy.get('header').then(($header) => {
      const headerBottom = $header[0].getBoundingClientRect().bottom;
      cy.get('[data-sticky="true"]').should(($panel) => {
        expect($panel[0].getBoundingClientRect().top).to.be.closeTo(headerBottom, 1);
      });
    });
  };

  it('keeps the file panel below the header and scrolls the code with the page', () => {
    const code = Array.from({ length: 2000 }, (_, i) => `x${i} = ${i}; % line ${i}`).join('\n');
    serveFile('long.m', code);

    cy.visit(`/workspace/6b0/file/${commitId}/long.m`);
    cy.contains('.code-block .view-line', 'line 0').should('be.visible');

    // Scroll the page by 900 lines past the point where the panel sticks: the panel stays below
    // the header and the code scrolls with the page.
    cy.get('[data-sticky="true"]').then(($panel) => {
      const win = $panel[0].ownerDocument.defaultView as Window;
      const trackTop = $panel.parent()[0].getBoundingClientRect().top + win.scrollY;
      const headerBottom = (
        $panel[0].ownerDocument.querySelector('header') as HTMLElement
      ).getBoundingClientRect().bottom;
      const lineHeight = 21;
      win.scrollTo(0, trackTop - headerBottom + 900 * lineHeight);
    });
    assertPanelStuckBelowHeader();
    cy.contains('.code-block .view-line', 'line 0').should('not.exist');
    cy.contains('.code-block .view-line', 'line 900').should('be.visible');

    // The end of the page shows the end of the file.
    cy.scrollTo('bottom');
    cy.contains('.code-block .view-line', 'line 1999').should('be.visible');
  });

  it('scrolls the page to a search match', () => {
    const code = Array.from({ length: 2000 }, (_, i) => `x${i} = ${i}; % line ${i}`).join('\n');
    serveFile('long.m', code);

    cy.visit(`/workspace/6b0/file/${commitId}/long.m`);
    cy.get('.code-block .view-line').first().click();
    const searchShortcut = Cypress.platform === 'darwin' ? '{meta}f' : '{ctrl}f';
    cy.get('.code-block .monaco-editor textarea').first().type(searchShortcut, { force: true });
    cy.get('.code-block .find-widget textarea').first().type('line 1500{enter}', { force: true });

    cy.contains('.code-block .view-line', 'line 1500').should('be.visible');
    assertPanelStuckBelowHeader();
    cy.window().its('scrollY').should('be.greaterThan', 20000);
  });

  it('renders the page breadcrumb', () => {
    cy.visit(`/workspace/6b0/file/${commitId}/README.md`);

    cy.get('nav[aria-label="Breadcrumb"]').within(() => {
      cy.get('a')
        .should('have.length', 1)
        .and('have.attr', 'href', '/workspace/6b0/file/a8a92308e217ac5626809237dd90a31240b22834');
      cy.get('[aria-current="page"]').should('contain.text', 'README.md');
    });
  });

  it('renders no breadcrumb for a file that does not exist', () => {
    cy.visit('/workspace/6b0/file/a8a92308e217ac5626809237dd90a31240b22834/missing/file.txt');

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
    cy.get('a.text-link').contains('README.rst').click({ force: true });
    cy.get('nav[aria-label="Breadcrumb"] [aria-current="page"]').should(
      'contain.text',
      'README.rst',
    );
    // Wait for the workspace crumb to become a link before leaving.
    cy.get('nav[aria-label="Breadcrumb"] a').should('exist');

    cy.go('back');

    cy.location('pathname').should('eq', '/workspace/add');
    cy.get('a.text-link').contains('README.rst').should('exist');
    cy.get('nav[aria-label="Breadcrumb"] [aria-current="page"]').should(
      'not.contain.text',
      'README.rst',
    );
    // The file view must not render with the folder's route params on the way out.
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /Missing required param/);
  });
});
