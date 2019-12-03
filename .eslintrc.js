module.exports = {
  "extends": [
    "airbnb-base",
    "prettier",
  ],
  "plugins": [
    "prettier",
  ],
  "rules": {
    // Prettier
    "prettier/prettier": ["error"],

    // Import rules
    "import/no-extraneous-dependencies": ["error", {"devDependencies": true}],
    "import/prefer-default-export": "off",

    // General rules
    "func-style": ["error", "declaration"],
  },
}