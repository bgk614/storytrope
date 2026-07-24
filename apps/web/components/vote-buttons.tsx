'use client';

import { useState } from 'react';
import { voteWorkTrope } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { VoteType } from '@/lib/types';

export function VoteButtons({ tropeId, bookId }: { tropeId: string; bookId: string }) {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState<VoteType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVote(voteType: VoteType) {
    if (!user) {
      setError('Log in to vote.');
      return;
    }
    setPending(voteType);
    setError(null);
    try {
      const result = await voteWorkTrope(tropeId, bookId, voteType);
      setScore(result.voteScore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className='flex items-center gap-2 text-sm'>
      <button
        type='button'
        onClick={() => handleVote('UP')}
        disabled={pending !== null}
        className='rounded-md border border-black/10 px-2 py-1 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10'
      >
        ▲
      </button>
      <span className='min-w-6 text-center text-black/60 dark:text-white/60'>{score ?? '–'}</span>
      <button
        type='button'
        onClick={() => handleVote('DOWN')}
        disabled={pending !== null}
        className='rounded-md border border-black/10 px-2 py-1 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10'
      >
        ▼
      </button>
      {error && <span className='text-xs text-red-600'>{error}</span>}
    </div>
  );
}
