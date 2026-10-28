describe('Workspace detail page', () => {
  it('renders the workspace detail page with correct title', () => {
    cy.visit('/workspace/6b0')

    cy.get('h1').should('exist')
    cy.get('h1').should('contain.text', '12 L Platform 1 model codes')
  })

  it('renders the README.md link and navigates to the file view page', () => {
    cy.visit('/workspace/6b0')

    cy.get('a.text-link').contains('README.md').should('exist')
    // The link is sometimes covered by the cookie banner.
    cy.get('a.text-link').contains('README.md').click({ force: true })

    cy.url().should(
      'include',
      '/workspace/6b0/file/a8a92308e217ac5626809237dd90a31240b22834/README.md',
    )
  })

  it('renders the file view page with action buttons', () => {
    cy.visit('/workspace/6b0/file/a8a92308e217ac5626809237dd90a31240b22834/README.md')

    cy.get('button').contains('Preview').should('exist')
    cy.get('button').contains('Code').should('exist')
    cy.get('button[aria-label="Wrap words"]').should('exist')
    cy.get('button[aria-label="Copy code"]').should('exist')
    cy.get('a[download="README.md"]').should('exist')

    // Wrap words button should be disabled when in Preview mode, and enabled when in Code mode.
    cy.get('button[aria-label="Wrap words"]').should('be.disabled')
    cy.get('button').contains('Code').click()
    cy.get('button[aria-label="Wrap words"]').should('not.be.disabled')
  })

  it('renders the page breadcrumb', () => {
    cy.visit('/workspace/6b0/file/a8a92308e217ac5626809237dd90a31240b22834/README.md')

    cy.get('nav[aria-label="Breadcrumb"]').within(() => {
      cy.get('a')
        .should('have.length', 1)
        .and('have.attr', 'href', '/workspace/6b0/file/a8a92308e217ac5626809237dd90a31240b22834')
      cy.get('[aria-current="page"]').should('contain.text', 'README.md')
    })
  })

  it('returns to the workspace file browser when going back from a file', () => {
    cy.visit('/workspace/add', {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleError')
      },
    })
    cy.get('a.text-link').contains('human_body_Layout1_thumbnail.jpeg').click({ force: true })
    cy.get('img[alt="human_body_Layout1_thumbnail.jpeg"]').should('exist')
    // Wait for the workspace crumb to become a link before leaving.
    cy.get('nav[aria-label="Breadcrumb"] a').should('exist')

    cy.go('back')

    cy.location('pathname').should('eq', '/workspace/add')
    cy.get('a.text-link').contains('human_body_Layout1_thumbnail.jpeg').should('exist')
    cy.get('img[alt="human_body_Layout1_thumbnail.jpeg"]').should('not.exist')
    // The file view must not render with the folder's route params on the way out.
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /Missing required param/)
  })
})
