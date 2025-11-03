import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../src/pages/Login';
import * as api from '../../src/services/api';

// Mock the API module
vi.mock('../../src/services/api', () => ({
  login: vi.fn()
}));

describe('Login Component', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(<Login onLogin={mockOnLogin} />);

    expect(screen.getByText('PPBE Management System')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should display default credentials', () => {
    render(<Login onLogin={mockOnLogin} />);

    expect(screen.getByText('Default credentials:')).toBeInTheDocument();
    expect(screen.getByText(/admin/)).toBeInTheDocument();
    expect(screen.getByText(/admin123/)).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { username: 'admin', role: 'admin' }
      }
    };
    api.login.mockResolvedValue(mockResponse);

    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('admin', 'admin123');
      expect(mockOnLogin).toHaveBeenCalledWith('test-token', mockResponse.data.user);
    });
  });

  it('should display error message on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    api.login.mockRejectedValue({
      response: { data: { error: errorMessage } }
    });

    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(usernameInput, 'wronguser');
    await user.type(passwordInput, 'wrongpass');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should disable form during login', async () => {
    api.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin123');
    await user.click(loginButton);

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
    });
  });

  it('should require username and password', () => {
    render(<Login onLogin={mockOnLogin} />);

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');

    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});
