describe('Feature comparison page', () => {
  beforeEach(() => {
    cy.visit('/feature-comparison');
    cy.get('.category-title').should('exist');
  });

  // The table header row must stay pinned at the bottom of the sticky header,
  // whether or not the preview banner (which changes the header height) has been dismissed.
  const assertHeaderRowIsStuck = () => {
    cy.get('.category-title').last().scrollIntoView();
    cy.get('header').then(($header) => {
      const headerBottom = $header[0].getBoundingClientRect().bottom;

      cy.get('.header-row').should(($row) => {
        const rect = $row[0].getBoundingClientRect();

        // The row slightly overlaps the bottom of the header.
        expect(rect.top).to.be.closeTo(headerBottom, 6);
        expect(rect.bottom).to.be.greaterThan(headerBottom);
      });
    });
  };

  it('keeps the table header row stuck below the header when scrolling.', () => {
    assertHeaderRowIsStuck();
  });

  it('keeps the table header row stuck below the header after the preview banner is closed.', () => {
    cy.get('button[aria-label="Close notification"]').click();
    cy.get('button[aria-label="Close notification"]').should('not.exist');

    assertHeaderRowIsStuck();
  });
});
