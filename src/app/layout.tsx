import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPlayer, getAdmin } from '@/lib/auth/guards';

export const metadata: Metadata = {
  title: 'Underhand Jobs',
  description: 'UHJ coed softball — schedule, stats, RSVPs.',
};

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/stats', label: 'Stats' },
  { href: '/roster', label: 'Roster' },
  { href: '/history', label: 'History' },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [player, admin] = await Promise.all([getPlayer(), getAdmin()]);
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
          <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm">
            <Link href="/" className="mr-2 flex items-center gap-2">
              <span className="rounded bg-team px-2 py-1 text-base font-black tracking-tight text-white">UHJ</span>
            </Link>
            <div className="hidden gap-1 md:flex">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-team"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {admin ? (
                <Link
                  href="/admin"
                  className="rounded bg-team-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-team-deep hover:brightness-110"
                >
                  Admin
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-team hover:text-team"
                  title="Admin login"
                >
                  Admin
                </Link>
              )}
              {player ? (
                <span className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{player.displayName}</span>
                  {' · '}
                  <a href="/logout" className="hover:text-team hover:underline">
                    logout
                  </a>
                </span>
              ) : (
                <Link href="/login" className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:border-team hover:text-team">
                  Login
                </Link>
              )}
            </div>
          </nav>
          {/* Mobile nav */}
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 text-sm md:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap rounded px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-team"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-400">
          UHJ · coed softball · since 2018
        </footer>
      </body>
    </html>
  );
}
