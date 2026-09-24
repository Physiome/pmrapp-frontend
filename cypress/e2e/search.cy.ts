describe('Search page', () => {
  const selectors = {
    searchInput: 'input[type="text"][aria-label="Search term"]',
    searchButton: 'button[aria-label="Search"]',
    clearSearchButton: 'button[aria-label="Clear search"]',
    advancedSearchButton: 'button[aria-label="Advanced Search"]',
    filterInput: 'input[type="text"][aria-label="Filter search terms"]',
    resultItems: 'main .box > div',
  }

  const expectResults = (summaryText: string, itemCount: number) => {
    cy.contains(summaryText).should('exist')
    cy.get(selectors.resultItems).should('have.length', itemCount)
  }

  // TODO: disabled for new search UI
  const _chooseAdvancedSearchTerm = (filter: string, optionLabel: string) => {
    cy.get(selectors.filterInput).clear().type(filter)
    cy.get(`button[aria-label="Search for ${optionLabel}"]`)
      .contains(optionLabel)
      .should('exist')
      .click()
  }

  beforeEach(() => {
    cy.visit('/search')
  })

  it('has the correct title.', () => {
    cy.title().should('include', 'Search')
    cy.title().should('include', 'Physiome Model Repository')
  })

  it('renders an <h1> element.', () => {
    cy.get('h1').should('exist')
    cy.get('h1').should('contain.text', 'Search')
  })

  it('displays search results for a valid query.', () => {
    cy.get(selectors.searchInput).type('mnt{enter}')
    expectResults('5 results for mnt.', 5)

    cy.get(selectors.clearSearchButton).should('exist')
  })
})
