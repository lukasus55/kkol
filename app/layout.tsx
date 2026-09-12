import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import { ToastProvider } from '../components/ui/ToastProvider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Olimpiada Karwińska',
  description: 'Karwińska Olimpiada to coroczne wydarzenie podczas którego stała grupa uczestników rywalizuje w różnorodnych konkurencjach.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <head>
        <link rel="shortcut icon" href="/img/logos/icon.png" type="image/x-icon" />
      </head>
      <body>
        <Navbar />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
