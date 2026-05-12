"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState } from "@/components/AppProvider";

export default function LiveSellingPage() {
  const router = useRouter();
  const { events, createEvent, deleteEvent, instagramAccounts, businessId } = useAppState();
  const [instagramAccountId, setInstagramAccountId] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [events]
  );

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!instagramAccountId) return;
    setCreateBusy(true);
    setError(null);
    try {
      const id = await createEvent({ instagramAccountId });
      router.push(`/live-selling/${id}/stream`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setCreateBusy(false);
    }
  };

  const onDelete = async (eventId: string) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    setDeleteBusyId(eventId);
    setError(null);
    try {
      await deleteEvent(eventId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setDeleteBusyId(null);
    }
  };

  return (
    <RequireAuth>
      <section className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">Live Selling</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create a new event, set stream keys, then manage products while live.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Previous Events</h2>
            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {sortedEvents.length === 0 ? (
                <p className="text-sm text-zinc-600">No events yet.</p>
              ) : (
                sortedEvents.map((event) => (
                  <article key={event.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{event.name}</h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Created {new Date(event.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Status:{" "}
                          <span className={event.status === "live" ? "font-semibold text-emerald-700" : ""}>
                            {event.status === "live" ? "Ongoing" : event.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/live-selling/${event.id}/stream`}
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-white"
                        >
                          Start Live
                        </Link>
                        <Link
                          href={`/live-selling/${event.id}/live`}
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-white"
                        >
                          Workspace
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            void onDelete(event.id);
                          }}
                          disabled={deleteBusyId === event.id}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deleteBusyId === event.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Create New Event</h2>
            <form className="mt-4 grid gap-3" onSubmit={onCreate}>
              <label className="space-y-1">
                <span className="text-sm font-medium">Instagram Account</span>
                <select
                  value={instagramAccountId}
                  onChange={(event) => setInstagramAccountId(event.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                >
                  <option value="">Select account</option>
                  {instagramAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username || acc.instagramUserId}
                    </option>
                  ))}
                </select>
              </label>
              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <div>
                <button
                  type="submit"
                  disabled={!businessId || !instagramAccountId || createBusy}
                  className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {createBusy ? "Creating..." : "Create New Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </RequireAuth>
  );
}

