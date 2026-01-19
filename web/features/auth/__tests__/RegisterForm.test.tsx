import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { RegisterForm } from '@/features/auth/components/RegisterForm';

const mockPush = vi.fn();
const mockSignIn = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      auth: {
        signUpTitle: 'Sign Up',
        signUpDescription: 'Create your account',
        email: 'Email',
        name: 'Name',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        register: 'Sign up',
        login: 'Log in',
        hasAccount: 'Already have an account?',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address',
        nameRequired: 'Name is required',
        nameTooLong: 'Name must be 100 characters or less',
        passwordMinLength: 'Password must be at least 8 characters',
        passwordNeedsLetter: 'Password must contain at least one letter',
        passwordNeedsNumber: 'Password must contain at least one number',
        confirmPasswordRequired: 'Please confirm your password',
        passwordsMustMatch: 'Passwords do not match',
        emailAlreadyRegistered: 'This email is already registered',
        registrationFailed: 'Registration failed. Please try again',
      },
      common: {
        loading: 'Loading...',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
}));

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({
    push: mockPush,
  }),
}));

function getEmailInput() {
  return screen.getByLabelText('Email');
}

function getNameInput() {
  return screen.getByLabelText('Name');
}

describe('RegisterForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render the register form', () => {
    render(<RegisterForm />);

    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });

  it('should have a link to login page', () => {
    render(<RegisterForm />);

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
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
    render(<RegisterForm />);

    const nameInput = getNameInput();
    const longName = 'a'.repeat(101);
    await user.type(nameInput, longName);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Name must be 100 characters or less')
      ).toBeInTheDocument();
    });
  });

  it('should show error when password is too short', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    await user.type(passwordInput, 'short1');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });
  });

  it('should show error when password has no letters', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    await user.type(passwordInput, '12345678');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one letter')
      ).toBeInTheDocument();
    });
  });

  it('should show error when password has no numbers', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    await user.type(passwordInput, 'abcdefgh');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one number')
      ).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

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
    render(<RegisterForm />);

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

  it('should call register API with correct data on submit', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
      }),
    });
    mockSignIn.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      });
    });
  });

  it('should redirect to home on successful registration and login', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
      }),
    });
    mockSignIn.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should redirect to login page when auto-login fails after registration', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
      }),
    });
    mockSignIn.mockResolvedValue({ error: 'LoginFailed' });

    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should show error message when email is already registered', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'emailAlreadyRegistered' }),
    });

    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'existing@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('This email is already registered')
      ).toBeInTheDocument();
    });
  });

  it('should show generic error message when registration fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'registrationFailed' }),
    });

    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Registration failed. Please try again')
      ).toBeInTheDocument();
    });
  });

  it('should show error message on network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Registration failed. Please try again')
      ).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  access_token: 'token',
                  refresh_token: 'refresh',
                  token_type: 'bearer',
                }),
              }),
            100
          )
        )
    );
    mockSignIn.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should disable inputs while loading', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  access_token: 'token',
                  refresh_token: 'refresh',
                  token_type: 'bearer',
                }),
              }),
            100
          )
        )
    );
    mockSignIn.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    const nameInput = getNameInput();
    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
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
    render(<RegisterForm />);

    const emailInput = getEmailInput();
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});
