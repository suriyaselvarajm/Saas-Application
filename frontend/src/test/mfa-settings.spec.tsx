import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MfaSettingsPage from '../app/settings/mfa/page';

vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

function mockFetch(data: object, ok = true) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok, json: () => Promise.resolve(data) } as Response)
  );
}

describe('MfaSettingsPage — MFA Disabled', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('petrus_user', JSON.stringify({ id: 'user-1', mfaEnabled: false }));
    localStorageMock.setItem('petrus_token', 'tok-123');
    vi.clearAllMocks();
  });

  it('renders the Two-Factor Authentication heading', () => {
    mockFetch({});
    render(<MfaSettingsPage />);
    expect(screen.getByText('Two-Factor Authentication')).toBeDefined();
  });

  it('shows MFA is Not Enabled status badge when MFA is off', () => {
    mockFetch({});
    render(<MfaSettingsPage />);
    expect(screen.getByText('MFA is Not Enabled')).toBeDefined();
  });

  it('shows the Start Setup button', () => {
    mockFetch({});
    render(<MfaSettingsPage />);
    expect(screen.getByRole('button', { name: /start setup/i })).toBeDefined();
  });

  it('shows QR code step after clicking Start Setup', async () => {
    mockFetch({ qrCodeDataUrl: 'data:image/png;base64,abc', secret: 'JBSWY3DPEHPK3PXP' });
    render(<MfaSettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
    await waitFor(() => expect(screen.getByText('Scan QR Code')).toBeDefined());
  });

  it('displays secret key after QR step loads', async () => {
    mockFetch({ qrCodeDataUrl: 'data:image/png;base64,abc', secret: 'JBSWY3DPEHPK3PXP' });
    render(<MfaSettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
    await waitFor(() => expect(screen.getByText('Or enter code manually')).toBeDefined());
  });

  it('shows verification code input after QR step loads', async () => {
    mockFetch({ qrCodeDataUrl: 'data:image/png;base64,abc', secret: 'JBSWY3DPEHPK3PXP' });
    render(<MfaSettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
    await waitFor(() => expect(screen.getByLabelText('Verification Code')).toBeDefined());
  });

  it('transitions to MFA active state when enable succeeds', async () => {
    mockFetch({ qrCodeDataUrl: 'data:image/png;base64,abc', secret: 'JBSWY3DPEHPK3PXP' });
    render(<MfaSettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
    await waitFor(() => expect(screen.getByLabelText('Verification Code')).toBeDefined());

    // Now mock enable endpoint
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as Response)
    );
    const otpInput = screen.getByLabelText('Verification Code') as HTMLInputElement;
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.submit(screen.getByRole('button', { name: /enable mfa/i }).closest('form')!);
    // After success: either 'MFA Enabled!' (done step) or 'MFA is Active' (mfaEnabled=true state)
    await waitFor(() => {
      const body = document.body.textContent ?? '';
      expect(body.includes('MFA Enabled!') || body.includes('MFA is Active')).toBe(true);
    });
  });

  it('shows error when OTP is wrong on enable', async () => {
    mockFetch({ qrCodeDataUrl: 'data:image/png;base64,abc', secret: 'JBSWY3DPEHPK3PXP' });
    render(<MfaSettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
    await waitFor(() => expect(screen.getByLabelText('Verification Code')).toBeDefined());

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Invalid verification code' }) } as Response)
    );
    const otpInput = screen.getByLabelText('Verification Code') as HTMLInputElement;
    fireEvent.change(otpInput, { target: { value: '000000' } });
    fireEvent.submit(screen.getByRole('button', { name: /enable mfa/i }).closest('form')!);
    await waitFor(() => expect(screen.getByText('Invalid verification code')).toBeDefined());
  });

  it('shows supported authenticator apps section', () => {
    mockFetch({});
    render(<MfaSettingsPage />);
    expect(screen.getByText('Google Authenticator')).toBeDefined();
    expect(screen.getByText('Authy')).toBeDefined();
    expect(screen.getByText('Microsoft Authenticator')).toBeDefined();
  });
});

describe('MfaSettingsPage — MFA Enabled', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('petrus_user', JSON.stringify({ id: 'user-1', mfaEnabled: true }));
    localStorageMock.setItem('petrus_token', 'tok-123');
    vi.clearAllMocks();
  });

  it('shows MFA is Active status badge when MFA is on', () => {
    mockFetch({});
    render(<MfaSettingsPage />);
    expect(screen.getByText('MFA is Active')).toBeDefined();
  });

  it('shows Disable MFA section', () => {
    mockFetch({});
    render(<MfaSettingsPage />);
    expect(screen.getByText('Disable Two-Factor Authentication')).toBeDefined();
  });

  it('shows disable OTP input', () => {
    mockFetch({});
    render(<MfaSettingsPage />);
    expect(screen.getByLabelText('Current Authenticator Code')).toBeDefined();
  });

  it('shows error when disable OTP is wrong', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Invalid verification code' }) } as Response)
    );
    render(<MfaSettingsPage />);
    const otpInput = screen.getByLabelText('Current Authenticator Code') as HTMLInputElement;
    fireEvent.change(otpInput, { target: { value: '000000' } });
    fireEvent.submit(screen.getByRole('button', { name: /disable mfa/i }).closest('form')!);
    await waitFor(() => expect(screen.getByText('Invalid verification code')).toBeDefined());
  });

  it('resets to idle state when MFA is disabled successfully', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as Response)
    );
    render(<MfaSettingsPage />);
    const otpInput = screen.getByLabelText('Current Authenticator Code') as HTMLInputElement;
    fireEvent.change(otpInput, { target: { value: '654321' } });
    fireEvent.submit(screen.getByRole('button', { name: /disable mfa/i }).closest('form')!);
    await waitFor(() => expect(screen.getByText('MFA is Not Enabled')).toBeDefined());
  });
});
