// https://on.cypress.io/api

describe('It covers navigation and routing.', () => {
  describe('Header', () => {
    it('displays the header with the logo and navigation links.', () => {
      cy.visit('/')
      cy.get('header').should('be.visible')
      cy.get('header').contains('Workspaces')
      cy.get('header').contains('Exposures')
      cy.get('header').contains('Log in')
    })

    it('navigates to the home page when clicking the logo.', () => {
      cy.visit('/workspaces')
      cy.get('header .nav-link').first().click()
      cy.url().should('eq', Cypress.config().baseUrl)
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
      searchDialog.get('input[type="text"][aria-label="Search term"]').should('be.visible')
    })
  })

  describe('Footer', () => {
    it('displays the footer with copyright information.', () => {
      cy.visit('/')
      cy.get('footer').should('be.visible')
      cy.get('footer').contains('IUPS Physiome project')
      cy.get('footer').contains(new Date().getFullYear().toString())
    })

    it('contains GitHub repository links.', () => {
      cy.visit('/')
      cy.get('footer a[href*="github.com"]').should('have.length', 2)
    })
  })

  it('visits the app login page', () => {
    cy.visit('/login')
    cy.contains('h1', 'Login')
  })
})
