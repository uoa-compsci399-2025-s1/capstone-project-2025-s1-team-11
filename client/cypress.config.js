import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },

  fixturesFolder: "src/testing/e2e/cypress/fixtures",
  screenshotsFolder: "src/testing/e2e/cypress/screenshots",
  videosFolder: "src/testing/e2e/cypress/videos",
  downloadsFolder: "src/testing/e2e/cypress/downloads",

  e2e: {
    baseUrl: 'http://localhost:5173', // Add t
    supportFile: "src/testing/e2e/cypress/support/e2e.js",
    specPattern: "src/testing/e2e/**/*.cy.{js,jsx,ts,tsx}",
    // eslint-disable-next-line no-unused-vars
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
  },
});