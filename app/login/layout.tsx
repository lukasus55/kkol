import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logowanie - Karwińska Olimpiada',
  description: 'Zaloguj się do swojego konta w serwisie Karwińskiej Olimpiady.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
