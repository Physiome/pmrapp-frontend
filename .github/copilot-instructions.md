# Package Manager Constraints
- This project exclusively uses Bun (`bun`) as its package manager and runtime ecosystem.
- NEVER use `npm install`, `npm run`, `yarn`, or `pnpm`.
- When adding, updating, or removing dependencies, always use `bun add <package>` or `bun remove <package>`.
- When running scripts, always execute them via `bun run <script_name>`.

# Code Style Guidelines
- Follow the existing coding styles when making changes or adding new code.

# Naming Conventions
- Use camelCase for variable and function names.
- Use PascalCase for component names.
- Use snake_case for localStorage keys.
- Use CAPITAL_SNAKE_CASE for environment variable names.
- Use British English spelling in all code comments, documentation, variable names, and function names.
