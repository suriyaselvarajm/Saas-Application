import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ADSettings from '../app/settings/ad/page';

// Mock DashboardLayout as it might contain complex logic/context
vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock global fetch
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ adSettings: [] }),
  }),
) as any;

describe('ADSettings Page', () => {
  it('renders the main heading', async () => {
    render(<ADSettings />);
    expect(await screen.findByText(/Active Directory Settings/i)).toBeDefined();
  });

  it('contains the Save Config button', async () => {
    render(<ADSettings />);
    expect(await screen.findByText(/Save Config/i)).toBeDefined();
  });
});
