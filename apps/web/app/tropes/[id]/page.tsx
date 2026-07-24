import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddBookToTropeForm } from '@/components/add-book-to-trope-form';
import { BookCard } from '@/components/book-card';
import { LikeButton } from '@/components/like-button';
import { TropeCard } from '@/components/trope-card';
import { ApiError, getTrope, getTropeBooks, getTropeChildren } from '@/lib/api';

const PAGE_SIZE = 20;

export default async function TropeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ childrenSkip?: string; booksSkip?: string }>;
}) {
  const { id } = await params;
  const { childrenSkip: childrenSkipParam, booksSkip: booksSkipParam } = await searchParams;
  const childrenSkip = Number(childrenSkipParam ?? 0) || 0;
  const booksSkip = Number(booksSkipParam ?? 0) || 0;

  let trope;
  try {
    trope = await getTrope(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const [children, books] = await Promise.all([
    getTropeChildren(id, { skip: childrenSkip, take: PAGE_SIZE }),
    getTropeBooks(id, { skip: booksSkip, take: PAGE_SIZE }),
  ]);

  const childrenPrevSkip = Math.max(childrenSkip - PAGE_SIZE, 0);
  const childrenNextSkip = childrenSkip + PAGE_SIZE;
  const childrenHasPrev = childrenSkip > 0;
  const childrenHasNext = children.length === PAGE_SIZE;

  const booksPrevSkip = Math.max(booksSkip - PAGE_SIZE, 0);
  const booksNextSkip = booksSkip + PAGE_SIZE;
  const booksHasPrev = booksSkip > 0;
  const booksHasNext = books.length === PAGE_SIZE;

  return (
    <div className='flex flex-col gap-10'>
      <section className='flex flex-col gap-3'>
        {trope.parentId && (
          <Link
            href={`/tropes/${trope.parentId}`}
            className='w-fit text-sm text-black/50 hover:underline dark:text-white/50'
          >
            ← Back to parent trope
          </Link>
        )}
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <h1 className='text-2xl font-semibold'>{trope.name}</h1>
          <LikeButton tropeId={trope.id} initialScore={trope.likeScore} />
        </div>
        {trope.description && (
          <p className='text-black/70 dark:text-white/70'>{trope.description}</p>
        )}
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-lg font-medium'>Sub-tropes</h2>
        {children.length === 0 ? (
          <p className='text-sm text-black/50 dark:text-white/50'>No sub-tropes yet.</p>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {children.map((child) => (
              <TropeCard key={child.id} trope={child} />
            ))}
          </div>
        )}
        {(childrenHasPrev || childrenHasNext) && (
          <div className='flex justify-between text-sm'>
            {childrenHasPrev ? (
              <Link
                href={`/tropes/${id}?childrenSkip=${childrenPrevSkip}&booksSkip=${booksSkip}`}
                className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            {childrenHasNext && (
              <Link
                href={`/tropes/${id}?childrenSkip=${childrenNextSkip}&booksSkip=${booksSkip}`}
                className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
              >
                Next
              </Link>
            )}
          </div>
        )}
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-lg font-medium'>Books featuring this trope</h2>
        {books.length === 0 ? (
          <p className='text-sm text-black/50 dark:text-white/50'>No books linked yet.</p>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {books.map((book) => (
              <BookCard key={book.id} work={book} />
            ))}
          </div>
        )}
        {(booksHasPrev || booksHasNext) && (
          <div className='flex justify-between text-sm'>
            {booksHasPrev ? (
              <Link
                href={`/tropes/${id}?childrenSkip=${childrenSkip}&booksSkip=${booksPrevSkip}`}
                className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            {booksHasNext && (
              <Link
                href={`/tropes/${id}?childrenSkip=${childrenSkip}&booksSkip=${booksNextSkip}`}
                className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
              >
                Next
              </Link>
            )}
          </div>
        )}
        <AddBookToTropeForm tropeId={trope.id} />
      </section>
    </div>
  );
}
