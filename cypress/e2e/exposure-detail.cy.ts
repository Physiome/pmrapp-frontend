describe('Exposure detail page', () => {
  beforeEach(() => {
    cy.visit('/exposures/da9')

    // Clear the downloads folder before starting the test.
    // Only for the GUI runner (`cypress open`)
    // because the headless runner (`cypress run`) automatically clears
    // the downloads folder before each test.
    if (Cypress.config('isInteractive')) {
      cy.task('clearDownloads')
    }
  })

  after(() => {
    // Clear the downloads folder after finishing the test.
    cy.task('clearDownloads')
  })

  it('has the correct title.', () => {
    cy.title().should('include', 'Noble, Denyer, Brown, DiFrancesco, 1992')
    cy.title().should('include', 'Physiome Model Repository')
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

  it('renders the source with workspace information.', () => {
    cy.get('aside section').contains('Noble, Denyer, Brown, DiFrancesco, 1992').should('exist')
    cy.get('aside section').contains('bd2816434c6b').should('exist')
  })

  it('renders the citation section.', () => {
    cy.get('h4').contains('Citation').should('exist')
  })

  it('renders the citation with the correct information.', () => {
    cy.get('aside section').contains('Noble, Denyer, Brown, DiFrancesco, 1992.').should('exist')
    cy.get('aside section').contains('(2026). Physiome Model Repository.').should('exist')
    cy.get('aside section').contains('/exposures/da9').should('exist')
  })

  it('renders the views available section.', () => {
    cy.get('h4').contains('Views available').should('exist')
  })

  it('verifies the link to OpenCOR Web app.', () => {
    cy.get('aside section').contains('a', "Open with OpenCOR's Web app")
      .should('have.attr', 'href')
      .and('include', '//opencor.ws/app/?opencor://openFiles/')
      .and('include', 'https://models.physiomeproject.org/workspace/da8/')
      .and('include', 'rawfile/bd2816434c6beff84e7a76b34249861086cff35b/noble_denyer_brown_difrancesco_1992.cellml')
      .and('include', '%7Chttps://models.physiomeproject.org/workspace/da8/rawfile')
      .and('include', '/bd2816434c6beff84e7a76b34249861086cff35b/noble_denyer_brown_difrancesco_1992.sedml')
  })

  it('verifies the link to generate code.', () => {
    cy.get('aside section').contains('a', 'Generate code').click()
    cy.url().should('include', '/cellml_codegen/C')
  })

  it('verifies the link to the Mathematics section.', () => {
    cy.get('aside section').contains('a', 'Mathematics').click()
    cy.url().should('include', '/cellml_math')
  })

  it('renders the navigation section.', () => {
    cy.get('h4').contains('Navigation').should('exist')
  })

  it('renders the navigation link for the CellML file.', () => {
    cy.get('aside section a').contains('noble_denyer_brown_difrancesco_1992.cellml')
      .should('exist')
  })

  it('renders the downloads section.', () => {
    cy.get('h4').contains('Downloads').should('exist')
  })

  it('downloads the Complete archive as a .zip file with the correct filename.', () => {
    cy.get('[download="Noble, Denyer, Brown, DiFrancesco, 1992.zip"]').click()

    const downloadsFolder = Cypress.config('downloadsFolder')
    const expectedFileName = 'da8.zip' // "da8" is workspace's alias.
    const filePath = `${downloadsFolder}/${expectedFileName}`

    cy.readFile(filePath, { timeout: 10000 }).should('exist')
  })

  it('downloads the Complete archive as a .tgz file with the correct filename.', () => {
    cy.get('[download="Noble, Denyer, Brown, DiFrancesco, 1992.tgz"]').click()

    const downloadsFolder = Cypress.config('downloadsFolder')
    const expectedFileName = 'da8.tgz' // "da8" is workspace's alias.
    const filePath = `${downloadsFolder}/${expectedFileName}`

    cy.readFile(filePath, { timeout: 10000 }).should('exist')
  })

  it('downloads the COMBINE archive file with the correct filename.', () => {
    cy.get('aside').contains('button', 'COMBINE archive').click()

    const downloadsFolder = Cypress.config('downloadsFolder')
    const expectedFileName = 'Noble, Denyer, Brown, DiFrancesco, 1992.omex'
    const filePath = `${downloadsFolder}/${expectedFileName}`

    cy.readFile(filePath, { timeout: 10000 }).should('exist')
  })

  it('downloads the individual CellML file with the correct filename.', () => {
    cy.get('.box ul li a[download="noble_denyer_brown_difrancesco_1992.cellml"]').click()

    const downloadsFolder = Cypress.config('downloadsFolder')
    const expectedFileName = 'noble_denyer_brown_difrancesco_1992.cellml'
    const filePath = `${downloadsFolder}/${expectedFileName}`

    cy.readFile(filePath, { timeout: 10000 }).should('exist')
  })

  it('renders the licence section.', () => {
    cy.get('h4').contains('Licence').should('exist')
  })

  it('renders the licence information with the correct link.', () => {
    cy.get('aside section a').contains('CC BY 3.0')
      .should('exist')
      .and('have.attr', 'href')
      .and('include', 'https://creativecommons.org/licenses/by/3.0/')
  })
})
