import Link from 'next/link';
import type { Trope } from '@/lib/types';

export function TropeCard({ trope, score }: { trope: Trope; score?: number }) {
  return (
    <Link
      href={`/tropes/${trope.id}`}
      className='block rounded-lg border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30'
    >
      <div className='flex items-start justify-between gap-3'>
        <h3 className='font-medium'>{trope.name}</h3>
        <span className='shrink-0 text-sm text-black/50 dark:text-white/50'>
          ♥ {score ?? trope.likeScore}
        </span>
      </div>
      {trope.description && (
        <p className='mt-1 line-clamp-2 text-sm text-black/60 dark:text-white/60'>
          {trope.description}
        </p>
      )}
    </Link>
  );
}
