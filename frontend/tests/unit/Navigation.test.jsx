import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../../src/components/Navigation';

describe('Navigation Component', () => {
  it('should render all navigation links', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Budget Management')).toBeInTheDocument();
    expect(screen.getByText('Program Planning')).toBeInTheDocument();
    expect(screen.getByText('Execution Tracking')).toBeInTheDocument();
  });

  it('should have correct link paths', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const budgetsLink = screen.getByText('Budget Management').closest('a');
    const programsLink = screen.getByText('Program Planning').closest('a');
    const executionLink = screen.getByText('Execution Tracking').closest('a');

    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(budgetsLink).toHaveAttribute('href', '/budgets');
    expect(programsLink).toHaveAttribute('href', '/programs');
    expect(executionLink).toHaveAttribute('href', '/execution');
  });
});
