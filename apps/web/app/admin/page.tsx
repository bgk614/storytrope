import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <div className='flex flex-col gap-3'>
      <h1 className='text-2xl font-semibold'>Admin</h1>
      <ul className='flex flex-col gap-2 text-sm'>
        <li>
          <Link href='/admin/users' className='hover:underline'>
            Manage users
          </Link>
        </li>
        <li>
          <Link href='/admin/tropes' className='hover:underline'>
            Moderate trope links
          </Link>
        </li>
        <li>
          <Link href='/admin/works' className='hover:underline'>
            Manage books
          </Link>
        </li>
      </ul>
    </div>
  );
}
