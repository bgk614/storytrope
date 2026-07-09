"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createTrope } from "@/lib/api";

export function CreateTropeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const trope = await createTrope({
        name,
        description: description || undefined,
      });
      setName("");
      setDescription("");
      setOpen(false);
      router.push(`/tropes/${trope.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the trope.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
      >
        New Trope
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="trope-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="trope-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent"
          placeholder="e.g. Hidden power protagonist"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="trope-description" className="text-sm font-medium">
          Description (optional)
        </label>
        <textarea
          id="trope-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
