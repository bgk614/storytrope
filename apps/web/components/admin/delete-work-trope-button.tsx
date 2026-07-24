'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminDeleteWorkTropeLink } from '@/lib/api';

export function DeleteWorkTropeButton({ workId, tropeId }: { workId: string; tropeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm('Remove this trope link? This cannot be undone.')) return;
    setPending(true);
    setError(null);
    try {
      await adminDeleteWorkTropeLink(workId, tropeId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove the trope link.');
      setPending(false);
    }
  }

  return (
    <div className='flex flex-col items-end gap-1'>
      <button
        type='button'
        onClick={handleDelete}
        disabled={pending}
        className='rounded-md border border-red-600/40 px-3 py-1 text-sm text-red-600 hover:bg-red-600/10 disabled:opacity-50'
      >
        {pending ? 'Removing...' : 'Remove'}
      </button>
      {error && <p className='text-xs text-red-600'>{error}</p>}
    </div>
  );
}
