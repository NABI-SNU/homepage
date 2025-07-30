# Development Guide

This document covers how to set up the environment and run the NABI website locally.

## Prerequisites

- **Node.js 18** or newer must be installed.
- Install dependencies with `npm install`.

## Useful npm scripts

- `npm run dev` – Start a development server with hot reload.
- `npm run build` – Build the production version of the site into `dist/`.
- `npm run preview` – Preview the built site locally.
- `npm run check` – Run TypeScript, ESLint and Prettier checks.

## Running locally

1. Clone the repository and run `npm install` to install all dependencies.
2. Execute `npm run dev` to start the dev server. Visit the printed URL in your browser to view the site.
3. Content pages can be edited under `src/pages/` and Markdown posts in `src/data/post`.

## Pre-commit hooks

This project uses [pre-commit](https://pre-commit.com/) to automatically run
formatting and linting on staged files. Pre-commit can be installed via `brew` or `pip`.
Install the hooks once after cloning
the repository:

```bash
pre-commit install
```

The hooks will then run every time you commit.

## Building for production

To generate the static site run:

```bash
npm run build
```

The output is written to `dist/`. You can preview this build locally with:

```bash
npm run preview
```

Deploy the contents of `dist/` to your preferred static hosting provider.

## Semantic Versioning

This project uses [Semantic Versioning](https://semver.org/) for versioning. Unfortunately, there is no public facing API for the NABI website (yet), meaning versioning may not _strictly_ be necessary. Nevertheless, it is a good practice to version the site. This is generally how versioning works (_Updated: 2025-07-30_):

1. `x.y.Z` - bump `Z` for bug fixes and minor changes to the site code (but not for content updates).
2. `x.Y.z` - bump `Y` for minor additions of features, and for addition or removal of dependencies. Note that this does not include updates to dependencies, or dependencies that are used for linting or formatting.
3. `X.y.z` - bump `X` for major changes to the site code, or for major changes to the content.

(What is the difference between **code** and **content**? This has no strict answer, but if it is stored as plain text in the final product, it is content. If it is in any way executed, it is code.)

### Release Process

1. Bump the version in `package.json` and `package-lock.json`.
2. Create a new release on GitHub with the new version number.
3. The release will trigger a GitHub Actions workflow to build the site and deploy it to the GitHub Pages site.
