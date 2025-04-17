# Redux Setup Overview

This document explains our Redux integration and provides an overview of the files, directories, and tools installed to manage centralized application state.

## What is Redux?

Redux is a predictable state container for JavaScript apps. It helps us maintain a single source of truth by storing the entire application state in one centralized store. This makes it easier to manage state changes, debug our application with Redux DevTools, and keep our UI consistent.

## Tools Installed

- **@reduxjs/toolkit**:  
  - Simplifies Redux development by providing a standard way to configure the store and create slices.
  - Reduces the boilerplate code typically required in Redux.
  
- **react-redux**:  
  - Connects our React components to the Redux store.
  - Provides useful hooks such as `useSelector` (to access state) and `useDispatch` (to dispatch actions).

- **Redux DevTools** (Browser Extension):  
  - Allows you to inspect and debug Redux state and actions in real time.
  - Make sure to install it from the Chrome Web Store or the equivalent for your browser.

## Files and Directories Created for Redux

- **src/store/store.js**  
  - **Purpose:** Configures the Redux store using Redux Toolkit's `configureStore`.
  - **Details:** Combines reducers from various slices into one central store. In our setup, it includes the exam slice reducer.
  
- **src/features/exam/examSlice.js**  
  - **Purpose:** Manages the exam-related state.
  - **Details:**  
    - **Initial State:** Contains properties like `exams` (an array to store exam objects), `status`, and `error`.
    - **Reducers/Actions:**  
      - `examAdded` – Adds a new exam to the state.
      - `examUpdated` – Updates an existing exam.
      - `examDeleted` – Removes an exam from the state.
  
- **src/main.jsx**  
  - **Purpose:** Bootstraps the React application.
  - **Updates:**  
    - The application is now wrapped with Redux’s `<Provider>` component.  
    - This makes the Redux store available to all React components through the hooks provided by `react-redux`.

- **Optional Testing Component (if needed)**  
  - **src/components/ReduxTest.jsx** (temporary)  
    - **Purpose:** Was used to test our Redux setup by dispatching actions (such as `examAdded`) and displaying the updated state.
    - **Status:** Once testing is complete, this component can be removed or commented out.

## How to Use Redux in Our Project

1. **Accessing the State:**  
   Use the `useSelector` hook to read data from the store.
   ```jsx
   import { useSelector } from 'react-redux';

   const exams = useSelector(state => state.exam.exams);
