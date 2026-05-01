// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; // ← importe o Providers

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gestão Financeira',
  description: 'Plataforma de gestão financeira para grupos',
  icons: { icon: 'logo.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} suppressHydrationWarning>
        <Providers> 
          {children}
        </Providers>
      </body>
    </html>
  );
}