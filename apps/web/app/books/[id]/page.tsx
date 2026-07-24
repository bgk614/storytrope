import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddTropeToBookForm } from '@/components/add-trope-to-book-form';
import { VoteButtons } from '@/components/vote-buttons';
import { ApiError, getBook, getBookTropes } from '@/lib/api';

const PAGE_SIZE = 20;

export default async function BookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skip?: string }>;
}) {
  const { id } = await params;
  const { skip: skipParam } = await searchParams;
  const skip = Number(skipParam ?? 0) || 0;

  let book;
  try {
    book = await getBook(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const tropes = await getBookTropes(id, { skip, take: PAGE_SIZE });
  const prevSkip = Math.max(skip - PAGE_SIZE, 0);
  const nextSkip = skip + PAGE_SIZE;
  const hasPrev = skip > 0;
  const hasNext = tropes.length === PAGE_SIZE;
  const authorNames = book.authors
    ?.map((wa) => wa.author?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className='flex flex-col gap-10'>
      <section className='flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold'>{book.title}</h1>
        {authorNames && <p className='text-black/60 dark:text-white/60'>{authorNames}</p>}
        {book.firstPublishDate && (
          <p className='text-sm text-black/40 dark:text-white/40'>{book.firstPublishDate}</p>
        )}
        {book.description && (
          <p className='mt-2 text-black/70 dark:text-white/70'>{book.description}</p>
        )}
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-lg font-medium'>Tropes in this book</h2>
        {tropes.length === 0 ? (
          <p className='text-sm text-black/50 dark:text-white/50'>No tropes linked yet.</p>
        ) : (
          <ul className='flex flex-col gap-2'>
            {tropes.map((trope) => (
              <li
                key={trope.id}
                className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10'
              >
                <Link href={`/tropes/${trope.id}`} className='font-medium hover:underline'>
                  {trope.name}
                </Link>
                <VoteButtons tropeId={trope.id} bookId={book.id} />
              </li>
            ))}
          </ul>
        )}
        {(hasPrev || hasNext) && (
          <div className='flex justify-between text-sm'>
            {hasPrev ? (
              <Link
                href={`/books/${id}?skip=${prevSkip}`}
                className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            {hasNext && (
              <Link
                href={`/books/${id}?skip=${nextSkip}`}
                className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
              >
                Next
              </Link>
            )}
          </div>
        )}
        <AddTropeToBookForm bookId={book.id} />
      </section>
    </div>
  );
}
