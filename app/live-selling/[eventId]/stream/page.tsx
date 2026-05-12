"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState } from "@/components/AppProvider";
import { useStreamConfig } from "@/hooks/useStreamConfig";

const INSTAGRAM_RTMP_URL = "rtmps://edgetee-upload-nrt1-2.xx.fbcdn.net:443/rtmp/";

export default function StreamSetupPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const { getEventById } = useAppState();
  const event = getEventById(eventId);
  const streamConfig = useStreamConfig(eventId ?? null);

  const [rtmpUrl, setRtmpUrl] = useState(INSTAGRAM_RTMP_URL);
  const [streamKey, setStreamKey] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "twitch" | "custom">(
    "instagram"
  );
  const [saveAttempted, setSaveAttempted] = useState(false);

  useEffect(() => {
    if (streamConfig.config) {
      queueMicrotask(() => {
        setRtmpUrl(streamConfig.config!.rtmp_url || INSTAGRAM_RTMP_URL);
        setStreamKey(streamConfig.config!.stream_key || "");
        setPlatform(streamConfig.config!.platform || "instagram");
      });
    }
  }, [streamConfig.config]);

  const onSubmit = async (eventForm: FormEvent<HTMLFormElement>) => {
    eventForm.preventDefault();
    setSaveAttempted(true);
    const effectiveUrl = rtmpUrl.trim();
    await streamConfig.save({
      platform,
      rtmpUrl: effectiveUrl,
      streamKey: streamKey.trim(),
    });
    router.push(`/live-selling/${eventId}/live`);
  };

  return (
    <RequireAuth>
      {!event ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="text-xl font-semibold">Event not found</h1>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h1 className="text-2xl font-semibold">Stream Setup</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Event: {event.name}
            </p>
          </div>
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Platform</span>
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(e.target.value as "instagram" | "twitch" | "custom")
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
    </RequireAuth>
  );
}

