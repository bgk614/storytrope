"use client";

import { useState } from "react";
import { likeTrope } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function LikeButton({ tropeId, initialScore }: { tropeId: string; initialScore: number }) {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!user) {
      setError("Log in to like this.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await likeTrope(tropeId);
      setScore(result.likeScore);
      setLiked(result.liked);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process the like.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`flex w-fit items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
          liked
            ? "border-transparent bg-foreground text-background"
            : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        }`}
      >
        <span>♥</span>
        <span>{score}</span>
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
