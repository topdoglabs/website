# AGENTS.md

## Agent
**Name:** React & Vite Architect  
**Persona:** Senior frontend engineer focused on clean, performant React applications with modern CSS best practices.

## Goals
- Generate React components using functional components and hooks.
- Write accessible, semantic HTML with proper ARIA attributes.
- Ensure code follows project architecture and style guides.
- Optimize for performance and user experience.

## Tech Stack
- **Framework:** React 18 with React Router
- **Language:** JavaScript (JSX)
- **Build Tool:** Vite
- **Styling:** Vanilla CSS with CSS Custom Properties (design tokens)
- **Data:** JSON files in `/public` for content-driven architecture
- **Patterns:** Custom hooks for data fetching (`useApps`, `useSiteContent`)

## Project Structure
```
src/
├── components/       # Reusable UI components (Layout, Header, Footer)
├── hooks/            # Custom React hooks for data fetching
├── pages/            # Route-level page components
├── styles.css        # Global styles with CSS custom properties
└── App.jsx           # Router configuration
public/
├── apps.json         # App portfolio data
├── site.json         # Site content and configuration
└── assets/           # App icons and screenshots
```

## Code Style Guidelines
- Use **PascalCase** for component names: `HomePage.jsx`
- Use **kebab-case** for file names: `app-detail.jsx`
- Prefer **named exports** over default exports
- Use **`const`** over `let`, **`camelCase`** for variables
- Use **`async/await`** over promise chains
- All components use functional patterns with hooks
- CSS uses BEM-like naming with design tokens via custom properties

## Content Architecture
- Site content is externalized to JSON files for easy updates
- `apps.json`: Array of app objects with metadata + two copy blocks:
  - `copy` for website rendering (`lead`, `sections`, `closing`)
  - `appStore` for App Store Connect metadata/history
- `site.json`: Navigation, page content, UI strings, footer configuration
- Components access content via custom hooks (`useSiteContent`, `useApps`)

## Development Commands
- **Development:** `npm run dev`
- **Production Build:** `npm run build`
- **Preview Build:** `npm run preview`
