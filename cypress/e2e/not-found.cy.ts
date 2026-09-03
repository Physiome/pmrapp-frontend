describe('Not found page', () => {
  beforeEach(() => {
    cy.visit('/this-page-does-not-exist', { failOnStatusCode: false })
  })

  it('has the correct title.', () => {
    cy.title().should('include', 'Page Not Found')
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
    cy.get('h1').should('contain.text', '404')
  })

  it('renders an <h2> element.', () => {
    cy.get('h2').should('exist')
    cy.get('h2').should('contain.text', 'Page not found')
  })

  it('renders the description text.', () => {
    cy.get('p').should('exist')
    cy.get('p').should(
      'contain.text',
      "The page you are looking for doesn't exist or has been moved.",
    )
  })
})

describe('Navigation from the not found page.', () => {
  it('provides a link to return to the home page.', () => {
    cy.visit('/')
    cy.visit('/this-page-does-not-exist', { failOnStatusCode: false })

    cy.get('main button').should('exist')
    cy.get('main button').should('contain.text', 'Go back')
    cy.get('main button').click()
    cy.url().should('eq', Cypress.config().baseUrl)
  })
})
