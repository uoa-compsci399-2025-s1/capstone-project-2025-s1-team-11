/// <reference types="cypress" />
describe('Cypress is working', () => {
    it('visits the local app and checks for something', () => {
        cy.visit('http://localhost:5173'); // Make sure you're running `npm run dev`
        cy.contains('Import').should('exist'); // Or change to any keyword in your app
    });
});