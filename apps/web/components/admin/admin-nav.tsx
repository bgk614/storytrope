import Link from 'next/link';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/tropes', label: 'Trope links' },
  { href: '/admin/works', label: 'Books' },
];

export function AdminNav() {
  return (
    <nav className='flex gap-4 border-b border-black/10 pb-3 text-sm dark:border-white/10'>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className='hover:underline'>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
