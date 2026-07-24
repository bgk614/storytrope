import Link from 'next/link';
import { TropeCard } from '@/components/trope-card';
import { getTopTropes } from '@/lib/api';
import type { RankingPeriod } from '@/lib/types';

const PERIODS: { value: RankingPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period: RankingPeriod = PERIODS.some((p) => p.value === periodParam)
    ? (periodParam as RankingPeriod)
    : 'weekly';

  const entries = await getTopTropes(period, 20);

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Rankings</h1>
        <p className='mt-1 text-sm text-black/60 dark:text-white/60'>
          The most popular tropes, ranked by combined likes and votes.
        </p>
      </div>

      <div className='flex gap-2 text-sm'>
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/rankings?period=${p.value}`}
            className={`rounded-md px-3 py-1 ${
              period === p.value
                ? 'bg-foreground text-background'
                : 'border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className='text-sm text-black/50 dark:text-white/50'>No ranking data yet.</p>
      ) : (
        <ol className='flex flex-col gap-3'>
          {entries.map(({ trope, score }, index) => (
            <li key={trope.id} className='flex items-center gap-3'>
              <span className='w-6 shrink-0 text-right text-sm text-black/40 dark:text-white/40'>
                {index + 1}
              </span>
              <div className='flex-1'>
                <TropeCard trope={trope} score={score} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
