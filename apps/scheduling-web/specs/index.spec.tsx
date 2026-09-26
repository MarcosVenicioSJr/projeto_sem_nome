import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import Page from '../src/app/page';

const replace = vi.fn();
let status: 'loading' | 'anonymous' | 'authenticated' = 'loading';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../src/app/_lib/session', () => ({ useSession: () => ({ status }) }));

describe('Page (root)', () => {
  beforeEach(() => replace.mockClear());

  it('waits while the session loads', () => {
    status = 'loading';
    render(<Page />);
    expect(replace).not.toHaveBeenCalled();
  });

  it('sends an anonymous visitor to the login', () => {
    status = 'anonymous';
    render(<Page />);
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('sends a signed-in user to the dashboard', () => {
    status = 'authenticated';
    render(<Page />);
    expect(replace).toHaveBeenCalledWith('/admin/dashboard');
  });
});
