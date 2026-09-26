import type { ReactNode } from 'react';
import { ShopProvider } from './_lib/shop';
import { ThemeProvider } from './_lib/theme';
import { AdminDataProvider } from './_lib/data';
import { AdminShell } from './_components/AdminShell';
import './_styles/tokens.css';

export const metadata = {
  title: 'Barber Admin · Portal do dono',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ShopProvider>
      <ThemeProvider>
        <AdminDataProvider>
          <AdminShell>{children}</AdminShell>
        </AdminDataProvider>
      </ThemeProvider>
    </ShopProvider>
  );
}
