export default {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // if we using it
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
    }
};