describe('Workspace detail page', () => {
  beforeEach(() => {
    cy.visit('/workspace/da8')
  })

  it('has the correct title.', () => {
    cy.title().should('include', 'Noble, Denyer, Brown, DiFrancesco, 1992')
    cy.title().should('include', 'Physiome Model Repository')
  })

  it('renders an <h1> element.', () => {
    cy.get('h1').should('exist')
    cy.get('h1').should('contain.text', 'Noble, Denyer, Brown, DiFrancesco, 1992')
  })

  it('renders the Git repository section.', () => {
    cy.contains('Git repository').should('exist')
    cy.get('a[href*="https://models.physiomeproject.org/workspace/da8/"]').should('exist')
  })

  it('renders the author section.', () => {
    cy.contains('Author').should('exist')
    cy.get('a.text-link').contains('Alan Garny').should('exist')
  })

  it('renders the downloads section.', () => {
    cy.contains('Downloads').should('exist')
    // In the new update, the buttons changed to links.
    // So, we support both for now.
    cy.get('button, a').contains('.zip').should('exist')
    cy.get('button, a').contains('.tgz').should('exist')
  })

  it('renders the file browser section.', () => {
    cy.get('.box').contains('7 items').should('exist')
    cy.get('ul.divide-y').should('exist')
    cy.get('ul.divide-y > li').should('have.length', 7)
  })

  it('renders the breadcrumb ending at the workspace.', () => {
    cy.get('nav[aria-label="Breadcrumb"]').within(() => {
      cy.get('a').should('not.exist')
      cy.get('[aria-current="page"]').should(
        'contain.text',
        'Noble, Denyer, Brown, DiFrancesco, 1992',
      )
    })
  })

  it('renders the in-box file path in a folder and links back to the root.', () => {
    cy.visit('/workspace/add')
    cy.get('ul.divide-y a').contains('mapclient workflow').click({ force: true })

    cy.get('nav[aria-label="File path"]').within(() => {
      cy.get('[aria-current="page"]').should('contain.text', 'mapclient workflow')
      cy.contains('a', 'Files').click({ force: true })
    })

    cy.location('pathname').should('match', /^\/workspace\/add\/file\/[0-9a-f]+$/)
    cy.get('nav[aria-label="File path"]').should('not.exist')
    cy.get('ul.divide-y a').contains('mapclient workflow').should('exist')
  })

  it('renders no breadcrumb for a folder path that does not exist.', () => {
    // Slow the response down so the check below runs while the page is loading.
    cy.intercept('POST', '**/api/get_workspace_info', (req) => {
      req.on('response', (res) => {
        res.setDelay(1000)
      })
    })
    cy.visit('/workspace/da8/file/abc123/aaaaaaaaaaaaaaaa/bbbbbbbbbbbbbbbb')

    cy.contains('Loading workspace').should('exist')
    cy.get('nav[aria-label="Breadcrumb"]').should('not.exist')

    cy.contains('Workspace not found').should('exist')
    cy.get('nav[aria-label="Breadcrumb"]').should('not.exist')
  })

  it('fits a breadcrumb of short folder names on a phone screen.', () => {
    cy.viewport(375, 800)
    // Stub the folder so every crumb is short: "Workspace 43 › 3 folders of 16 characters".
    cy.intercept('POST', '**/api/get_workspace_info', {
      inner: {
        workspace: {
          id: 43,
          url: 'https://models.physiomeproject.org/workspace/da8/',
          superceded_by_id: null,
          description: '',
          long_description: '',
          created_ts: 0,
          exposures: null,
        },
        commit: { commit_id: 'abc123', author: '', committer: '' },
        path: 'aaaaaaaaaaaaaaaa/bbbbbbbbbbbbbbbb/cccccccccccccccc',
        target: { TreeInfo: { filecount: 0, entries: [] } },
      },
    })
    cy.visit('/workspace/da8/file/abc123/aaaaaaaaaaaaaaaa/bbbbbbbbbbbbbbbb/cccccccccccccccc')
    cy.get('nav[aria-label="Breadcrumb"] [aria-current="page"]').should(
      'contain.text',
      'cccccccccccccccc',
    )

    // Measure the trail itself: other content on the page may overflow for unrelated reasons.
    cy.get('nav[aria-label="Breadcrumb"] ol').then(($list) => {
      expect($list[0].scrollWidth).to.be.at.most($list[0].clientWidth)
    })
    cy.get('nav[aria-label="Breadcrumb"] [aria-current="page"]').then(($current) => {
      expect($current[0].getBoundingClientRect().right).to.be.at.most(375)
    })
  })
})
