import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthField from '../app/components/Auth/components/AuthField/AuthField';

describe('AuthField', () => {
  const baseProps = {
    name: 'email',
    label: 'Email',
    placeholder: 'Your email',
    value: '',
    onChange: () => {},
  };

  test('renders label associated with input by htmlFor/id', () => {
    render(<AuthField {...baseProps} />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('name', 'email');
  });

  test('renders placeholder and default type="text"', () => {
    render(<AuthField {...baseProps} />);
    const input = screen.getByPlaceholderText('Your email');
    expect(input).toHaveAttribute('type', 'text');
  });

  test('respects explicit type prop (e.g. password)', () => {
    render(<AuthField {...baseProps} type="password" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'password');
  });

  test('shows error message and applies rose styling when error prop is set', () => {
    render(<AuthField {...baseProps} error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    const input = screen.getByLabelText('Email');
    expect(input.className).toMatch(/border-rose/);
  });

  test('does not render error paragraph when there is no error', () => {
    const { container } = render(<AuthField {...baseProps} />);
    expect(container.querySelector('p.text-rose-500')).toBeNull();
  });

  test('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<AuthField {...baseProps} onChange={handleChange} />);
    await user.type(screen.getByLabelText('Email'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });
});
