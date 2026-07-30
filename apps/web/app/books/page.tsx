import Link from 'next/link';
import { BookCard } from '@/components/book-card';
import { getBooks } from '@/lib/api';

const PAGE_SIZE = 20;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string; query?: string }>;
}) {
  const { skip: skipParam, query } = await searchParams;
  const skip = Number(skipParam ?? 0) || 0;
  const books = await getBooks({ skip, take: PAGE_SIZE, query });

  const prevSkip = Math.max(skip - PAGE_SIZE, 0);
  const nextSkip = skip + PAGE_SIZE;
  const hasPrev = skip > 0;
  const hasNext = books.length === PAGE_SIZE;
  const qs = query ? `&query=${encodeURIComponent(query)}` : '';

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Books</h1>
        <p className='mt-1 text-sm text-black/60 dark:text-white/60'>
          Browse books with registered tropes.
        </p>
      </div>

      <form className='flex gap-2'>
        <input
          type='search'
          name='query'
          defaultValue={query}
          placeholder='Search by title or author'
          className='flex-1 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
        />
        <button
          type='submit'
          className='rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90'
        >
          Search
        </button>
      </form>

      {books.length === 0 ? (
        <p className='text-sm text-black/50 dark:text-white/50'>
          {query ? `No books match "${query}".` : 'No books registered yet.'}
        </p>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {books.map((book) => (
            <BookCard key={book.id} work={book} />
          ))}
        </div>
      )}

      <div className='flex justify-between text-sm'>
        {hasPrev ? (
          <Link
            href={`/books?skip=${prevSkip}${qs}`}
            className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        {hasNext && (
          <Link
            href={`/books?skip=${nextSkip}${qs}`}
            className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
