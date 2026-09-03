describe('Workspace detail page', () => {
  beforeEach(() => {
    cy.visit('/workspaces/da8')
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
})
