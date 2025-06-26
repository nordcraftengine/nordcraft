# Nordcraft end-to-end testing

This repository contains the end-to-end tests for Nordcraft projects. Tests are written with playwright and run on GitHub Actions.

## How to write tests

1. Create a new file in the `tests` directory.
2. Write your tests using the playwright API.
3. Run the tests on your machine to make sure they work as expected.

## How to run the tests locally

```bash
# Install dependencies
bun i

# Install playwright browsers
bunx playwright install

# Run the tests headed in chromium only and show detailed report (default)
bun start

# Run the tests headed in chromium only and show detailed report for a specific branch
BRANCH=branch-name bun start

# Run the tests headless in all browsers and show results in the terminal (default for CI)
bun run test
```
