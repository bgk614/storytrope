import Link from "next/link";
import { CreateTropeForm } from "@/components/create-trope-form";
import { TropeCard } from "@/components/trope-card";
import { getTropes } from "@/lib/api";

const PAGE_SIZE = 20;

export default async function TropesPage({
  searchParams,
}: {
  searchParams: Promise<{ topLevelOnly?: string; skip?: string }>;
}) {
  const { topLevelOnly, skip: skipParam } = await searchParams;
  const showTopLevelOnly = topLevelOnly === "true";
  const skip = Number(skipParam ?? 0) || 0;
  const tropes = await getTropes(showTopLevelOnly, { skip, take: PAGE_SIZE });

  const prevSkip = Math.max(skip - PAGE_SIZE, 0);
  const nextSkip = skip + PAGE_SIZE;
  const hasPrev = skip > 0;
  const hasNext = tropes.length === PAGE_SIZE;
  const filterQs = showTopLevelOnly ? "topLevelOnly=true&" : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tropes</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Browse recurring clichés found in books, or register a new one.
          </p>
        </div>
        <CreateTropeForm />
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/tropes"
          className={`rounded-md px-3 py-1 ${
            !showTopLevelOnly
              ? "bg-foreground text-background"
              : "border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          }`}
        >
          All
        </Link>
        <Link
          href="/tropes?topLevelOnly=true"
          className={`rounded-md px-3 py-1 ${
            showTopLevelOnly
              ? "bg-foreground text-background"
              : "border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          }`}
        >
          Top-level only
        </Link>
      </div>

      {tropes.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">No tropes registered yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tropes.map((trope) => (
            <TropeCard key={trope.id} trope={trope} />
          ))}
        </div>
      )}

      <div className="flex justify-between text-sm">
        {hasPrev ? (
          <Link
            href={`/tropes?${filterQs}skip=${prevSkip}`}
            className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        {hasNext && (
          <Link
            href={`/tropes?${filterQs}skip=${nextSkip}`}
            className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
