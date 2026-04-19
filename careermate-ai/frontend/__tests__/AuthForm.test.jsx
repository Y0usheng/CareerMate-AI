import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '../app/components/Auth/components/AuthForm/AuthForm';

// Mock Next.js router — AuthForm reads useRouter for post-submit redirects
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockClear();
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

// userEvent v14 needs an explicit advanceTimers hook when fake timers are in use
const setupUser = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

describe('AuthForm — login mode', () => {
  test('renders login title and email/password fields', () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty fields', async () => {
    const user = setupUser();
    render(<AuthForm mode="login" />);

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Please enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Please enter your password.')).toBeInTheDocument();
    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });

  test('rejects malformed email', async () => {
    render(<AuthForm mode="login" />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'notanemail' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'whatever' } });
    fireEvent.submit(screen.getByLabelText('Email').closest('form'));

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  });

  test('surfaces simulated network error when email contains "network"', async () => {
    const user = setupUser();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText('Email'), 'network@test.com');
    await user.type(screen.getByLabelText('Password'), 'whatever');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  test('successful submit shows success toast and routes home', async () => {
    const user = setupUser();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText('Email'), 'ok@test.com');
    await user.type(screen.getByLabelText('Password'), 'whatever');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    // Button enters loading state
    expect(screen.getByRole('button', { name: /please wait/i })).toBeDisabled();

    // Fast-forward: 1000ms internal delay, then 1200ms to router.push
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(await screen.findByText(/logged in successfully/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
  });

  test('typing into a field clears its existing error', async () => {
    const user = setupUser();
    render(<AuthForm mode="login" />);

    // Trigger errors
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Please enter your email.')).toBeInTheDocument();

    // Start typing — error should disappear
    await user.type(screen.getByLabelText('Email'), 'a');
    expect(screen.queryByText('Please enter your email.')).not.toBeInTheDocument();
  });

  test('"Remember Me" checkbox is checked by default', () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeChecked();
  });

  test('renders "Forgot Password?" link pointing to /forgot-password', () => {
    render(<AuthForm mode="login" />);
    const link = screen.getByRole('link', { name: /forgot password\?/i });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });
});

describe('AuthForm — register mode', () => {
  test('renders Full Name, Email, Password fields', () => {
    render(<AuthForm mode="register" />);
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('requires Full Name', async () => {
    const user = setupUser();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText('Email'), 'ok@test.com');
    await user.type(screen.getByLabelText('Password'), 'longpassword');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Please enter your full name.')).toBeInTheDocument();
  });

  test('rejects password shorter than 8 characters', async () => {
    const user = setupUser();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@test.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test('shows modal when email contains "exists"', async () => {
    const user = setupUser();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText('Full Name'), 'Jane');
    await user.type(screen.getByLabelText('Email'), 'exists@test.com');
    await user.type(screen.getByLabelText('Password'), 'longpassword');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/login');
  });

  test('successful register shows checkmark view and redirects to /onboarding', async () => {
    const user = setupUser();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText('Full Name'), 'Jane');
    await user.type(screen.getByLabelText('Email'), 'jane@test.com');
    await user.type(screen.getByLabelText('Password'), 'longpassword');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/onboarding'));
  });
});
