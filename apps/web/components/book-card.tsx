import Image from 'next/image';
import Link from 'next/link';
import type { Work } from '@/lib/types';

function extractPublishYear(firstPublishDate: string) {
  return firstPublishDate.match(/\d{4}/)?.[0] ?? null;
}

function topTropeOf(work: Work) {
  if (!work.tropes?.length) return undefined;
  return work.tropes.reduce((top, wt) => (wt.voteScore > top.voteScore ? wt : top));
}

export function BookCard({ work }: { work: Work }) {
  const authorNames = work.authors
    ?.map((wa) => wa.author?.name)
    .filter(Boolean)
    .join(', ');
  const publishYear = work.firstPublishDate && extractPublishYear(work.firstPublishDate);
  const topTrope = topTropeOf(work);

  return (
    <Link
      href={`/books/${work.id}`}
      className='flex gap-3 rounded-lg border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30'
    >
      <div className='h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-black/5 dark:bg-white/10'>
        {work.coverId && (
          <Image
            src={`https://covers.openlibrary.org/b/id/${work.coverId}-M.jpg`}
            alt=''
            width={64}
            height={96}
            className='h-full w-full object-cover'
          />
        )}
      </div>
      <div>
        <h3 className='font-medium'>{work.title}</h3>
        {authorNames && (
          <p className='mt-1 text-sm text-black/60 dark:text-white/60'>{authorNames}</p>
        )}
        {publishYear && (
          <p className='mt-1 text-xs text-black/40 dark:text-white/40'>{publishYear}</p>
        )}
        {topTrope?.trope && (
          <span className='mt-2 inline-block rounded-full border border-black/10 px-2 py-0.5 text-xs text-black/60 dark:border-white/10 dark:text-white/60'>
            {topTrope.trope.name}
          </span>
        )}
      </div>
    </Link>
  );
}
