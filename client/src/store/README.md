# Redux Store
The store contains:

examHelpers.js: Helper functions so simplify some reducers.

examSlice.js: Redux exam slice model including reducers (reducers are like 'setters')

examUtils.js: Model object factory functions

selectors.js: Set of selectors to retreive model data from redux state (selectors are like 'getters')

# Development Console
You can play with the data model using the examConsole.jsx page.  

To use, 

1. Install the client per the main [README.md](https://github.com/uoa-compsci399-2025-s1/capstone-project-2025-s1-team-11/blob/main/README.md) client installation instructions.
2. Install Redux Devtools for chrome via chrome store (not accessible when logged in with mym uni account?) or [Redux Github](https://github.com/reduxjs/redux-devtools/releases)
3. Run client by navigating to /client/ then running ```npm run dev```
4. Navigate to the provided http://localhost:<port>/console
5. Open developer tools ctrl + shift + I and navigate to the Redux tab.
6. Try these exam console commands to build an exam into the redux state:

```
help
create-exam "Redux Exam" "CS399" "Capstone" "S2" 2025
add-question "What is 1 + 1?" 1
add-section "" "This section will have some questions" 
add-question "This question should end up in the section at examBody index 1?" 1.5 1
add-question "Does this question end up in the same section?" 1.5 1
selector table-questions
```

Note that the console reducer/selector names don't exactly match the javascript names/syntax.

Should see something like this:
![Image](https://github.com/user-attachments/assets/ad756e9e-22c3-41ee-9457-6ef75bf74ed6)





