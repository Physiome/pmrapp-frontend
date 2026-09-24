describe('Workspace detail page', () => {
  it('renders the workspace detail page with correct title', () => {
    cy.visit('/workspaces/6b0')

    cy.get('h1').should('exist')
    cy.get('h1').should('contain.text', '12 L Platform 1 model codes')
  })

  it('renders the README.md link and navigates to the file view page', () => {
    cy.visit('/workspaces/6b0')

    cy.get('a.text-link').contains('README.md').should('exist')
    // The link is sometimes covered by the cookie banner.
    cy.get('a.text-link').contains('README.md').click({force: true})

    cy.url().should('include', '/workspaces/6b0/file/a8a92308e217ac5626809237dd90a31240b22834/README.md')
  })

  it('renders the file view page with action buttons', () => {
    cy.visit('/workspaces/6b0/file/a8a92308e217ac5626809237dd90a31240b22834/README.md')

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
})
