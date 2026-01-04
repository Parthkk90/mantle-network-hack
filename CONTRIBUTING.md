# Contributing to CRESCA

Thank you for your interest in contributing to CRESCA! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards others

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Use the bug report template
3. Include:
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, app version, etc.)

### Suggesting Features

1. Check if the feature has been suggested
2. Use the feature request template
3. Explain:
   - The problem you're trying to solve
   - Your proposed solution
   - Why this would benefit users

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Ensure all tests pass
6. Update documentation
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Development Guidelines

### Smart Contracts

- Follow Solidity style guide
- Use OpenZeppelin contracts when possible
- Write comprehensive tests (>95% coverage)
- Add natspec comments
- Optimize for gas efficiency
- Security is paramount

### Backend

- Use TypeScript
- Follow ESLint rules
- Write unit and integration tests
- Document API endpoints
- Handle errors gracefully

### Mobile App

- Follow React Native best practices
- Use TypeScript
- Write component tests
- Optimize performance
- Support both iOS and Android

## Testing

### Smart Contracts
```bash
cd contracts
npm test
npm run coverage
```

### Backend
```bash
cd backend
npm test
npm run test:integration
```

### Mobile
```bash
cd frontend
npm test
npm run test:e2e
```

## Commit Messages

Format: `type(scope): subject`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Examples:
- `feat(bundle): add rebalance automation`
- `fix(swap): handle slippage correctly`
- `docs(readme): update installation steps`

## Review Process

1. Code review by maintainers
2. Automated tests must pass
3. Documentation updated
4. At least one approval required
5. Merge to main branch

## Questions?

Feel free to ask questions in:
- GitHub Discussions
- Discord community
- Email: dev@cresca.app

Thank you for contributing! 🚀
