describe('Workspaces page', () => {
  beforeEach(() => {
    cy.visit('/workspaces')
  })

  it('has the correct title.', () => {
    cy.title().should('include', 'Workspaces')
    cy.title().should('include', 'Physiome Model Repository')
  })

  it('renders a header component.', () => {
    cy.get('header').should('be.visible')
  })

  it('renders a footer component.', () => {
    cy.get('footer').should('be.visible')
  })

  it('renders an <h1> element.', () => {
    cy.get('h1').should('exist')
    cy.get('h1').should('contain.text', 'Workspace listing')
  })

  it('renders a description with the workspace count.', () => {
    cy.get('h1 + p').should('exist')
    cy.get('h1 + p').should('contain.text', 'Browse and explore all 1,295 workspaces.')
  })

  it('provides filtering and sorting functionality.', () => {
    cy.get('input[type="text"][aria-label="Filter items"]').should('exist')
    cy.get('button[aria-label="Sort options"]').should('exist')
    cy.get('button').contains('Refresh').should('exist')
  })

  it('renders a listing with workspace data.', () => {
    cy.get('.box').should('exist')
    cy.get('.box > div').should('have.length', 1295)
  })
})
