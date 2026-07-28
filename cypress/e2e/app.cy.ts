// https://on.cypress.io/api

describe('Home Page Test', () => {
  it('visits the app root url', () => {
    cy.visit('/')
    cy.contains('h1', 'Physiome Model Repository')
  })

  it('visits the app login page', () => {
    cy.visit('/login')
    cy.contains('h1', 'Login')
  })
})
