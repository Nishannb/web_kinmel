"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OverlaySettings } from "@/lib/appTypes";
import {
  fetchOverlayState,
  pushOverlayState,
} from "@/lib/backendClient";
import { defaultOverlaySettings } from "@/lib/defaults";
import { humanizeKinmelApiError } from "@/lib/humanizeKinmelApiError";

export type OverlaySyncStatus =
  | "idle"
  | "loading"
  | "syncing"
  | "synced"
  | "error";

const DEBOUNCE_MS = 200;

const overlayPayloadEqual = (a: OverlaySettings, b: OverlaySettings): boolean => {
  if (
    a.overlayText !== b.overlayText ||
    a.textPosition !== b.textPosition ||
    a.productCardPosition !== b.productCardPosition ||
    a.visibleProductIds.length !== b.visibleProductIds.length
  ) {
    return false;
  }
  for (let i = 0; i < a.visibleProductIds.length; i += 1) {
    if (a.visibleProductIds[i] !== b.visibleProductIds[i]) {
      return false;
    }
  }
  return true;
};

export function useOverlaySync(liveSessionId: string | null): {
  settings: OverlaySettings;
  setSettings: (next: OverlaySettings) => void;
  forceSync: () => void;
  status: OverlaySyncStatus;
  error: string | null;
  reload: () => Promise<void>;
} {
  const [settings, setLocalSettings] = useState<OverlaySettings>(() =>
    defaultOverlaySettings()
  );
  const [status, setStatus] = useState<OverlaySyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const lastPushedRef = useRef<OverlaySettings | null>(null);
  const queuedPayloadRef = useRef<OverlaySettings | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drain = useCallback(async (sessionId: string) => {
    let payload = queuedPayloadRef.current;
    queuedPayloadRef.current = null;
    while (payload) {
      if (
        lastPushedRef.current &&
        overlayPayloadEqual(lastPushedRef.current, payload)
      ) {
        setStatus("synced");
        payload = queuedPayloadRef.current;
        queuedPayloadRef.current = null;
        continue;
      }
      inFlightRef.current = true;
      setStatus("syncing");
      setError(null);
      try {
        await pushOverlayState(sessionId, {
          overlay_text: payload.overlayText,
          text_position: payload.textPosition,
          product_card_layout: payload.productCardPosition,
          visible_product_ids: payload.visibleProductIds,
        });
        lastPushedRef.current = payload;
        setStatus("synced");
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setError(humanizeKinmelApiError(message));
        inFlightRef.current = false;
        return;
      }
      inFlightRef.current = false;
      payload = queuedPayloadRef.current;
      queuedPayloadRef.current = null;
    }
  }, []);

  const reload = useCallback(async () => {
    if (!liveSessionId) return;
    setStatus("loading");
    try {
      const envelope = await fetchOverlayState(liveSessionId);
      const fromBackend: OverlaySettings = {
        overlayText: envelope.payload.overlay_text,
        textPosition: envelope.payload.text_position,
        productCardPosition: envelope.payload.product_card_layout,
        visibleProductIds: envelope.payload.visible_product_ids,
      };
      lastPushedRef.current = fromBackend;
      setLocalSettings(fromBackend);
      setStatus("synced");
      setError(null);
    } catch {
      // Keep UI clean on initial load when backend relay is unreachable.
      setStatus("idle");
      setError(null);
    }
  }, [liveSessionId]);

  useEffect(() => {
    if (!liveSessionId) {
      lastPushedRef.current = null;
      setError(null);
      setStatus("idle");
      return;
    }
    queueMicrotask(() => {
      void reload();
    });
  }, [liveSessionId, reload]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    },
    []
  );

  const setSettings = useCallback(
    (next: OverlaySettings) => {
      setLocalSettings(next);
      if (!liveSessionId) return;
      queuedPayloadRef.current = next;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (inFlightRef.current) return;
        void drain(liveSessionId);
      }, DEBOUNCE_MS);
    },
    [drain, liveSessionId]
  );

  const forceSync = useCallback(() => {
    if (!liveSessionId) return;
    // setSettings() queues the new payload synchronously; do not overwrite it with
    // stale React state when selectOverlayProduct calls setSettings + forceSync.
    if (!queuedPayloadRef.current) {
      queuedPayloadRef.current = settings;
    }
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      inFlightRef.current = false;
      lastPushedRef.current = null;
      void drain(liveSessionId);
    }, 0);
  }, [drain, liveSessionId, settings]);

  return useMemo(
    () => ({ settings, setSettings, forceSync, status, error, reload }),
    [error, forceSync, reload, setSettings, settings, status]
  );
}
