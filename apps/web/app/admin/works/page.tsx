import Link from 'next/link';
import { getBooks } from '@/lib/api';

const PAGE_SIZE = 20;

export default async function AdminWorksPage({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string }>;
}) {
  const { skip: skipParam } = await searchParams;
  const skip = Number(skipParam ?? 0) || 0;
  const works = await getBooks({ skip, take: PAGE_SIZE });
  const prevSkip = Math.max(skip - PAGE_SIZE, 0);
  const nextSkip = skip + PAGE_SIZE;
  const hasPrev = skip > 0;
  const hasNext = works.length === PAGE_SIZE;

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Books</h1>
        <Link
          href='/admin/works/new'
          className='rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90'
        >
          New book
        </Link>
      </div>
      {works.length === 0 ? (
        <p className='text-sm text-black/50 dark:text-white/50'>No books.</p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {works.map((work) => (
            <li
              key={work.id}
              className='flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10'
            >
              <span className='font-medium'>{work.title}</span>
              <Link href={`/admin/works/${work.id}/edit`} className='text-sm hover:underline'>
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(hasPrev || hasNext) && (
        <div className='flex justify-between text-sm'>
          {hasPrev ? (
            <Link
              href={`/admin/works?skip=${prevSkip}`}
              className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link
              href={`/admin/works?skip=${nextSkip}`}
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
