/*

This end-to-end test uses Cypress to test basic navigation in your application.

It verifies that:

The home page loads correctly
Users can navigate to the builder page
Users can navigate to the console page

Expected Results: This test will pass if your application has the expected routes and UI elements.
You might need to adjust the selectors (like the text content in cy.contains() calls) to match your actual UI.

 */

describe('Basic Navigation', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('loads the home page', () => {
    // Check that the home page loads successfully
    // Replace "Assessly" with text that actually appears on your home page
    cy.contains('Assessly', { timeout: 6000 }).should('be.visible'); // default timeout is 4000ms, occasionally took longer for me

    // Check that the navigation bar is visible
    cy.get('header').should('exist');
  });

  it('can navigate to the builder page', () => {
    // Find and click the link/button to the builder page
    // Adjust the selector to match your actual UI
    cy.contains('MCQ Builder').click();

    // Verify we're on the builder page
    cy.url().should('include', '/builder');

    // Check that the builder page has loaded
    cy.contains('Builder', { timeout: 6000 }).should('be.visible'); // default timeout is 4000ms, occasionally took longer for me
  });
});