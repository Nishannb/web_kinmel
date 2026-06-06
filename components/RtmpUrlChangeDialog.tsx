"use client";

type RtmpUrlChangeDialogProps = {
  open: boolean;
  savedUrl: string;
  newUrl: string;
  revertInput: string;
  onRevertInputChange: (value: string) => void;
  onConfirm: () => void;
  onRevert: () => void;
  busy?: boolean;
};

export function RtmpUrlChangeDialog({
  open,
  savedUrl,
  newUrl,
  revertInput,
  onRevertInputChange,
  onConfirm,
  onRevert,
  busy = false,
}: RtmpUrlChangeDialogProps) {
  if (!open) return null;

  const canRevert = revertInput.trim().toLowerCase() === "cancel";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onRevert();
      }}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="rtmp-change-title"
        aria-modal="true"
      >
        <h2 id="rtmp-change-title" className="text-lg font-semibold text-zinc-900">
          RTMP URL changed
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          You changed the RTMP URL from what we saved for your account. Confirm
          only if Instagram gave you a new server URL.
        </p>
        <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <div>
            <p className="font-medium text-zinc-700">Saved URL</p>
            <p className="mt-1 break-all font-mono text-xs text-zinc-600">
              {savedUrl}
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-700">New URL</p>
            <p className="mt-1 break-all font-mono text-xs text-zinc-600">
              {newUrl}
            </p>
          </div>
        </div>
        <label className="mt-4 block space-y-1">
          <span className="text-sm text-zinc-600">
            To keep your saved URL instead, type{" "}
            <span className="font-medium text-zinc-900">Cancel</span> below.
          </span>
          <input
            value={revertInput}
            onChange={(e) => onRevertInputChange(e.target.value)}
            placeholder="Type Cancel to revert"
            disabled={busy}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60"
          />
        </label>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onRevert}
            disabled={!canRevert || busy}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Revert to saved URL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save new URL"}
          </button>
        </div>
      </div>
    </div>
  );
}
