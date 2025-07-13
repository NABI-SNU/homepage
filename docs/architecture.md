# Project Architecture

This repository hosts the source for the **NABI (Natural and Artificial Brain Intelligence)** website.
The site is built with [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/).
The following sections give an overview of the key directories and files.

## Root files

- `astro.config.ts` – Astro configuration including integrations and build options.
- `package.json` – npm scripts and dependencies. Useful scripts include `npm run dev` for a development server and `npm run build` to generate the static site.
- `tsconfig.json` – TypeScript configuration used across the project.

## Source directory

The `src/` folder contains all application code.

### `src/pages`

Astro page components that correspond to routes on the website. Examples include `index.astro` for the home page and the blog section located under `[...blog]/`.

### `src/components`

Reusable UI components such as blog widgets, navigation elements and Svelte components. These are organised in sub‑folders like `blog/`, `common/` and `news/`.

### `src/layouts`

Layout components wrapping pages. `PageLayout.astro` defines the default page structure used throughout the site.

### `src/utils`

Utility modules shared by pages and components. They handle blog logic, permalink generation, image optimisation and helper functions for managing people, news and papers.

### `src/content`

Configuration for the content collections used by Astro to load posts and news from Markdown files located in `src/data/`.

## Configuration

Site‑wide settings live in `src/config.yaml`. This YAML file defines SEO defaults, blog behaviour, analytics options and UI preferences. The file is read at build time by the custom integration under `vendor/integration` which exposes the settings to the Astro code.

## Public assets

Static files placed in `public/` are copied to the final site as‑is. This includes favicons, the `robots.txt` file and any other static resources.

## Vendor

The `vendor/` directory contains a small integration used to load the YAML configuration and expose it as an Astro virtual module. It also ensures the generated `robots.txt` contains a link to the sitemap when the sitemap integration is enabled.

## Submodules

A Git submodule called `paperfinder` is referenced but is not required for basic development. It is intended for synchronising bibliography data.
