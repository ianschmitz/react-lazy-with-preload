module.exports = {
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
    roots: ["<rootDir>/src/"],
    watchPlugins: [
        "jest-watch-typeahead/filename",
        "jest-watch-typeahead/testname",
    ],
};
