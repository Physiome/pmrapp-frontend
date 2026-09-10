describe('Login page', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('has the correct title.', () => {
    cy.title().should('include', 'Login')
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
    cy.get('h1').should('contain.text', 'Login')
  })

  it('displays the login form.', () => {
    cy.get('input[type="text"]').should('exist')
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
    cy.get('button[type="submit"]').should('contain.text', 'Login')
  })
})
