describe('Exposure detail page', () => {
  beforeEach(() => {
    cy.visit('/exposures/da9')
  })

  it('has the correct title.', () => {
    cy.title().should('include', 'Noble, Denyer, Brown, DiFrancesco, 1992')
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
    cy.get('h1').should('contain.text', 'Noble, Denyer, Brown, DiFrancesco, 1992')
  })

  it('renders the html-view content.', () => {
    cy.get('.html-view').should('exist')
  })

  it('renders the file browser.', () => {
    cy.get('ul.divide-y').should('exist')
    cy.get('ul.divide-y > li').should('have.length', 7)
  })

  it('renders the source section.', () => {
    cy.get('h4').contains('Source').should('exist')
  })

  it('renders the citation section.', () => {
    cy.get('h4').contains('Citation').should('exist')
  })

  it('renders the views available section.', () => {
    cy.get('h4').contains('Views available').should('exist')
  })

  it('renders the navigation section.', () => {
    cy.get('h4').contains('Navigation').should('exist')
  })

  it('renders the downloads section.', () => {
    cy.get('h4').contains('Downloads').should('exist')
  })

  it('renders the licence section.', () => {
    cy.get('h4').contains('Licence').should('exist')
  })
})
