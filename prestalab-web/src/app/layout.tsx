import type { Metadata } from 'next';
import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'PrestaLab Web | Plataforma Administrativa',
  description: 'Sistema Integral de Gestión de Préstamos de Laboratorio, Inventario y Analítica BI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full bg-slate-50">
      <body className="h-full flex text-slate-800 antialiased font-sans">
        <RoleProvider>
          <AppShell>{children}</AppShell>
        </RoleProvider>
      </body>
    </html>
  );
}
