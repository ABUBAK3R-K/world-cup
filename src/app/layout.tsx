import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { GameStateProvider } from '@/hooks/useGameState';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'World Cup XI',
  description: 'Draft legendary players and simulate your custom World Cup tournament.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <GameStateProvider>
          {children}
        </GameStateProvider>
      </body>
    </html>
  );
}
