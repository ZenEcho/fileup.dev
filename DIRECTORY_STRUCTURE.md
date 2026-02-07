# Directory Structure & Conventions

## Directory Tree

| Directory | Description | Content |
|---|---|---|
| `src/frontend/` | Authenticated Frontend | Dashboard, Plugin Marketplace, Submission |
| `src/backstage/` | Backstage Management | Admin Review, User Management |
| `src/homepage/` | Public Homepage | Landing Page, Login, Auth Callback |
| `src/common/` | Shared Resources | Components, Utils, Stores, Services, Styles, Locales |

## Internal Structure Paradigm
Each top-level directory (`frontend`, `backstage`, `homepage`) follows this structure:

```
directory/
├─ pages/          // Page components (PascalCase)
├─ components/     // Business components (camelCase)
├─ hooks/          // Custom hooks
├─ services/       // API services
├─ utils/          // Utility functions
├─ assets/         // Static assets
└─ styles/         // Scoped styles
```

## Rules

1. **Isolation**:
   - `homepage` cannot import from `frontend` or `backstage`.
   - `frontend` and `backstage` cannot import from each other.
   - Circular dependencies between top-level directories are prohibited.

2. **Sharing**:
   - Any code shared between two or more top-level directories MUST be moved to `src/common`.

3. **Naming**:
   - Pages: `PascalCase.vue` (e.g., `UserDashboard.vue`)
   - Components/Utils: `camelCase` (e.g., `userCard.vue`, `formatDate.ts`)
   - Directories must contain `index.ts` for cleaner imports.

4. **Imports**:
   - Use aliases:
     - `@homepage` -> `src/homepage`
     - `@frontend` -> `src/frontend`
     - `@backstage` -> `src/backstage`
     - `@common` -> `src/common`

## Verification
- Run `npm run build` to verify types and build.
- Ensure no circular dependency warnings.
