module.exports = {
    presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-react",
        "@babel/preset-typescript",
    ],
    plugins: ["@babel/plugin-proposal-nullish-coalescing-operator"],
};
