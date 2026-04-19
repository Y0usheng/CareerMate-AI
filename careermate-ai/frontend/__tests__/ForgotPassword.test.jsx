import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../app/components/ForgotPassword/Page/Page';

// The page is self-contained (no useRouter), so no nav mocking needed

describe('ForgotPassword — step 0 (email)', () => {
  test('renders email step by default', () => {
    render(<ForgotPassword />);
    expect(screen.getByRole('heading', { name: /forgot your password\?/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^send$/i })).toBeInTheDocument();
  });

  test('shows error when email is empty', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);

    await user.click(screen.getByRole('button', { name: /^send$/i }));
    expect(await screen.findByText('Please enter your email.')).toBeInTheDocument();
  });

  test('rejects invalid email format', async () => {
    render(<ForgotPassword />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  });

  test('valid email advances to code step', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@test.com' } });
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(await screen.findByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify code/i })).toBeInTheDocument();
  });
});

describe('ForgotPassword — step 1 (verification code)', () => {
  // Helper: get past step 0
  const advanceToCodeStep = async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@test.com' } });
    await user.click(screen.getByRole('button', { name: /^send$/i }));
    return user;
  };

  test('shows error if code is incomplete', async () => {
    const user = await advanceToCodeStep();
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    expect(await screen.findByText(/4-digit verification code/i)).toBeInTheDocument();
  });

  test('rejects wrong code with hint about demo code', async () => {
    const user = await advanceToCodeStep();

    const inputs = document.querySelectorAll('input[class*="text-center"]');
    expect(inputs).toHaveLength(4);
    fireEvent.change(inputs[0], { target: { value: '9' } });
    fireEvent.change(inputs[1], { target: { value: '9' } });
    fireEvent.change(inputs[2], { target: { value: '9' } });
    fireEvent.change(inputs[3], { target: { value: '9' } });

    await user.click(screen.getByRole('button', { name: /verify code/i }));
    expect(await screen.findByText(/invalid verification code/i)).toBeInTheDocument();
  });

  test('non-numeric input is stripped', async () => {
    await advanceToCodeStep();

    const inputs = document.querySelectorAll('input[class*="text-center"]');
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(inputs[0].value).toBe('');
    fireEvent.change(inputs[0], { target: { value: '5' } });
    expect(inputs[0].value).toBe('5');
  });

  test('"1234" advances to password step', async () => {
    const user = await advanceToCodeStep();

    const inputs = document.querySelectorAll('input[class*="text-center"]');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[2], { target: { value: '3' } });
    fireEvent.change(inputs[3], { target: { value: '4' } });

    await user.click(screen.getByRole('button', { name: /verify code/i }));
    expect(await screen.findByRole('heading', { name: /set a new password/i })).toBeInTheDocument();
  });

  test('"Back to email step" returns to step 0', async () => {
    const user = await advanceToCodeStep();
    await user.click(screen.getByRole('button', { name: /back to email step/i }));
    expect(await screen.findByRole('heading', { name: /forgot your password\?/i })).toBeInTheDocument();
  });
});

describe('ForgotPassword — step 2 (new password)', () => {
  const advanceToPasswordStep = async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@test.com' } });
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    const inputs = document.querySelectorAll('input[class*="text-center"]');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[2], { target: { value: '3' } });
    fireEvent.change(inputs[3], { target: { value: '4' } });
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    return user;
  };

  test('rejects empty password', async () => {
    const user = await advanceToPasswordStep();
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText('Please enter a new password.')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your new password.')).toBeInTheDocument();
  });

  test('rejects password shorter than 8 characters', async () => {
    const user = await advanceToPasswordStep();

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'short' } });
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test('rejects mismatched passwords', async () => {
    const user = await advanceToPasswordStep();

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'longpassword' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'differentpwd' } });
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('matching valid passwords advance to success step', async () => {
    const user = await advanceToPasswordStep();

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'longpassword' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'longpassword' } });
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/reset successful/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login');
  });
});
