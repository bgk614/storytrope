'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { addBookToTrope } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export function AddBookToTropeForm({ tropeId }: { tropeId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [workId, setWorkId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <p className='text-sm text-black/50 dark:text-white/50'>
        Log in to link a book to this trope.
      </p>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addBookToTrope(tropeId, workId.trim());
      setWorkId('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link the book.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2 sm:flex-row sm:items-start'>
      <div className='flex flex-1 flex-col gap-1'>
        <input
          value={workId}
          onChange={(e) => setWorkId(e.target.value)}
          required
          placeholder="Book ID (found in the book's page URL)"
          className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
        />
        {error && <p className='text-xs text-red-600'>{error}</p>}
      </div>
      <button
        type='submit'
        disabled={submitting}
        className='rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50'
      >
        {submitting ? 'Linking...' : 'Link Book'}
      </button>
    </form>
  );
}
