import Link from 'next/link';
import { BookCard } from '@/components/book-card';
import { TropeCard } from '@/components/trope-card';
import { getBooks, getBooksCount, getTropes, getTropesCount } from '@/lib/api';

const PAGE_SIZE = 12;

type SearchType = 'book' | 'trope';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; type?: string; skip?: string }>;
}) {
  const { query, type: typeParam, skip: skipParam } = await searchParams;
  const trimmed = query?.trim();
  const type: SearchType = typeParam === 'trope' ? 'trope' : 'book';
  const skip = Number(skipParam ?? 0) || 0;

  const [books, tropes, booksTotal, tropesTotal] = trimmed
    ? await Promise.all([
        getBooks({ query: trimmed, skip: type === 'book' ? skip : 0, take: PAGE_SIZE }),
        getTropes(false, { query: trimmed, skip: type === 'trope' ? skip : 0, take: PAGE_SIZE }),
        getBooksCount(trimmed),
        getTropesCount(false, trimmed),
      ])
    : [[], [], { total: 0 }, { total: 0 }];

  const total = type === 'book' ? booksTotal.total : tropesTotal.total;
  const prevSkip = Math.max(skip - PAGE_SIZE, 0);
  const nextSkip = skip + PAGE_SIZE;
  const hasPrev = skip > 0;
  const hasNext = nextSkip < total;

  const TABS: { type: SearchType; label: string }[] = [
    { type: 'book', label: trimmed ? `Books (${booksTotal.total})` : 'Books' },
    { type: 'trope', label: trimmed ? `Tropes (${tropesTotal.total})` : 'Tropes' },
  ];

  return (
    <div className='flex flex-col gap-8'>
      <div>
        <h1 className='text-2xl font-semibold'>Search</h1>
        <p className='mt-1 text-sm text-black/60 dark:text-white/60'>
          Search books and tropes at once.
        </p>
      </div>

      <form className='flex gap-2'>
        <input
          type='search'
          name='query'
          defaultValue={query}
          placeholder='Search books and tropes'
          className='flex-1 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
        />
        <input type='hidden' name='type' value={type} />
        <button
          type='submit'
          className='rounded-md border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
        >
          Search
        </button>
      </form>

      <div className='flex gap-2 text-sm'>
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/search?${new URLSearchParams({
              ...(trimmed ? { query: trimmed } : {}),
              type: tab.type,
            })}`}
            className={`rounded-md border px-3 py-1.5 ${
              type === tab.type
                ? 'border-black/30 bg-black/5 dark:border-white/30 dark:bg-white/10'
                : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!trimmed ? (
        <p className='text-sm text-black/50 dark:text-white/50'>Enter a search term above.</p>
      ) : type === 'book' ? (
        <section className='flex flex-col gap-3'>
          <h2 className='text-lg font-medium'>
            Books {total > 0 && `(${skip + books.length} of ${total})`}
          </h2>
          {books.length === 0 ? (
            <p className='text-sm text-black/50 dark:text-white/50'>
              No books match &quot;{trimmed}&quot;.
            </p>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {books.map((book) => (
                <BookCard key={book.id} work={book} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className='flex flex-col gap-3'>
          <h2 className='text-lg font-medium'>
            Tropes {total > 0 && `(${skip + tropes.length} of ${total})`}
          </h2>
          {tropes.length === 0 ? (
            <p className='text-sm text-black/50 dark:text-white/50'>
              No tropes match &quot;{trimmed}&quot;.
            </p>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {tropes.map((trope) => (
                <TropeCard key={trope.id} trope={trope} />
              ))}
            </div>
          )}
        </section>
      )}

      {trimmed && (hasPrev || hasNext) && (
        <div className='flex justify-between text-sm'>
          {hasPrev ? (
            <Link
              href={`/search?${new URLSearchParams({ query: trimmed, type, skip: String(prevSkip) })}`}
              className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link
              href={`/search?${new URLSearchParams({ query: trimmed, type, skip: String(nextSkip) })}`}
              className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
