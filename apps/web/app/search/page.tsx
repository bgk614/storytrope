import { BookCard } from '@/components/book-card';
import { TropeCard } from '@/components/trope-card';
import { getBooks, getTropes } from '@/lib/api';

const RESULT_LIMIT = 12;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const trimmed = query?.trim();

  const [books, tropes] = trimmed
    ? await Promise.all([
        getBooks({ query: trimmed, take: RESULT_LIMIT }),
        getTropes(false, { query: trimmed, take: RESULT_LIMIT }),
      ])
    : [[], []];

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
        <button
          type='submit'
          className='rounded-md border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
        >
          Search
        </button>
      </form>

      {!trimmed ? (
        <p className='text-sm text-black/50 dark:text-white/50'>Enter a search term above.</p>
      ) : (
        <>
          <section className='flex flex-col gap-3'>
            <h2 className='text-lg font-medium'>Books</h2>
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

          <section className='flex flex-col gap-3'>
            <h2 className='text-lg font-medium'>Tropes</h2>
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
        </>
      )}
    </div>
  );
}
