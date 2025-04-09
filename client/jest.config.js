// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // optional but recommended
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
};