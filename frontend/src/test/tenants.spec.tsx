import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TenantsPage from '../app/tenants/page';

vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

globalThis.alert = vi.fn();

const mockTenants = [
  { id: 't1', name: 'Acme Corp', tenantCode: 'ACME', companyName: 'Acme', domainName: 'acme.com', status: 'ACTIVE', subscriptionType: 'PREMIUM', users: [{ id: 'u1', systemRole: 'TENANT_ADMIN' }] },
  { id: 't2', name: 'Beta Ltd', tenantCode: 'BETA', companyName: 'Beta', domainName: 'beta.com', status: 'DISABLED', subscriptionType: 'BASIC', users: [] },
];

function mockFetch(data: object, ok = true) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok, json: () => Promise.resolve(data) } as Response)
  );
}

describe('TenantsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Tenant Management heading', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    expect(screen.getByText('Tenant Management')).toBeDefined();
  });

  it('shows Add Tenant button', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    expect(screen.getByRole('button', { name: /add tenant/i })).toBeDefined();
  });

  it('renders tenants in the table after loading', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeDefined());
    expect(screen.getByText('Beta Ltd')).toBeDefined();
  });

  it('shows tenant status badges', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    await waitFor(() => expect(screen.getByText('ACTIVE')).toBeDefined());
    expect(screen.getByText('DISABLED')).toBeDefined();
  });

  it('shows tenant codes', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    await waitFor(() => expect(screen.getByText('ACME')).toBeDefined());
    expect(screen.getByText('BETA')).toBeDefined();
  });

  it('shows empty state when no tenants', async () => {
    mockFetch([]);
    render(<TenantsPage />);
    await waitFor(() => expect(screen.getByText(/no tenants found/i)).toBeDefined());
  });

  it('opens Add Tenant modal on button click', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    await waitFor(() => screen.getByText('Acme Corp'));
    mockFetch(mockTenants);
    fireEvent.click(screen.getByRole('button', { name: /add tenant/i }));
    await waitFor(() => expect(screen.getByText('Add New Tenant')).toBeDefined());
  });

  it('shows required fields in Add Tenant modal', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    await waitFor(() => screen.getByText('Acme Corp'));
    fireEvent.click(screen.getByRole('button', { name: /add tenant/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('Tenant Name')).toBeDefined();
      expect(screen.getByLabelText('Tenant Code (Unique)')).toBeDefined();
      expect(screen.getByLabelText('Company Name')).toBeDefined();
      expect(screen.getByLabelText('Domain Name')).toBeDefined();
      expect(screen.getByLabelText('Admin Email')).toBeDefined();
      expect(screen.getByLabelText('Initial Password')).toBeDefined();
    });
  });

  it('submits new tenant and refreshes list', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTenants) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 't3' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTenants) });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TenantsPage />);
    await waitFor(() => screen.getByText('Acme Corp'));
    fireEvent.click(screen.getByRole('button', { name: /add tenant/i }));
    await waitFor(() => screen.getByLabelText('Tenant Name'));

    fireEvent.change(screen.getByLabelText('Tenant Name'), { target: { value: 'Gamma Inc' } });
    fireEvent.change(screen.getByLabelText('Tenant Code (Unique)'), { target: { value: 'GAMMA' } });
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Gamma' } });
    fireEvent.change(screen.getByLabelText('Domain Name'), { target: { value: 'gamma.com' } });
    fireEvent.change(screen.getByLabelText('Admin Email'), { target: { value: 'admin@gamma.com' } });
    fireEvent.change(screen.getByLabelText('Initial Password'), { target: { value: 'pass123' } });

    const form = screen.getByLabelText('Tenant Name').closest('form') as HTMLFormElement;
    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it('shows error when creating tenant fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTenants) })
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Tenant code already exists' }) });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TenantsPage />);
    await waitFor(() => screen.getByText('Acme Corp'));
    fireEvent.click(screen.getByRole('button', { name: /add tenant/i }));
    await waitFor(() => screen.getByLabelText('Tenant Name'));

    fireEvent.change(screen.getByLabelText('Tenant Name'), { target: { value: 'Dup' } });
    fireEvent.change(screen.getByLabelText('Tenant Code (Unique)'), { target: { value: 'ACME' } });
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Dup Corp' } });
    fireEvent.change(screen.getByLabelText('Domain Name'), { target: { value: 'dup.com' } });
    fireEvent.change(screen.getByLabelText('Admin Email'), { target: { value: 'admin@dup.com' } });
    fireEvent.change(screen.getByLabelText('Initial Password'), { target: { value: 'pass' } });

    const form = screen.getByLabelText('Tenant Name').closest('form') as HTMLFormElement;
    fireEvent.submit(form);
    // Error shown either in body text or via alert
    await waitFor(() => {
      const alerted = (globalThis.alert as ReturnType<typeof vi.fn>).mock.calls.length > 0;
      const bodyHasError = (document.body.textContent ?? '').includes('Tenant code already exists');
      expect(alerted || bodyHasError).toBe(true);
    });
  });

  it('opens Reset Password modal for tenant with admin user', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    await waitFor(() => screen.getByText('Acme Corp'));
    // Click reset key icon for first tenant (ACME has a TENANT_ADMIN user)
    const keyButtons = screen.getAllByTitle('Reset Admin Password');
    fireEvent.click(keyButtons[0]);
    await waitFor(() => expect(screen.getByText('Reset Admin Password')).toBeDefined());
  });

  it('closes modal on Cancel click', async () => {
    mockFetch(mockTenants);
    render(<TenantsPage />);
    await waitFor(() => screen.getByText('Acme Corp'));
    fireEvent.click(screen.getByRole('button', { name: /add tenant/i }));
    await waitFor(() => screen.getByText('Add New Tenant'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByText('Add New Tenant')).toBeNull());
  });
});
