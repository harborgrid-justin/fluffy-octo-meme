import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../src/components/Header';
import Navigation from '../../src/components/Navigation';
import Login from '../../src/pages/Login';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Header Component', () => {
    it('should have no accessibility violations', async () => {
      const mockUser = {
        username: 'testuser',
        department: 'Finance'
      };
      const mockLogout = vi.fn();

      const { container } = render(<Header user={mockUser} onLogout={mockLogout} />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });

  describe('Navigation Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      );
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });

  describe('Login Component', () => {
    it('should have no accessibility violations', async () => {
      const mockOnLogin = vi.fn();
      const { container } = render(<Login onLogin={mockOnLogin} />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });
});
