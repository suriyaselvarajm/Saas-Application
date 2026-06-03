import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../app/login/page';

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
globalThis.alert = vi.fn(); // Suppress jsdom alert not implemented warning

// ── Helpers ────────────────────────────────────────────────────────────────
function mockFetch(data: object, ok = true) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok, json: () => Promise.resolve(data) } as Response)
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders the PETRUS heading and login form', () => {
    mockFetch({});
    render(<LoginPage />);
    expect(screen.getByText('PETRUS')).toBeDefined();
    // 'Sign In' appears as h2 and button — use getAllByText
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Work Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
  });

  it('disables Sign In button when email is empty', () => {
    mockFetch({});
    render(<LoginPage />);
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('enables Sign In button after typing email', async () => {
    mockFetch({});
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'admin@petrus.io' } });
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn.hasAttribute('disabled')).toBe(false);
  });

  it('navigates to dashboard on successful login without MFA', async () => {
    mockFetch({ accessToken: 'tok123', user: { id: '1', email: 'admin@petrus.io', name: 'Admin', systemRole: 'SUPER_ADMIN', mustChangePassword: false } });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'admin@petrus.io' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows error on failed login', async () => {
    mockFetch({ message: 'Invalid password.' }, false);
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByText('Invalid password.')).toBeDefined());
  });

  it('shows MFA step when server returns mfaRequired', async () => {
    mockFetch({ mfaRequired: true, userId: 'user-123' });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'user@corp.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByText('Two-Factor Verification')).toBeDefined());
  });

  it('shows OTP input on MFA step', async () => {
    mockFetch({ mfaRequired: true, userId: 'user-123' });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'user@corp.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByLabelText('One-Time Passcode')).toBeDefined());
  });

  it('only accepts numeric input in OTP field', async () => {
    mockFetch({ mfaRequired: true, userId: 'user-123' });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'user@corp.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByLabelText('One-Time Passcode')).toBeDefined());
    const otpInput = screen.getByLabelText('One-Time Passcode') as HTMLInputElement;
    fireEvent.change(otpInput, { target: { value: 'abc123' } });
    expect(otpInput.value).toBe('123');
  });

  it('goes back to credentials when "Back to login" is clicked on MFA step', async () => {
    mockFetch({ mfaRequired: true, userId: 'user-123' });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'user@corp.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByText('← Back to login')).toBeDefined());
    fireEvent.click(screen.getByText('← Back to login'));
    // Both h2 heading and button contain 'Sign In' — getAllByText is safe here
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
  });

  it('shows password reset form when mustChangePassword is true', async () => {
    mockFetch({ accessToken: 'tok', user: { id: '1', email: 'u@t.com', name: 'U', systemRole: 'EMPLOYEE', mustChangePassword: true } });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'u@t.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'old' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByText('Set New Password')).toBeDefined());
  });

  it('shows error when passwords do not match on reset', async () => {
    mockFetch({ accessToken: 'tok', user: { id: '1', email: 'u@t.com', name: 'U', systemRole: 'EMPLOYEE', mustChangePassword: true } });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'u@t.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'old' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByLabelText('New Password')).toBeDefined());
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    fireEvent.submit(screen.getByRole('button', { name: /update password/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeDefined());
  });

  it('stores token in localStorage on successful login', async () => {
    mockFetch({ accessToken: 'tok-abc', user: { id: '1', email: 'admin@petrus.io', name: 'Admin', systemRole: 'SUPER_ADMIN', mustChangePassword: false } });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), { target: { value: 'admin@petrus.io' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(localStorage.getItem('petrus_token')).toBe('tok-abc'));
  });
});
