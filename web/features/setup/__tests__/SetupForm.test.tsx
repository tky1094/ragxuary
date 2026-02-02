import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SetupForm } from '@/features/setup/components/SetupForm';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      setup: {
        welcomeTitle: 'Welcome to ragxuary',
        welcomeDescription: 'Create an administrator account to get started',
        createAdmin: 'Create Administrator',
        creating: 'Creating...',
        setupFailed: 'Setup failed. Please try again',
      },
      auth: {
        email: 'Email',
        name: 'Name',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address',
        nameRequired: 'Name is required',
        nameTooLong: 'Name must be 100 characters or less',
        passwordMinLength: 'Password must be at least 8 characters',
        passwordNeedsLetter: 'Password must contain at least one letter',
        passwordNeedsNumber: 'Password must contain at least one number',
        confirmPasswordRequired: 'Please confirm your password',
        passwordsMustMatch: 'Passwords do not match',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
}));

// Mock hey-api client
vi.mock('@/client', () => ({
  Setup: {
    createAdmin: vi.fn(),
  },
}));

import { Setup } from '@/client';

const mockCreateAdmin = Setup.createAdmin as ReturnType<typeof vi.fn>;

// Mock window.location.href
const mockLocationHref = vi.fn();

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    value: {
      href: '',
    },
    writable: true,
  });
  Object.defineProperty(window.location, 'href', {
    set: mockLocationHref,
    get: () => '',
  });
});

function getEmailInput() {
  return screen.getByLabelText('Email');
}

function getNameInput() {
  return screen.getByLabelText('Name');
}

describe('SetupForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the setup form', () => {
    render(<SetupForm />);

    expect(screen.getByText('Welcome to ragxuary')).toBeInTheDocument();
    expect(
      screen.getByText('Create an administrator account to get started')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create administrator/i })
    ).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<SetupForm />);

    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText('Please confirm your password')
      ).toBeInTheDocument();
    });
  });

  it('should show error when name is too long', async () => {
    const user = userEvent.setup();
    render(<SetupForm />);

    const nameInput = getNameInput();
    const longName = 'a'.repeat(101);
    await user.type(nameInput, longName);

    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Name must be 100 characters or less')
      ).toBeInTheDocument();
    });
  });

  it('should show error when password is too short', async () => {
    const user = userEvent.setup();
    render(<SetupForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    await user.type(passwordInput, 'short1');

    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });
  });

  it('should show error when password has no letters', async () => {
    const user = userEvent.setup();
    render(<SetupForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    await user.type(passwordInput, '12345678');

    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one letter')
      ).toBeInTheDocument();
    });
  });

  it('should show error when password has no numbers', async () => {
    const user = userEvent.setup();
    render(<SetupForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    await user.type(passwordInput, 'abcdefgh');

    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one number')
      ).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SetupForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');

    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<SetupForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const toggleButtons = screen.getAllByRole('button', {
      name: /show password/i,
    });
    const passwordToggle = toggleButtons[0];

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should toggle confirm password visibility', async () => {
    const user = userEvent.setup();
    render(<SetupForm />);

    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const toggleButtons = screen.getAllByRole('button', {
      name: /show password/i,
    });
    const confirmPasswordToggle = toggleButtons[1];

    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');

    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should call setup API with correct data on submit', async () => {
    mockCreateAdmin.mockResolvedValue({
      data: {
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
      },
      error: null,
    });

    const user = userEvent.setup();
    render(<SetupForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });

    await user.type(emailInput, 'admin@example.com');
    await user.type(nameInput, 'Admin User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateAdmin).toHaveBeenCalledWith({
        body: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'password123',
        },
      });
    });
  });

  it('should redirect to login page on successful admin creation', async () => {
    mockCreateAdmin.mockResolvedValue({
      data: {
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
      },
      error: null,
    });

    const user = userEvent.setup();
    render(<SetupForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });

    await user.type(emailInput, 'admin@example.com');
    await user.type(nameInput, 'Admin User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLocationHref).toHaveBeenCalledWith('/login');
    });
  });

  it('should show error message when setup fails', async () => {
    mockCreateAdmin.mockResolvedValue({
      data: null,
      error: { message: 'Setup failed' },
    });

    const user = userEvent.setup();
    render(<SetupForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });

    await user.type(emailInput, 'admin@example.com');
    await user.type(nameInput, 'Admin User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Setup failed. Please try again')
      ).toBeInTheDocument();
    });
  });

  it('should show error message on network error', async () => {
    mockCreateAdmin.mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();
    render(<SetupForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });

    await user.type(emailInput, 'admin@example.com');
    await user.type(nameInput, 'Admin User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Setup failed. Please try again')
      ).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    mockCreateAdmin.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  access_token: 'token',
                  refresh_token: 'refresh',
                  token_type: 'bearer',
                },
                error: null,
              }),
            100
          )
        )
    );

    const user = userEvent.setup();
    render(<SetupForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });

    await user.type(emailInput, 'admin@example.com');
    await user.type(nameInput, 'Admin User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
    });
  });

  it('should disable inputs while loading', async () => {
    mockCreateAdmin.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  access_token: 'token',
                  refresh_token: 'refresh',
                  token_type: 'bearer',
                },
                error: null,
              }),
            100
          )
        )
    );

    const user = userEvent.setup();
    render(<SetupForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /create administrator/i,
    });

    await user.type(emailInput, 'admin@example.com');
    await user.type(nameInput, 'Admin User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(nameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
    });
  });

  it('should have email input with type email for browser validation', () => {
    render(<SetupForm />);

    const emailInput = getEmailInput();
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});
