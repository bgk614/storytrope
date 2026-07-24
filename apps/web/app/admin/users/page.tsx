import { cookies } from 'next/headers';
import Link from 'next/link';
import { DeleteUserButton } from '@/components/admin/delete-user-button';
import { adminListUsers } from '@/lib/api';

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string }>;
}) {
  const { skip: skipParam } = await searchParams;
  const skip = Number(skipParam ?? 0) || 0;
  const cookieHeader = (await cookies()).toString();
  const users = await adminListUsers(cookieHeader, { skip, take: PAGE_SIZE });
  const prevSkip = Math.max(skip - PAGE_SIZE, 0);
  const nextSkip = skip + PAGE_SIZE;
  const hasPrev = skip > 0;
  const hasNext = users.length === PAGE_SIZE;

  return (
    <div className='flex flex-col gap-4'>
      <h1 className='text-xl font-semibold'>Users</h1>
      {users.length === 0 ? (
        <p className='text-sm text-black/50 dark:text-white/50'>No users.</p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {users.map((user) => (
            <li
              key={user.id}
              className='flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10'
            >
              <div>
                <p className='font-medium'>{user.nickname}</p>
                <p className='text-sm text-black/60 dark:text-white/60'>
                  {user.email} · {user.role}
                </p>
              </div>
              <DeleteUserButton userId={user.id} />
            </li>
          ))}
        </ul>
      )}
      {(hasPrev || hasNext) && (
        <div className='flex justify-between text-sm'>
          {hasPrev ? (
            <Link
              href={`/admin/users?skip=${prevSkip}`}
              className='rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link
              href={`/admin/users?skip=${nextSkip}`}
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
