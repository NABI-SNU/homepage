# Project Architecture

This repository hosts the source for the **NABI (Natural and Artificial Brain Intelligence)** research group website. The site is built with [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/), providing a modern, performant, and maintainable web presence for the research group.

## Technology Stack

- **Framework**: Astro 4.x - Static site generator with interactive component islands
- **Styling**: Tailwind CSS - Utility-first CSS framework
- **Language**: TypeScript - Type-safe JavaScript
- **Content**: Markdown/MDX - Structured content with frontmatter
- **Icons**: Tabler Icons & Flat Color Icons - Comprehensive icon library
- **Search**: Pagefind - Static search implementation
- **Analytics**: Google Analytics 4 - Web analytics
- **Deployment**: Static hosting (Netlify/Vercel compatible)

## Project Structure

### Root Configuration Files

- `astro.config.ts` – Main Astro configuration including:
  - Integrations (Tailwind, MDX, React, Sitemap, Partytown, etc.)
  - Build optimizations (compression, image optimization)
  - Security headers configuration
  - Markdown processing with math support (KaTeX)
  - Custom virtual modules for configuration

- `package.json` – Dependencies and scripts:
  - Development: `npm run dev` - Local development server
  - Build: `npm run build` - Production static site generation
  - Preview: `npm run preview` - Local preview of built site
  - Type checking: `npm run type-check` - TypeScript validation

- `tsconfig.json` – TypeScript configuration with strict settings
- `tailwind.config.js` – Tailwind CSS configuration and custom design system
- `eslint.config.js` – Code linting rules and formatting

### Source Directory (`src/`)

The `src/` folder contains all application code organized into logical modules:

#### Pages (`src/pages/`)

Astro page components that correspond to routes on the website:

- `index.astro` – Homepage with hero section and featured content
- `about.astro` – About page with research group information
- `people.astro` – Team member profiles and research interests
- `activity.astro` – Research activities and events timeline
- `research.astro` – Research areas and publications
- `contact.astro` – Contact information and form
- `references.astro` – Bibliography and citation management
- `monthly.astro` – Monthly meeting summaries

**Blog System (`src/pages/[...blog]/`)**:

- `index.astro` – Main blog listing with pagination
- `[...page].astro` – Paginated blog pages
- `[category]/[...page].astro` – Category-based filtering
- `[tag]/[...page].astro` – Tag-based filtering
- `[slug].astro` – Individual blog post pages

**News System (`src/pages/news/`)**:

- `[...page].astro` – News listing with pagination
- `[slug].astro` – Individual news article pages

#### Components (`src/components/`)

Reusable UI components organized by functionality:

**Primitive Components (`src/components/primitives/`)**: Contains the low-level building blocks for the website.

- `Button.astro` – Button component with variants
- `Headline.astro` – Typography headlines
- `Background.astro` – Background styling
- `Form.astro` – Form components
- `ItemGrid.astro` – Grid layout components
- `ItemGrid2.astro` – Alternative grid layout
- `Timeline.astro` – Timeline component
- `WidgetWrapper.astro` – Widget container
- `DListItem.astro` – Definition list items

**Blog Components (`src/components/blog/`)**: Contains the components for the blog section of the website.

- `Grid.astro` – Blog post grid layout
- `GridItem.astro` – Individual blog post card
- `List.astro` – Blog post list layout
- `ListItem.astro` – Individual blog post list item
- `SinglePost.astro` – Full blog post display
- `Pagination.astro` – Page navigation controls
- `RelatedPosts.astro` – Related posts suggestions
- `TableOfContents.astro` – Post navigation sidebar
- `Tags.astro` – Tag display and filtering
- `Headline.astro` – Blog post headlines
- `ToBlogLink.astro` – Navigation to blog section

**Client Components (`src/components/client/`)**: Contains the components for the interactive section of the website. (Contains React components)

- `Search.tsx` – Global search functionality
- `SearchBar.tsx` – Search input component
- `PaperSearch.tsx` – Research paper search
- `PaperTile.tsx` – Paper display component
- `SortTabs.tsx` – Content sorting controls
- `PaginationControls.tsx` – Interactive pagination
- `TableOfContents.tsx` – Dynamic table of contents

**Widget Components (`src/components/widgets/`)**: Contains the components for the widgets section of the website, wrapped with `WidgetWrapper.astro`

- `Header.astro` – Site header with navigation
- `Footer.astro` – Site footer with links
- `Hero.astro` – Hero section component
- `HeroText.astro` – Text-based hero section
- `Features.astro` – Feature showcase
- `Features2.astro` – Alternative feature layout
- `Content.astro` – General content wrapper
- `Contact.astro` – Contact form and information
- `FAQs.astro` – FAQ accordion component
- `Stats.astro` – Statistics display
- `Steps.astro` – Step-by-step process display
- `Steps2.astro` – Alternative steps layout
- `CallToAction.astro` – Call-to-action buttons
- `Announcement.astro` – Announcement banners
- `BlogHighlightedPosts.astro` – Featured blog posts
- `BlogLatestPosts.astro` – Recent blog posts
- `Note.astro` – Note/information boxes

**Common Components (`src/components/common/`)**: Contains the components reused throughout the entire website (mostly in `Layout.astro`)

- `Analytics.astro` – Google Analytics integration
- `ApplyColorMode.astro` – Theme mode application
- `BasicScripts.astro` – Essential JavaScript
- `BreadcrumbsJsonLd.astro` – Structured data for breadcrumbs
- `CommonMeta.astro` – Common meta tags
- `CustomStyles.astro` – Custom CSS injection and global styles
- `Favicons.astro` – Favicon management
- `Image.astro` – Optimized image component
- `Logo.astro` – Site logo component
- `Metadata.astro` – Page metadata management
- `OrganizationJsonLd.astro` – Organization structured data
- `Search.astro` – Search functionality wrapper
- `SiteVerification.astro` – Search engine verification
- `SocialShare.astro` – Social media sharing
- `ToggleMenu.astro` – Mobile navigation toggle
- `ToggleTheme.astro` – Theme switching

