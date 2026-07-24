import Link from 'next/link';
import type { Work } from '@/lib/types';

export function BookCard({ work }: { work: Work }) {
  const authorNames = work.authors
    ?.map((wa) => wa.author?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <Link
      href={`/books/${work.id}`}
      className='block rounded-lg border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30'
    >
      <h3 className='font-medium'>{work.title}</h3>
      {authorNames && (
        <p className='mt-1 text-sm text-black/60 dark:text-white/60'>{authorNames}</p>
      )}
      {work.firstPublishDate && (
        <p className='mt-1 text-xs text-black/40 dark:text-white/40'>{work.firstPublishDate}</p>
      )}
    </Link>
  );
}
