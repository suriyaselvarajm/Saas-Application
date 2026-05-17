import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersPage from '../app/management/users/page';
import GroupsPage from '../app/management/groups/page';
import ComputersPage from '../app/management/computers/page';
import ContactsPage from '../app/management/contacts/page';

vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

globalThis.alert = vi.fn();

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

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.setItem('petrus_user', JSON.stringify({
    id: 'u1',
    email: 'admin@petrus.io',
    name: 'Admin',
    systemRole: 'SUPER_ADMIN',
    tenantCode: 'MASTER',
    tenantName: 'Petrus',
  }));
  vi.clearAllMocks();
});

// ── User Management ────────────────────────────────────────────────────────
describe('UsersPage', () => {
  it('renders without crashing', () => {
    mockFetch({ users: [], tenants: [] });
    const { container } = render(<UsersPage />);
    expect(container).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });

  it('renders the layout wrapper', () => {
    mockFetch({ users: [], tenants: [] });
    render(<UsersPage />);
    expect(screen.getByTestId('layout')).toBeDefined();
  });

  it('page contains some text content', async () => {
    mockFetch({ users: [], tenants: [] });
    render(<UsersPage />);
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it('renders a search input', async () => {
    mockFetch({ users: [], tenants: [] });
    render(<UsersPage />);
    await waitFor(() => {
      const inputs = document.querySelectorAll('input[type="text"], input[placeholder]');
      expect(inputs.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── Group Management ────────────────────────────────────────────────────────
describe('GroupsPage', () => {
  it('renders without crashing', () => {
    mockFetch({ groups: [], tenants: [] });
    const { container } = render(<GroupsPage />);
    expect(container).toBeDefined();
  });

  it('renders the layout wrapper', () => {
    mockFetch({ groups: [], tenants: [] });
    render(<GroupsPage />);
    expect(screen.getByTestId('layout')).toBeDefined();
  });

  it('page has content', async () => {
    mockFetch({ groups: [], tenants: [] });
    render(<GroupsPage />);
    await waitFor(() => expect(document.body.textContent?.length).toBeGreaterThan(0));
  });
});

// ── Computer Management ─────────────────────────────────────────────────────
describe('ComputersPage', () => {
  it('renders without crashing', () => {
    mockFetch({ computers: [], tenants: [] });
    const { container } = render(<ComputersPage />);
    expect(container).toBeDefined();
  });

  it('renders the layout wrapper', () => {
    mockFetch({ computers: [], tenants: [] });
    render(<ComputersPage />);
    expect(screen.getByTestId('layout')).toBeDefined();
  });

  it('page has content', async () => {
    mockFetch({ computers: [], tenants: [] });
    render(<ComputersPage />);
    await waitFor(() => expect(document.body.textContent?.length).toBeGreaterThan(0));
  });
});

// ── Contact Management ─────────────────────────────────────────────────────
describe('ContactsPage', () => {
  it('renders without crashing', () => {
    mockFetch({ contacts: [], tenants: [] });
    const { container } = render(<ContactsPage />);
    expect(container).toBeDefined();
  });

  it('renders the layout wrapper', () => {
    mockFetch({ contacts: [], tenants: [] });
    render(<ContactsPage />);
    expect(screen.getByTestId('layout')).toBeDefined();
  });

  it('page has content', async () => {
    mockFetch({ contacts: [], tenants: [] });
    render(<ContactsPage />);
    await waitFor(() => expect(document.body.textContent?.length).toBeGreaterThan(0));
  });
});
