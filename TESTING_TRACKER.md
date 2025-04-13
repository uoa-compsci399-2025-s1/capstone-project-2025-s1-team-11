# TESTING_TRACKER.md

This doc tracks the testing infrastructure implemented in the project, for easier removal of internal testing code before deployment.

---

## Installation/Setup

### Frontend (`client/`)
| Tool              | Purpose                       | Location                           |
|-------------------|-------------------------------|------------------------------------|
| **Jest**          | Unit testing React components | `client/src/components/__tests__/` |
| **RTL**           | DOM testing for React         | integrated with Jest               |
| **Cypress**       | End-to-end testing            | `client/cypress/e2e/`              |
| **Utility Tests** | Logic & helper functions      | `client/src/utilities/__tests__/`  |

**Files:**
- `jest.config.mjs` — Configures Jest for the client app
- `cypress.config.js` — Cypress configuration
- `fileTypeDetection.js` — File type detection utility
- Test files end in `.test.js` or `.cy.js` (Cypress)

---

### Backend (TBC)

#### Planned:
- **Pytest** — For testing Python utilities/scripts
- Location: `server/tests/` *(once backend testing is introduced)*

---

## Commit Log & History

Track changes related to testing infrastructure:
- 2025-04-10: Initial test scaffolding committed — `Jest`, `Cypress`, utility tests
- 2025-04-10: File import tests & file type detection logic added
- TODO: Add `pytest` tests once backend functionality is expanded

---

## Cleanup for Deployment

- Remove or comment out CI scripts (e.g., GitHub Actions)
- Delete or archive `__tests__` folders
- Remove dev-only dependencies (`jest`, `cypress`, etc.)