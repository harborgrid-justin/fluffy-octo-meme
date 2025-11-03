# Testing Quick Reference Guide

## Test Commands

### Run All Tests
```bash
npm test                    # Run all tests (backend + frontend + e2e)
npm run test:all           # Alternative: run all tests
npm run test:ci            # CI mode with coverage
```

### Backend Tests
```bash
cd backend
npm test                   # All backend tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # With coverage report
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
```

### Frontend Tests
```bash
cd frontend
npm test                   # All frontend tests
npm run test:unit          # Unit tests only
npm run test:a11y          # Accessibility tests
npm run test:coverage      # With coverage report
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
```

### E2E Tests
```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Playwright UI
npm run test:e2e:headed    # With visible browser
npm run test:e2e:debug     # Debug mode
```

## Test Structure

```
/backend/tests/
├── unit/                  # Unit tests
│   └── auth.test.js      # 6 tests
├── integration/           # Integration tests
│   ├── auth.integration.test.js      # 8 tests
│   ├── budgets.integration.test.js   # 10 tests
│   ├── programs.integration.test.js  # 8 tests
│   └── dashboard.integration.test.js # 5 tests
├── fixtures/
│   └── testData.js       # Test data fixtures
├── performance/
│   └── load-test.js      # Performance testing
└── setup.js              # Test configuration

/frontend/tests/
├── unit/                 # Component tests
│   ├── Header.test.jsx   # 3 tests
│   ├── Login.test.jsx    # 6 tests
│   └── Navigation.test.jsx # 2 tests
├── accessibility/
│   └── a11y.test.jsx     # 3 tests
└── setup.js              # Test configuration

/e2e-tests/
├── auth.spec.js          # 4 tests
├── budget-workflow.spec.js # 3 tests
├── navigation.spec.js    # 2 tests
└── accessibility.spec.js # 3 tests
```

## Test Counts

| Category | Tests | Files |
|----------|-------|-------|
| Backend Unit | 6 | 1 |
| Backend Integration | 31 | 4 |
| Frontend Unit | 11 | 3 |
| Frontend Accessibility | 3 | 1 |
| E2E Tests | 12 | 4 |
| **TOTAL** | **63+** | **13** |

## Configuration Files

- `/backend/vitest.config.js` - Backend test config
- `/frontend/vitest.config.js` - Frontend test config
- `/playwright.config.js` - E2E test config
- `/.github/workflows/test.yml` - CI/CD pipeline

## Coverage Reports

### Generate Coverage
```bash
npm run test:coverage
```

### View Coverage Reports
```bash
# Backend
open backend/coverage/index.html

# Frontend
open frontend/coverage/index.html
```

### Coverage Thresholds
- Branches: 85%+
- Functions: 85%+
- Lines: 85%+
- Statements: 85%+

## Technologies

### Testing Frameworks
- **Vitest 4.x** - Unit & integration tests
- **Playwright** - E2E tests (Chromium, Firefox, WebKit, Mobile)
- **React Testing Library** - Component tests
- **Supertest** - API testing

### Accessibility
- **axe-core** - Automated accessibility testing
- **jest-axe** - Component-level a11y
- **@axe-core/playwright** - E2E accessibility
- **Standard**: WCAG 2.1 Level AA

### Coverage & CI/CD
- **@vitest/coverage-v8** - Code coverage
- **GitHub Actions** - Automated testing pipeline

## Common Tasks

### Add a New Test
1. Create test file in appropriate directory
2. Import necessary testing utilities
3. Write test cases
4. Run tests to verify

### Debug a Failing Test
```bash
# Backend
cd backend && npm run test:watch

# Frontend
cd frontend && npm run test:watch

# E2E
npm run test:e2e:debug
```

### Check Test Coverage
```bash
npm run test:coverage
```

### Run Tests Before Commit
```bash
npm run test:ci
```

## CI/CD Pipeline

### Workflow Location
`.github/workflows/test.yml`

### Pipeline Stages
1. Backend Tests + Coverage
2. Frontend Tests + Coverage
3. E2E Tests (multi-browser)
4. Coverage Aggregation

### Triggers
- Push to main/develop
- Pull requests
- Manual dispatch

### Artifacts
- Coverage reports (30 days)
- Test results
- Playwright reports
- Screenshots & videos

## Documentation

- **`TESTING.md`** - Comprehensive testing guide
- **`TEST_IMPLEMENTATION_SUMMARY.md`** - Implementation details
- **`TESTING_QUICK_REFERENCE.md`** - This file

## Support

### Common Issues

**Tests won't run**
```bash
npm run install:all
```

**E2E tests timeout**
- Check services are running
- Increase timeout in playwright.config.js

**Coverage threshold not met**
- Check coverage report
- Add tests for uncovered code

### Resources
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

---

**Status**: ✅ Production Ready  
**Last Updated**: November 3, 2025  
**Version**: 1.0.0
