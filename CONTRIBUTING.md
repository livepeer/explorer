# Contributing to the Livepeer Explorer

Thank you for considering contributing to the Livepeer Explorer. We welcome any contributions that can help improve the project, including bug reports, feature requests, and code changes.

## Getting Started

Contributions are made to this repo via Issues and Pull Requests (PRs).

To run the code locally, you will need to fork the code, and follow the instructions [here](https://github.com/livepeer/explorer/blob/main/README.md).

### Issues

Issues should be used to report bugs, explain UX problems, request a new feature, or to discuss potential changes before a PR is created. When you create a new Issue, a template will be loaded that will guide you through collecting and providing the information we need to investigate.

If you find an issue you want to work on, follow the Commits and Pull Request instructions!

### Commits

As best as possible, try to follow Conventional Commit patterns as described [here](https://www.conventionalcommits.org/en/v1.0.0/).

### Code Conventions

Many style conventions are enforced by a combination of ESLint and Prettier. These tools run automatically during the commit phase via `husky` hooks and are rechecked in the CI pipeline.  
Additional conventions, not yet enforced at the time of writing, include:

#### JSDoc

Write JSDoc for all functions and methods in classes unless you have a good reason not to (e.g., NextJS route or page components). At minimum, include a general description of the functionality.

### Pull Requests

In general, PRs should:

- Address a single concern in the least number of changed lines as possible.
- Include documentation in the repo if applicable.
- Be accompanied by a complete Pull Request template (loaded automatically when a PR is created).

In general, we follow the ["fork-and-pull" Git workflow](https://github.com/susam/gitpr)

1. Fork the repository to your own GitHub account
2. Clone the project to your machine
3. Create a branch locally with a succinct but descriptive name
4. Commit changes to the branch (see Commits instructions)
5. Push changes to your fork
6. Open a PR in our repository and follow the PR template so that we can efficiently review the changes.

## Getting Help

Join us in the [Livepeer Discord](https://discord.com/invite/livepeer) and post your question in the `#🛋️|lounge` channel.
