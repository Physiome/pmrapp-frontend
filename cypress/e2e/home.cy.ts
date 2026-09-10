describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('has the correct title.', () => {
    cy.title().should('eq', 'Physiome Model Repository')
  })

  it('renders a header component.', () => {
    cy.get('header').should('be.visible')
  })

  it('renders a footer component.', () => {
    cy.get('footer').should('be.visible')
  })

  it('renders an <h1> element.', () => {
    cy.get('h1').should('exist')
    cy.get('h1').should('contain.text', 'Physiome Model Repository')
  })

  it('renders a description after the <h1> element.', () => {
    cy.get('h1 + p').should('exist')
    cy.get('h1 + p').should('contain.text', 'CellML models')
  })

  it('displays navigation cards for Workspaces and Exposures.', () => {
    cy.contains('Workspaces').should('be.visible')
    cy.contains('Exposures').should('be.visible')
  })

  it('renders a keyword browser component.', () => {
    cy.contains('Browse by keyword').should('be.visible')
    cy.get('[aria-label="Filter keywords"]').should('be.visible')
    cy.contains('button', '1,4,5-triphosphate').should('be.visible')
  })

  it('navigates to the Workspaces page from the home page.', () => {
    cy.contains('a', 'Workspaces').first().click()
    cy.url().should('include', '/workspaces')
  })

  it('navigates to the Exposures page from the home page.', () => {
    cy.contains('a', 'Exposures').first().click()
    cy.url().should('include', '/exposures')
  })
})
