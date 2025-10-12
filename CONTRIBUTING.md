# Contributing to Docbase

Thank you for your interest in contributing to Docbase! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and considerate of others. We're all here to build something great together.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** and description
- **Steps to reproduce** the behavior
- **Expected behavior** vs what actually happened
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)
- **Error messages** or logs

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title** and detailed description
- **Use case** - why would this be useful?
- **Mockups** or examples if applicable
- **Alternatives** you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our code guidelines below
3. **Test your changes** - make sure the build passes
4. **Update documentation** if you changed functionality
5. **Write clear commit messages**
6. **Submit a pull request**

## Development Setup

See [SETUP.md](SETUP.md) for complete setup instructions.

Quick start:

```bash
git clone https://github.com/alanagoyal/docbase
cd docbase
npm run setup  # Interactive configuration
npm install
npm run dev
```

## Code Guidelines

### General Principles

- **Simplicity First** - Keep changes as simple as possible
- **Small Changes** - Break large features into smaller PRs
- **Minimal Impact** - Touch as little code as necessary
- **Readability** - Write code that's easy to understand

### TypeScript

- Use TypeScript for all new files
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Handle null/undefined cases explicitly

### React/Next.js

- Use functional components with hooks
- Keep components focused and single-purpose
- Use server components where possible
- Follow Next.js App Router patterns

### Styling

- Use Tailwind CSS for styling
- Follow existing component patterns
- Use the design system components from `components/ui/`
- Maintain responsive design (mobile-first)

### Database

- All database changes must go through migrations
- Never modify data directly in production
- Test RLS policies carefully
- Document RPC functions

## Testing Changes

Before submitting a PR:

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build the project
npm run build

# Test in development
npm run dev
```

## Commit Messages

Use clear, descriptive commit messages:

**Good:**

```
Add file size validation to link upload
Fix analytics page missing RPC function
Update README with setup wizard instructions
```

**Not so good:**

```
fix bug
updates
WIP
```

## Project Structure

```
docbase/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── account/           # Account management
│   ├── links/             # Link CRUD operations
│   └── ...
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   └── ...
├── supabase/
│   └── migrations/        # Database migrations
├── lib/                   # Utility functions
├── utils/                 # Helper utilities
└── types/                 # TypeScript type definitions
```

## Adding New Features

When adding a new feature:

1. **Plan it out** - Create an issue or discussion first
2. **Database changes** - Create a new migration file if needed
3. **API routes** - Add in `app/api/` if needed
4. **Components** - Create reusable components when possible
5. **Types** - Update TypeScript types
6. **Documentation** - Update README or add docs
7. **Test** - Verify it works end-to-end

## Common Tasks

### Adding a Database Table

1. Create a new migration file in `supabase/migrations/`
2. Name it with timestamp: `YYYYMMDDHHMMSS_description.sql`
3. Include:
   - Table creation
   - RLS policies
   - Indexes if needed
4. Test locally: `npx supabase db reset`

### Adding an API Route

1. Create file in `app/api/your-route/route.ts`
2. Export `GET`, `POST`, etc. functions
3. Use Supabase server client from `utils/supabase/server`
4. Add proper error handling and logging
5. Return appropriate status codes

### Adding a Component

1. Create in `components/` directory
2. Use TypeScript
3. Follow existing patterns (client vs server components)
4. Import UI components from `components/ui/`
5. Add proper prop types

## Questions?

- 💬 [Start a discussion](https://github.com/alanagoyal/docbase/discussions)
- 🐛 [Open an issue](https://github.com/alanagoyal/docbase/issues)

Thank you for contributing to Docbase! 🎉
