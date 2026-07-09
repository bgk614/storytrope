import Link from "next/link";
import { TropeCard } from "@/components/trope-card";
import { getTopTropes } from "@/lib/api";

export default async function Home() {
  const topTropes = await getTopTropes("weekly", 6).catch(() => []);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Collect, vote on, and rank tropes found in books
        </h1>
        <p className="max-w-2xl text-black/60 dark:text-white/60">
          storytrope lets you catalog recurring tropes (clichés) in fiction and vote
          to verify which books contain which tropes.
        </p>
        <div className="flex gap-3">
          <Link
            href="/tropes"
            className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
          >
            Browse Tropes
          </Link>
          <Link
            href="/books"
            className="rounded-md border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            Browse Books
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Trending This Week</h2>
          <Link href="/rankings" className="text-sm text-black/60 hover:underline dark:text-white/60">
            View Full Rankings
          </Link>
        </div>
        {topTropes.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">No ranking data yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topTropes.map(({ trope, score }) => (
              <TropeCard key={trope.id} trope={trope} score={score} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
