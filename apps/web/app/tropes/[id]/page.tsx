import Link from "next/link";
import { notFound } from "next/navigation";
import { AddBookToTropeForm } from "@/components/add-book-to-trope-form";
import { BookCard } from "@/components/book-card";
import { LikeButton } from "@/components/like-button";
import { TropeCard } from "@/components/trope-card";
import { ApiError, getTrope, getTropeBooks, getTropeChildren } from "@/lib/api";

export default async function TropeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let trope;
  try {
    trope = await getTrope(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const [children, books] = await Promise.all([getTropeChildren(id), getTropeBooks(id)]);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        {trope.parentId && (
          <Link
            href={`/tropes/${trope.parentId}`}
            className="w-fit text-sm text-black/50 hover:underline dark:text-white/50"
          >
            ← Back to parent trope
          </Link>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{trope.name}</h1>
          <LikeButton tropeId={trope.id} initialScore={trope.likeScore} />
        </div>
        {trope.description && (
          <p className="text-black/70 dark:text-white/70">{trope.description}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Sub-tropes</h2>
        {children.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">No sub-tropes yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <TropeCard key={child.id} trope={child} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Books featuring this trope</h2>
        {books.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">
            No books linked yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} work={book} />
            ))}
          </div>
        )}
        <AddBookToTropeForm tropeId={trope.id} />
      </section>
    </div>
  );
}
