# Testing Documentation

## Overview

This document describes the comprehensive testing infrastructure for the Federal PPBE Management System. The system implements multiple layers of testing to ensure reliability, security, and accessibility.

## Testing Stack

### Unit & Integration Testing
- **Framework**: Vitest 4.x
- **Backend**: Supertest for API testing
- **Frontend**: React Testing Library + Jest DOM
- **Coverage**: Vitest Coverage (v8)

### End-to-End Testing
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5 emulation

### Accessibility Testing
- **Framework**: axe-core + jest-axe
- **Standards**: WCAG 2.1 Level AA
- **Integration**: Component tests & E2E tests

## Test Structure

```
/backend/tests/
  ├── unit/              # Unit tests for functions
  ├── integration/       # API integration tests
  ├── fixtures/          # Test data
  └── setup.js           # Test configuration

/frontend/tests/
  ├── unit/              # Component unit tests
  ├── integration/       # Integration tests
  ├── accessibility/     # Accessibility tests
  └── setup.js           # Test configuration

/e2e-tests/              # End-to-end tests
  ├── auth.spec.js
  ├── budget-workflow.spec.js
  ├── navigation.spec.js
  └── accessibility.spec.js
```

## Running Tests

### All Tests
```bash
npm test                    # Run all tests
npm run test:all           # Run backend, frontend, and E2E
npm run test:ci            # Run all tests with coverage (CI mode)
```

### Backend Tests
```bash
cd backend
npm test                   # Run all backend tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:coverage      # Run with coverage report
npm run test:watch         # Run in watch mode
npm run test:ui            # Run with Vitest UI
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run all frontend tests
npm run test:unit          # Run unit tests only
npm run test:a11y          # Run accessibility tests
npm run test:coverage      # Run with coverage report
npm run test:watch         # Run in watch mode
npm run test:ui            # Run with Vitest UI
```

### E2E Tests
```bash
npm run test:e2e           # Run E2E tests (headless)
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:headed    # Run with browser visible
npm run test:e2e:debug     # Run in debug mode
```

## Test Coverage

### Coverage Targets
- **Branches**: 85%+
- **Functions**: 85%+
- **Lines**: 85%+
- **Statements**: 85%+

### Viewing Coverage Reports

#### Backend Coverage
```bash
cd backend
npm run test:coverage
# Open: backend/coverage/index.html
```

#### Frontend Coverage
```bash
cd frontend
npm run test:coverage
# Open: frontend/coverage/index.html
```

## Test Types

### 1. Unit Tests
Test individual functions and components in isolation.

**Backend Example**: `/backend/tests/unit/auth.test.js`
- Password hashing
- JWT token generation/verification
- Input validation

**Frontend Example**: `/frontend/tests/unit/Header.test.jsx`
- Component rendering
- User interactions
- Props handling

### 2. Integration Tests
Test API endpoints and data flow.

**Example**: `/backend/tests/integration/budgets.integration.test.js`
- CRUD operations
- Authentication flow
- Filter functionality
- Error handling

### 3. E2E Tests
Test complete user workflows.

**Example**: `/e2e-tests/budget-workflow.spec.js`
- Login flow
- Navigation
- Budget creation
- Data persistence

### 4. Accessibility Tests
Ensure WCAG 2.1 Level AA compliance.

**Component Level**: `/frontend/tests/accessibility/a11y.test.jsx`
- Automated axe-core scans
- Keyboard navigation
- Screen reader compatibility

**E2E Level**: `/e2e-tests/accessibility.spec.js`
- Full page accessibility
- Dynamic content accessibility
- Form accessibility

## Writing Tests

### Backend Unit Test Example
```javascript
import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Password Hashing', () => {
  it('should hash passwords correctly', async () => {
    const password = 'testPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
  });
});
```

### Frontend Component Test Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../../src/components/Header';

describe('Header Component', () => {
  it('should call onLogout when logout button is clicked', () => {
    const mockLogout = vi.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example
```javascript
import { test, expect } from '@playwright/test';

test('should login with admin credentials', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /login/i }).click();

  await expect(page.getByText('Federal PPBE Management System')).toBeVisible();
});
```

## Continuous Integration

### GitHub Actions Workflow
Location: `.github/workflows/test.yml`

**Pipeline Stages**:
1. **Backend Tests**: Unit + Integration + Coverage
2. **Frontend Tests**: Unit + Accessibility + Coverage
3. **E2E Tests**: Full workflow testing
4. **Coverage Report**: Aggregate coverage data

**Triggers**:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

### CI Test Execution
```bash
# Run tests as they would run in CI
NODE_ENV=test npm run test:ci
```

## Performance Testing

### Load Testing (Manual)
Use tools like Apache Bench or k6 for load testing:

```bash
# Example: Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json \
   http://localhost:5000/api/auth/login
```

### Performance Benchmarks
- API response time: < 200ms (95th percentile)
- Page load time: < 3s
- Time to interactive: < 5s

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use beforeEach/afterEach for setup/cleanup
- Don't rely on test execution order

### 2. Naming Conventions
- Describe what the test does
- Use "should" statements
- Be specific and descriptive

### 3. Mocking
- Mock external dependencies
- Use fixtures for test data
- Keep mocks simple and maintainable

### 4. Assertions
- One logical assertion per test
- Use meaningful error messages
- Test both success and failure cases

### 5. Coverage
- Aim for 85%+ coverage
- Focus on critical paths
- Don't chase 100% coverage blindly

## Troubleshooting

### Tests Failing Locally
1. Clear node_modules and reinstall
2. Check Node version (v20+ required)
3. Ensure test environment variables are set

### E2E Tests Timing Out
1. Increase timeout in playwright.config.js
2. Check if services are running (backend + frontend)
3. Verify network connectivity

### Coverage Thresholds Not Met
1. Check uncovered lines in coverage report
2. Add tests for critical paths
3. Exclude non-critical files if needed

## Test Metrics (Current)

### Test Counts
- **Backend Unit Tests**: 3 suites, 9+ tests
- **Backend Integration Tests**: 4 suites, 25+ tests
- **Frontend Unit Tests**: 3 suites, 10+ tests
- **Frontend Accessibility Tests**: 3 suites, 3+ tests
- **E2E Tests**: 4 suites, 12+ tests

**Total**: ~60+ automated tests

### Coverage Status
- Backend: Target 85%+
- Frontend: Target 85%+
- Critical paths: 90%+ coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For testing questions or issues:
1. Check this documentation
2. Review test examples in the codebase
3. Consult framework documentation
4. Contact the development team
