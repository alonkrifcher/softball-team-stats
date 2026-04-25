import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPlayer, getAdmin } from '@/lib/auth/guards';

export const metadata: Metadata = {
  title: 'Underhand Jobs',
  description: 'UHJ coed softball — schedule, stats, RSVPs.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [player, admin] = await Promise.all([getPlayer(), getAdmin()]);
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="font-bold text-team text-lg">
              UHJ
            </Link>
            <Link href="/schedule" className="hover:text-team">
              Schedule
            </Link>
            <Link href="/stats" className="hover:text-team">
              Stats
            </Link>
            <Link href="/roster" className="hover:text-team">
              Roster
            </Link>
            <Link href="/history" className="hover:text-team">
              History
            </Link>
            <div className="ml-auto flex items-center gap-3">
              {admin ? (
                <Link href="/admin" className="text-team font-medium">
                  Admin
                </Link>
              ) : null}
              {player ? (
                <span className="text-slate-600">
                  {player.displayName} · <Link href="/logout" className="underline">logout</Link>
                </span>
              ) : (
                <Link href="/login" className="hover:text-team">
                  Login
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-400">
          UHJ • coed softball • since 2018
        </footer>
      </body>
    </html>
  );
}
