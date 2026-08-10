"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Fragment, useMemo, useState } from "react";
import { useAppState } from "@/components/AppProvider";
import { TableExpandButton } from "@/components/TableExpandButton";
import type { LiveEvent } from "@/lib/appTypes";

function statusLabel(status: LiveEvent["status"]) {
  if (status === "live") return "Ongoing";
  return status;
}

function statusBadgeClass(status: LiveEvent["status"]) {
  switch (status) {
    case "live":
      return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
    case "scheduled":
      return "bg-sky-50 text-sky-800 ring-sky-600/20";
    case "ended":
      return "bg-zinc-100 text-zinc-700 ring-zinc-500/15";
    case "cancelled":
      return "bg-red-50 text-red-800 ring-red-600/20";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-500/15";
  }
}

function EventActions({
  eventId,
  deleteBusy,
  onDelete,
}: {
  eventId: string;
  deleteBusy: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/live-selling/${eventId}/live`}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
      >
        Workspace
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleteBusy}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {deleteBusy ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}

export default function LiveSellingPage() {
  const router = useRouter();
  const { events, createEvent, deleteEvent, instagramAccounts, businessId } = useAppState();
  const [instagramAccountId, setInstagramAccountId] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const accountById = useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of instagramAccounts) {
      map.set(acc.id, acc.username || acc.instagramUserId);
    }
    return map;
  }, [instagramAccounts]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [events]
  );

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!instagramAccountId) return;
    setCreateBusy(true);
    setError(null);
    try {
      const id = await createEvent({
        instagramAccountId,
      });
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

  const createDisabled = !businessId || !instagramAccountId || createBusy;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Live Selling</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create Instagram Live events here. Facebook Live is started from the Kinmel mobile app.
        </p>
      </div>

      <div className="shrink-0 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Create Instagram Live event</h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={onCreate}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1 space-y-1">
              <span className="text-sm font-medium text-zinc-800">Instagram account</span>
              <select
                value={instagramAccountId}
                onChange={(event) => setInstagramAccountId(event.target.value)}
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2.5 outline-none focus:border-zinc-500"
              >
                <option value="">Select account</option>
                {instagramAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.username || acc.instagramUserId}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">
                Used for the shop link (kinmel.shop/username) and comment-to-buy.
              </p>
            </label>
            <button
              type="submit"
              disabled={createDisabled}
              className="w-full shrink-0 rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60 sm:w-auto sm:min-w-[180px]"
            >
              {createBusy ? "Creating…" : "Create event"}
            </button>
          </div>
        </form>
        {error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="shrink-0 border-b border-zinc-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-zinc-900">Previous events</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {sortedEvents.length} event{sortedEvents.length === 1 ? "" : "s"}
          </p>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-10 text-center">
            <div>
              <p className="text-sm font-medium text-zinc-800">No events yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Create an Instagram Live event above to set up stream keys and manage your lineup.
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-zinc-200 bg-zinc-50/95 text-xs font-semibold uppercase tracking-wide text-zinc-600 backdrop-blur-sm">
                  <th className="px-3 py-3 sm:px-4">Event</th>
                  <th className="px-3 py-3 sm:px-4">Status</th>
                  <th className="hidden px-3 py-3 lg:table-cell lg:px-4">Products</th>
                  <th className="hidden px-3 py-3 lg:table-cell lg:px-4">Instagram</th>
                  <th className="hidden px-3 py-3 text-right xl:table-cell xl:px-4">Actions</th>
                  <th className="w-10 px-2 py-3 xl:hidden" aria-label="Details" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedEvents.map((event) => {
                  const isOpen = expanded.has(event.id);
                  const instagram = accountById.get(event.instagramAccountId) ?? "—";
                  const deleteBusy = deleteBusyId === event.id;
                  return (
                    <Fragment key={event.id}>
                      <tr className="align-middle">
                        <td className="px-3 py-3 font-medium text-zinc-900 sm:px-4">
                          {event.name}
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(
                              event.status
                            )}`}
                          >
                            {statusLabel(event.status)}
                          </span>
                        </td>
                        <td className="hidden px-3 py-3 text-zinc-700 lg:table-cell lg:px-4">
                          {event.products.length}
                        </td>
                        <td className="hidden px-3 py-3 text-zinc-700 lg:table-cell lg:px-4">
                          {instagram}
                        </td>
                        <td className="hidden px-3 py-3 text-right xl:table-cell xl:px-4">
                          <EventActions
                            eventId={event.id}
                            deleteBusy={deleteBusy}
                            onDelete={() => void onDelete(event.id)}
                          />
                        </td>
                        <td className="px-2 py-3 xl:hidden">
                          <TableExpandButton
                            expanded={isOpen}
                            onToggle={() => toggleExpanded(event.id)}
                          />
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="bg-zinc-50 xl:hidden">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex flex-col gap-2 text-sm text-zinc-700">
                              <div>Products: {event.products.length}</div>
                              <div>Instagram: {instagram}</div>
                              <EventActions
                                eventId={event.id}
                                deleteBusy={deleteBusy}
                                onDelete={() => void onDelete(event.id)}
                              />
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
