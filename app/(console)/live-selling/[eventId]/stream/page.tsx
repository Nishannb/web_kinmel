"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/components/AppProvider";
import { RtmpUrlChangeDialog } from "@/components/RtmpUrlChangeDialog";
import { useStreamConfig } from "@/hooks/useStreamConfig";
import { DEV_INSTAGRAM_RTMP_URL } from "@/lib/publicConfig";

function devFallbackRtmpUrl(platform: "instagram" | "twitch" | "custom"): string {
  if (platform === "instagram" && DEV_INSTAGRAM_RTMP_URL) {
    return DEV_INSTAGRAM_RTMP_URL;
  }
  return "";
}

export default function StreamSetupPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const { getEventById } = useAppState();
  const event = getEventById(eventId);
  const streamConfig = useStreamConfig(eventId ?? null);

  const [rtmpUrl, setRtmpUrl] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "twitch" | "custom">(
    "instagram"
  );
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [rtmpChangeOpen, setRtmpChangeOpen] = useState(false);
  const [revertInput, setRevertInput] = useState("");
  const savedRtmpUrlRef = useRef("");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (streamConfig.status !== "ready" || hydratedRef.current) return;

    const businessRtmp = streamConfig.rtmpDefault?.rtmp_url?.trim() ?? "";
    const sessionRtmp = streamConfig.config?.rtmp_url?.trim() ?? "";
    const sessionPlatform = streamConfig.config?.platform ?? "instagram";
    const effectivePlatform =
      streamConfig.rtmpDefault?.platform ?? sessionPlatform;

    savedRtmpUrlRef.current = businessRtmp;
    const prepopulated =
      sessionRtmp ||
      businessRtmp ||
      devFallbackRtmpUrl(effectivePlatform);

    queueMicrotask(() => {
      setPlatform(effectivePlatform);
      setRtmpUrl(prepopulated);
      setStreamKey(streamConfig.config?.stream_key ?? "");
      hydratedRef.current = true;
    });
  }, [streamConfig.config, streamConfig.rtmpDefault, streamConfig.status]);

  const persistAndContinue = async (persistRtmpDefault: boolean) => {
    const effectiveUrl = rtmpUrl.trim();
    const saved = await streamConfig.save({
      platform,
      rtmpUrl: effectiveUrl,
      streamKey: streamKey.trim(),
      persistRtmpDefault,
    });
    if (saved) {
      if (persistRtmpDefault) {
        savedRtmpUrlRef.current = effectiveUrl;
      }
      router.push(`/live-selling/${eventId}/live`);
    }
  };

  const onSubmit = async (eventForm: FormEvent<HTMLFormElement>) => {
    eventForm.preventDefault();
    setSaveAttempted(true);

    const effectiveUrl = rtmpUrl.trim();
    const savedUrl = savedRtmpUrlRef.current;

    if (savedUrl && effectiveUrl !== savedUrl) {
      setRevertInput("");
      setRtmpChangeOpen(true);
      return;
    }

    const persistRtmpDefault = !savedUrl || effectiveUrl !== savedUrl;
    await persistAndContinue(persistRtmpDefault);
  };

  const onConfirmRtmpChange = async () => {
    setRtmpChangeOpen(false);
    await persistAndContinue(true);
  };

  const onRevertRtmpChange = () => {
    setRtmpUrl(savedRtmpUrlRef.current);
    setRevertInput("");
    setRtmpChangeOpen(false);
  };

  return (
    <>
      {!event ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="text-xl font-semibold">Event not found</h1>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h1 className="text-2xl font-semibold">Stream Setup</h1>
            <p className="mt-1 text-sm text-zinc-600">Event: {event.name}</p>
            {savedRtmpUrlRef.current ? (
              <p className="mt-2 text-sm text-zinc-500">
                Your saved RTMP URL is prefilled below. You can edit or clear it
                if Instagram gave you a different server this time.
              </p>
            ) : null}
          </div>
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Platform</span>
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(
                      e.target.value as "instagram" | "twitch" | "custom"
                    )
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                >
                  <option value="instagram">Instagram</option>
                  <option value="twitch">Twitch</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">RTMP URL</span>
                <input
                  value={rtmpUrl}
                  onChange={(e) => setRtmpUrl(e.target.value)}
                  required
                  placeholder="Paste the RTMP server URL from Instagram"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Stream Key</span>
                <input
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                />
              </label>
              {saveAttempted && streamConfig.error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {streamConfig.error}
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/live-selling")}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={streamConfig.status === "saving"}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {streamConfig.status === "saving" ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </form>
          </section>
        </section>
      )}

      <RtmpUrlChangeDialog
        open={rtmpChangeOpen}
        savedUrl={savedRtmpUrlRef.current}
        newUrl={rtmpUrl.trim()}
        revertInput={revertInput}
        onRevertInputChange={setRevertInput}
        onConfirm={onConfirmRtmpChange}
        onRevert={onRevertRtmpChange}
        busy={streamConfig.status === "saving"}
      />
    </>
  );
}
