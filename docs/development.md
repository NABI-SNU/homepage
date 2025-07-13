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
