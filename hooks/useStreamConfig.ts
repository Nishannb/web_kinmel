"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BusinessRtmpDefault,
  fetchStreamConfig,
  saveStreamConfig,
  StreamConfig,
} from "@/lib/backendClient";

export type StreamConfigStatus = "idle" | "loading" | "saving" | "ready" | "error";

export function useStreamConfig(liveSessionId: string | null): {
  config: StreamConfig | null;
  rtmpDefault: BusinessRtmpDefault | null;
  status: StreamConfigStatus;
  error: string | null;
  save: (input: {
    platform: "instagram" | "twitch" | "custom";
    rtmpUrl: string;
    streamKey: string;
    expiresAt?: string | null;
    persistRtmpDefault?: boolean;
  }) => Promise<boolean>;
  reload: () => Promise<void>;
} {
  const [config, setConfig] = useState<StreamConfig | null>(null);
  const [rtmpDefault, setRtmpDefault] = useState<BusinessRtmpDefault | null>(
    null
  );
  const [status, setStatus] = useState<StreamConfigStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!liveSessionId) return;
    setStatus("loading");
    try {
      const result = await fetchStreamConfig(liveSessionId);
      setConfig(result.config);
      setRtmpDefault(result.rtmp_default);
      setStatus("ready");
      setError(null);
    } catch {
      // Don't surface transient backend load errors before user submits.
      setStatus("idle");
      setError(null);
    }
  }, [liveSessionId]);

  useEffect(() => {
    if (!liveSessionId) return;
    queueMicrotask(() => {
      void reload();
    });
  }, [liveSessionId, reload]);

  const save = useCallback(
    async (input: {
      platform: "instagram" | "twitch" | "custom";
      rtmpUrl: string;
      streamKey: string;
      expiresAt?: string | null;
      persistRtmpDefault?: boolean;
    }): Promise<boolean> => {
      if (!liveSessionId) return false;
      setStatus("saving");
      setError(null);
      try {
        const result = await saveStreamConfig(liveSessionId, {
          platform: input.platform,
          rtmp_url: input.rtmpUrl,
          stream_key: input.streamKey,
          expires_at: input.expiresAt ?? null,
          persist_rtmp_default: input.persistRtmpDefault,
        });
        setConfig(result.config);
        setRtmpDefault(result.rtmp_default);
        setStatus("ready");
        setError(null);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setError(message);
        return false;
      }
    },
    [liveSessionId]
  );

  return useMemo(
    () => ({ config, rtmpDefault, status, error, save, reload }),
    [config, error, reload, rtmpDefault, save, status]
  );
}
