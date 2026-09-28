// https://on.cypress.io/api

describe('It covers global layout, navigation and routing.', () => {
  describe('Header', () => {
    it('displays the header with the logo and navigation links.', () => {
      cy.visit('/')
      cy.get('header').should('be.visible')
      cy.get('header').contains('Workspaces')
      cy.get('header').contains('Exposures')
      cy.get('header').contains('Log in')
      cy.get('header').contains('button', 'Open search')
    })

    it('navigates between pages using the header links.', () => {
      cy.visit('/')
      cy.get('header').contains('a', 'Workspaces').click()
      cy.url().should('include', '/workspaces')

      cy.get('header').contains('a', 'Exposures').click()
      cy.url().should('include', '/exposures')

      cy.get('header').contains('a', 'Log in').click()
      cy.url().should('include', '/login')
    })

    it('opens the search dialog when clicking the search icon in the header.', () => {
      cy.visit('/')
      cy.get('header').contains('button', 'Open search').click()

      const searchDialog = cy.get('div[role="dialog"][aria-label="Search"]')
      searchDialog.should('be.visible')
      searchDialog.contains('h2', 'Search').should('be.visible')
      searchDialog.get('button[aria-label="Close"]').should('be.visible')
    })

    it('navigates to the home page when clicking the logo.', () => {
      cy.visit('/workspaces')
      cy.get('header [aria-label="Home"]').click()
      cy.url().should('eq', Cypress.config().baseUrl)
    })
  })

  describe('Footer', () => {
    beforeEach(() => {
      cy.visit('/')
    })

    it('displays the footer.', () => {
      cy.get('footer').should('be.visible')
    })

    it('contains GitHub repository links.', () => {
      cy.get('footer a[href*="github.com"]').should('have.length', 2)
    })
  })
})
