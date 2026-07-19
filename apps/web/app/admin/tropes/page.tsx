import { cookies } from "next/headers";
import Link from "next/link";
import { DeleteWorkTropeButton } from "@/components/admin/delete-work-trope-button";
import { adminListWorkTropeLinks } from "@/lib/api";

const PAGE_SIZE = 50;

export default async function AdminTropesPage({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string }>;
}) {
  const { skip: skipParam } = await searchParams;
  const skip = Number(skipParam ?? 0) || 0;
  const cookieHeader = (await cookies()).toString();
  const links = await adminListWorkTropeLinks(cookieHeader, { skip, take: PAGE_SIZE });
  const prevSkip = Math.max(skip - PAGE_SIZE, 0);
  const nextSkip = skip + PAGE_SIZE;
  const hasPrev = skip > 0;
  const hasNext = links.length === PAGE_SIZE;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Trope links</h1>
      {links.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">No trope links.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li
              key={`${link.workId}-${link.tropeId}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10"
            >
              <div className="text-sm">
                <Link href={`/tropes/${link.tropeId}`} className="font-medium hover:underline">
                  {link.trope.name}
                </Link>
                {" on "}
                <Link href={`/books/${link.workId}`} className="hover:underline">
                  {link.work.title}
                </Link>
                <p className="text-black/60 dark:text-white/60">
                  {link.source} · score {link.voteScore}
                </p>
              </div>
              <DeleteWorkTropeButton workId={link.workId} tropeId={link.tropeId} />
            </li>
          ))}
        </ul>
      )}
      {(hasPrev || hasNext) && (
        <div className="flex justify-between text-sm">
          {hasPrev ? (
            <Link
              href={`/admin/tropes?skip=${prevSkip}`}
              className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link
              href={`/admin/tropes?skip=${nextSkip}`}
              className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
