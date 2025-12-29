# Contributing to Flow Task Tracker

Thanks for your interest in contributing! Flow is a personal project, but I welcome bug reports, feature suggestions, and code contributions.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- **Description** - What happened vs what you expected
- **Steps to reproduce** - How can I see the bug?
- **Environment** - Browser/OS version, desktop vs web app
- **Screenshots** - If applicable

### Suggesting Features

Feature requests are welcome! Please include:
- **Use case** - What problem does this solve?
- **Proposed solution** - How would it work?
- **Alternatives** - Other ways you considered

### Code Contributions

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add TypeScript types for all new code
   - Test your changes thoroughly

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add dark mode toggle"
   ```

5. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run TypeScript checks
npx tsc --noEmit

# Build for production
npm run build
```

## Code Style

- **TypeScript** - Use strict typing, avoid `any`
- **Components** - Functional components with hooks
- **Naming** - Use descriptive names (handleAddTask, not handler1)
- **Comments** - Explain "why", not "what"
- **File organization** - Follow existing folder structure

## Architecture

The project uses:
- **React Context** for global state ([AppContext.tsx](src/context/AppContext.tsx))
- **localStorage** for persistence ([storage.ts](src/utils/storage.ts))
- **Component organization** - See [src/components/](src/components/)

Key files:
- `App.tsx` - Main app and routing
- `AppContext.tsx` - Global state management
- `components/tasks/` - Task management UI
- `components/Goals/` - Goal planning features
- `utils/` - Helper functions and storage

## Testing

Currently, the project doesn't have automated tests (contributions welcome!). 

Manual testing checklist:
- [ ] Create, edit, delete tasks
- [ ] Start/stop day session
- [ ] Goal hierarchy creation
- [ ] Timeline view accuracy
- [ ] Data export/import
- [ ] Gist sync (if configured)

## Questions?

Feel free to open an issue for any questions about contributing!
