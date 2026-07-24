'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { login, signup } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await signup(email, password, nickname);
      await login(email, password);
      setUser({ email: user.email, nickname: user.nickname });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='mx-auto flex max-w-sm flex-col gap-6'>
      <h1 className='text-2xl font-semibold'>Sign Up</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <label htmlFor='nickname' className='text-sm font-medium'>
            Nickname
          </label>
          <input
            id='nickname'
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label htmlFor='email' className='text-sm font-medium'>
            Email
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label htmlFor='password' className='text-sm font-medium'>
            Password
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={72}
            className='rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent'
          />
        </div>
        {error && <p className='text-sm text-red-600'>{error}</p>}
        <button
          type='submit'
          disabled={submitting}
          className='rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50'
        >
          {submitting ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      <p className='text-sm text-black/60 dark:text-white/60'>
        Already have an account?{' '}
        <Link href='/login' className='underline'>
          Log in
        </Link>
      </p>
    </div>
  );
}
