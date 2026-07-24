import { notFound } from 'next/navigation';
import { WorkForm } from '@/components/admin/work-form';
import { ApiError, getBook } from '@/lib/api';

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let work;
  try {
    work = await getBook(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className='flex flex-col gap-4'>
      <h1 className='text-xl font-semibold'>Edit book</h1>
      <WorkForm work={work} />
    </div>
  );
}
