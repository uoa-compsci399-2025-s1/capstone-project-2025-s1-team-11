describe('File Import Flow', () => {
    it('uploads a .qti file through the UI', () => {
        cy.visit('http://localhost:5173/builder');

        cy.get('input[type="file"]').attachFile('example.qti');
        cy.contains(/exam uploaded/i).should('exist');
    });
});