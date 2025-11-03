import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../../src/components/Header';

describe('Header Component', () => {
  const mockUser = {
    username: 'testuser',
    department: 'Finance'
  };

  it('should render header with user information', () => {
    const mockLogout = vi.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    expect(screen.getByText('Federal PPBE Management System')).toBeInTheDocument();
    expect(screen.getByText('Planning, Programming, Budgeting & Execution')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('should call onLogout when logout button is clicked', () => {
    const mockLogout = vi.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should render without user information', () => {
    const mockLogout = vi.fn();
    render(<Header user={null} onLogout={mockLogout} />);

    expect(screen.getByText('Federal PPBE Management System')).toBeInTheDocument();
  });
});