#### Layouts (`src/layouts/`)

Layout components that define page structure:

- `Layout.astro` – Base layout with HTML structure, meta tags, and common elements
- `PageLayout.astro` – Default page layout used throughout the site

#### Utils (`src/utils/`)

Utility modules for functions that run at build time and are not run at the client side.

- `blog.ts` – Blog post processing, filtering, and pagination
- `permalinks.ts` – URL generation and routing utilities
- `frontmatter.ts` – Markdown frontmatter processing with custom plugins
- `images.ts` – Image optimization and processing
- `images-optimization.ts` – Advanced image optimization utilities
- `people.ts` – Team member data processing
- `papers.ts` – Research paper management
- `monthly.ts` – Monthly meeting data processing
- `directories.ts` – Directory structure utilities
- `utils.ts` – General utility functions

#### Content (`src/content/`)

Content collection configuration for Astro's content management:

- `config.ts` – Content collection schemas and validation

#### Data (`src/data/`)

Static data files and content:

- `people.json` – Team member information
- `post/` – Blog post Markdown files
- `news/` – News article Markdown files

#### Assets (`src/assets/`)

Static assets organized by type:

- `images/` – Site images (hero, logos, icons)
- `styles/` – CSS files:
  - `base.css` – Base styles and CSS custom properties
  - `blog-post.css` – Blog-specific styles
  - `pagefind-ui.css` – Search UI styles
  - `table-of-contents.css` – TOC styling

### Configuration System

#### Site Configuration or Settings (`src/config.yaml`)

Centralized configuration file defining:

**Site Settings**:

- Site name, URL, and base path
- Google site verification
- Trailing slash preferences

**SEO & Metadata**:

- Default page titles and descriptions
- Open Graph configuration
- Robots meta directives
- Default social media images

**Internationalization**:

- Language settings (currently English)
- Text direction configuration

**Blog Configuration**:

- Blog enable/disable settings
- Posts per page (6 by default)
- Permalink structure (`posts/%category%/%slug%`)
- Category and tag pathnames
- Related posts settings
- SEO settings for different blog sections

**Analytics**:

- Google Analytics 4 configuration
- Partytown integration for performance

**UI Settings**:

- Theme mode preferences (system/light/dark)

#### Navigation (`src/navigation.ts`)

Site navigation structure:

- `headerData` – Main navigation menu with dropdowns
- `footerData` – Footer links organized by category
- Social media links and contact information

### Vendor Integration (`vendor/`)

Custom Astro integration for configuration management:

**Main Integration (`vendor/integration/index.ts`)**:

- Loads YAML configuration
- Creates virtual modules for config access
- Updates robots.txt with sitemap reference
- Provides build-time configuration injection

**Utilities (`vendor/integration/utils/`)**:

- `configBuilder.ts` – Configuration processing and validation
- `loadConfig.ts` – YAML file loading utilities

### Public Assets (`public/`)

Static files served directly:

- `favicon.ico` & `favicon.svg` – Site favicons
- `apple-touch-icon.png` – iOS home screen icon
- `robots.txt` – Search engine directives
- `_headers` – Netlify headers configuration

### Content Management

#### Blog Posts

- Location: `src/data/post/`
- Format: Markdown with frontmatter
- Features: Categories, tags, reading time, related posts
- Math support: KaTeX for mathematical notation

#### News Articles

- Location: `src/data/news/`
- Format: Markdown with frontmatter
- Features: Publication dates, author information

#### Team Data

- Location: `src/data/people.json`
- Format: JSON with structured team information
- Features: Research interests, contact information, photos

### Build Process

1. **Configuration Loading**: YAML config loaded and processed
2. **Content Processing**: Markdown files parsed with custom plugins
3. **Component Rendering**: Astro components rendered to HTML
4. **Asset Optimization**: Images optimized, CSS/JS minified
5. **Static Generation**: All pages pre-rendered as static HTML
6. **Search Index**: Pagefind generates search index
7. **Sitemap**: XML sitemap generated for SEO

### Performance Optimizations

- **Static Generation**: All pages pre-rendered at build time
- **Image Optimization**: Automatic image compression and format conversion
- **Code Splitting**: JavaScript loaded only when needed
- **CSS Optimization**: Tailwind purged of unused styles
- **Search Performance**: Static search index for fast queries
- **Analytics**: Partytown for non-blocking analytics loading

### Security Features

- **Content Security Policy**: Strict CSP headers
- **Security Headers**: XSS protection, frame options, HSTS
- **Input Validation**: TypeScript for type safety
- **Sanitization**: Markdown content sanitized

### Development Workflow

1. **Local Development**: `npm run dev` for hot reloading
2. **Type Checking**: `npm run type-check` for TypeScript validation
3. **Build Testing**: `npm run build` for production build verification
4. **Preview**: `npm run preview` for local production testing

### Submodules

The `paperfinder` Git submodule contains:

- Python-based bibliography management
- RSS feed processing for research papers
- Keyword-based paper discovery
- Citation tracking and management

This submodule is optional for basic development but provides advanced bibliography features for the research group.

### Deployment

The site is currently designed for static hosting platforms:

- **Netlify**: Automatic deployment from Git
- **Vercel**: Edge deployment with global CDN
- **GitHub Pages**: Direct Git integration
- **Any Static Host**: Standard static file hosting

The build process generates a fully static site with no server-side dependencies, making it highly scalable and cost-effective.
