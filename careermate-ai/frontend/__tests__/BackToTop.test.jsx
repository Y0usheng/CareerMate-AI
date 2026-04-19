import { act, fireEvent, render, screen } from '@testing-library/react';
import BackToTop from '../app/components/Landing/components/BackToTop/BackToTop';

describe('BackToTop', () => {
  beforeEach(() => {
    // Reset scroll position between tests
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
  });

  test('renders button with aria-label for accessibility', () => {
    render(<BackToTop />);
    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();
  });

  test('is hidden initially (opacity-0 class)', () => {
    render(<BackToTop />);
    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button.className).toMatch(/opacity-0/);
    expect(button.className).toMatch(/pointer-events-none/);
  });

  test('becomes visible when scrollY exceeds 300', () => {
    render(<BackToTop />);
    const button = screen.getByRole('button', { name: /back to top/i });

    act(() => {
      window.scrollY = 400;
      fireEvent.scroll(window);
    });

    expect(button.className).toMatch(/opacity-100/);
    expect(button.className).not.toMatch(/pointer-events-none/);
  });

  test('hides again when scrollY drops to 300 or below', () => {
    render(<BackToTop />);
    const button = screen.getByRole('button', { name: /back to top/i });

    // Scroll down
    act(() => {
      window.scrollY = 500;
      fireEvent.scroll(window);
    });
    expect(button.className).toMatch(/opacity-100/);

    // Scroll back up
    act(() => {
      window.scrollY = 100;
      fireEvent.scroll(window);
    });
    expect(button.className).toMatch(/opacity-0/);
  });

  test('clicking the button scrolls smoothly to top', () => {
    const scrollToSpy = jest.fn();
    window.scrollTo = scrollToSpy;

    render(<BackToTop />);
    fireEvent.click(screen.getByRole('button', { name: /back to top/i }));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  test('cleans up scroll listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<BackToTop />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    removeSpy.mockRestore();
  });
});
