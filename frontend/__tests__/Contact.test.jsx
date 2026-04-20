import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Contact from '../app/components/Landing/components/Contact/Contact';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

const setupUser = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

describe('Contact form', () => {
  test('renders all form fields', () => {
    render(<Contact />);
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Field')).toBeInTheDocument();
    expect(screen.getByLabelText('How can we help you?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  test('shows required errors when submitting empty form', async () => {
    const user = setupUser();
    render(<Contact />);

    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Message is required.')).toBeInTheDocument();
    expect(screen.getByText(/fix the highlighted fields/i)).toBeInTheDocument();
  });

  test('rejects invalid email format', async () => {
    render(<Contact />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'notanemail' } });
    fireEvent.change(screen.getByLabelText('How can we help you?'), {
      target: { value: 'This is a sufficiently long message for the form.' },
    });
    fireEvent.submit(screen.getByLabelText('Email').closest('form'));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  test('rejects message shorter than 20 characters', async () => {
    render(<Contact />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@test.com' } });
    fireEvent.change(screen.getByLabelText('How can we help you?'), {
      target: { value: 'too short' },
    });
    fireEvent.submit(screen.getByLabelText('Email').closest('form'));

    expect(await screen.findByText(/at least 20 characters/i)).toBeInTheDocument();
  });

  test('valid submit shows success message and clears form', async () => {
    const user = setupUser();
    render(<Contact />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@test.com' } });
    fireEvent.change(screen.getByLabelText('How can we help you?'), {
      target: { value: 'I would like to know more about your AI platform, please!' },
    });

    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Loading state
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();

    // Fast-forward past the internal 900ms delay
    await act(async () => {
      jest.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    });

    // Form should be reset
    expect(screen.getByLabelText('Full Name')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('How can we help you?')).toHaveValue('');
  });

  test('clears individual field error as user edits that field', async () => {
    const user = setupUser();
    render(<Contact />);

    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'J' } });
    expect(screen.queryByText('Full name is required.')).not.toBeInTheDocument();
    // Other errors remain
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
  });

  test('renders role and field select options', () => {
    render(<Contact />);
    const roleSelect = screen.getByLabelText('Your Role');
    expect(roleSelect).toHaveDisplayValue('Select');

    const options = Array.from(roleSelect.querySelectorAll('option')).map((o) => o.value);
    expect(options).toEqual(['', 'student', 'graduate', 'professional']);
  });
});
