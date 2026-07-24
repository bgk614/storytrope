'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { adminCreateWork, adminDeleteWork, adminUpdateWork } from '@/lib/api';
import type { Work } from '@/lib/types';

export function WorkForm({ work }: { work?: Work }) {
  const router = useRouter();
  const [title, setTitle] = useState(work?.title ?? '');
  const [description, setDescription] = useState(work?.description ?? '');
  const [firstPublishDate, setFirstPublishDate] = useState(work?.firstPublishDate ?? '');
  const [coverId, setCoverId] = useState(work?.coverId?.toString() ?? '');
  const [authorNames, setAuthorNames] = useState(
    work?.authors
      ?.map((wa) => wa.author?.name)
      .filter(Boolean)
      .join(', ') ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const dto = {
      title,
      description: description || undefined,
      firstPublishDate: firstPublishDate || undefined,
      coverId: coverId ? Number(coverId) : undefined,
      authorNames: authorNames
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    };
    try {
      if (work) {
        await adminUpdateWork(work.id, dto);
      } else {
        await adminCreateWork(dto);
      }
      router.push('/admin/works');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the book.');
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!work) return;
    if (!confirm('Delete this book? This cannot be undone.')) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminDeleteWork(work.id);
      router.push('/admin/works');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete the book.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex max-w-xl flex-col gap-4'>
      <div className='flex flex-col gap-1'>
        <label htmlFor='work-title' className='text-sm font-medium'>
          Title
        </label>
        <input
          id='work-title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label htmlFor='work-description' className='text-sm font-medium'>
          Description
        </label>
        <textarea
          id='work-description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label htmlFor='work-first-publish-date' className='text-sm font-medium'>
          First publish date
        </label>
        <input
          id='work-first-publish-date'
          value={firstPublishDate}
          onChange={(e) => setFirstPublishDate(e.target.value)}
          className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label htmlFor='work-cover-id' className='text-sm font-medium'>
          Cover ID
        </label>
        <input
          id='work-cover-id'
          type='number'
          value={coverId}
          onChange={(e) => setCoverId(e.target.value)}
          className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label htmlFor='work-authors' className='text-sm font-medium'>
          Authors (comma-separated)
        </label>
        <input
          id='work-authors'
          value={authorNames}
          onChange={(e) => setAuthorNames(e.target.value)}
          className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
        />
      </div>
      {error && <p className='text-sm text-red-600'>{error}</p>}
      <div className='flex gap-2'>
        <button
          type='submit'
          disabled={submitting}
          className='rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50'
        >
          {submitting ? 'Saving...' : work ? 'Save' : 'Create'}
        </button>
        {work && (
          <button
            type='button'
            onClick={handleDelete}
            disabled={submitting}
            className='rounded-md border border-red-600/40 px-4 py-2 text-sm text-red-600 hover:bg-red-600/10 disabled:opacity-50'
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
