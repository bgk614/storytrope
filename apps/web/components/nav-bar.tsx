'use client';

import { logout as apiLogout } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Reenie_Beanie } from 'next/font/google';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const links = [
  { href: '/tropes', label: 'Tropes' },
  { href: '/books', label: 'Books' },
  { href: '/rankings', label: 'Rankings' },
];

const logoFont = Reenie_Beanie({ subsets: ['latin'], weight: '400' });

export function NavBar() {
  const { user, ready, setUser } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiLogout();
    } catch {
      // Cookie may already be gone; clear local state regardless.
    } finally {
      setUser(null);
      setLoggingOut(false);
      router.push('/');
      router.refresh();
    }
  }

  return (
    <header className='border-b border-black/10 dark:border-white/10'>
      <div className='mx-auto flex max-w-5xl items-center justify-between px-4 py-3'>
        <Link
          href='/'
          className={`${logoFont.className} text-lg font-semibold tracking-tight`}>
          STORY TROPE
        </Link>
        <nav className='flex items-center gap-5 text-sm'>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='hover:underline'>
              {link.label}
            </Link>
          ))}
          {ready && user ? (
            <span className='flex items-center gap-3'>
              <span className='text-black/60 dark:text-white/60'>
                {user.nickname}
              </span>
              <button
                type='button'
                onClick={handleLogout}
                disabled={loggingOut}
                className='rounded-md border border-black/10 px-3 py-1 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10'>
                Log out
              </button>
            </span>
          ) : (
            ready && (
              <span className='flex items-center gap-3'>
                <Link
                  href='/login'
                  className='hover:underline'>
                  Log in
                </Link>
                <Link
                  href='/signup'
                  className='rounded-md bg-foreground px-3 py-1 text-background hover:opacity-90'>
                  Sign up
                </Link>
              </span>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
