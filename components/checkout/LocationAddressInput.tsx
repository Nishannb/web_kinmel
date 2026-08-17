"use client";

import { useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { locationTokens } from "@/src/data/locationTokens";

type LocationAddressInputProps = {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  required?: boolean;
  autoComplete?: string;
  /** Defaults to area/landmark tokens. Pass a city list for the city field. */
  tokens?: string[];
  /** Single-line input (city) instead of textarea. */
  as?: "textarea" | "input";
  /** Replace the whole field when a suggestion is chosen (city). */
  replaceEntireValue?: boolean;
  hint?: string;
};

function matchTokens(query: string, tokens: string[], limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const segment = (q.includes(",") ? q.split(",").pop() || q : q).trim();
  if (segment.length < 1) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const token of tokens) {
    const t = token.toLowerCase();
    if (t.startsWith(segment)) starts.push(token);
    else if (t.includes(segment)) contains.push(token);
    if (starts.length + contains.length >= limit * 2) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Insert selected token into the address, replacing the current trailing segment. */
export function insertLocationToken(current: string, token: string): string {
  const raw = current ?? "";
  const lastComma = raw.lastIndexOf(",");
  if (lastComma === -1) {
    const prefix = raw.replace(/\S+$/, "").trimEnd();
    return prefix ? `${prefix} ${token}` : token;
  }
  const head = raw.slice(0, lastComma + 1).trimEnd();
  return `${head} ${token}`;
}

/**
 * Address textarea with client-only location token suggestions.
 * Tokens assist typing only — full text is still what gets saved/geocoded.
 */
export function LocationAddressInput(props: LocationAddressInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokens = props.tokens ?? locationTokens;
  const asInput = props.as === "input";

  const suggestions = useMemo(() => {
    const q = props.value.trim();
    if (!q && asInput) {
      return tokens.slice(0, 8);
    }
    return matchTokens(props.value, tokens);
  }, [asInput, props.value, tokens]);

  const show = open && suggestions.length > 0;

  const applyToken = (token: string) => {
    props.onChange(
      props.replaceEntireValue ? token : insertLocationToken(props.value, token),
    );
    setOpen(false);
    setActiveIndex(0);
  };

  const fieldProps = {
    id: props.id,
    name: props.name,
    value: props.value,
    placeholder: props.placeholder,
    className: props.className,
    autoComplete: props.autoComplete ?? (asInput ? "shipping address-level2" : "shipping street-address"),
    required: props.required,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      props.onChange(e.target.value);
      setOpen(true);
      setActiveIndex(0);
    },
    onFocus: () => setOpen(true),
    onBlur: () => {
      blurTimer.current = setTimeout(() => {
        setOpen(false);
        props.onBlur?.();
      }, 120);
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!show) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && suggestions[activeIndex]) {
        e.preventDefault();
        applyToken(suggestions[activeIndex]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
  };

  return (
    <div className="relative">
      {asInput ? (
        <input type="text" autoCapitalize="words" enterKeyHint="next" {...fieldProps} />
      ) : (
        <textarea rows={props.rows ?? 3} {...fieldProps} />
      )}
      {show ? (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 text-sm shadow-lg"
          role="listbox"
        >
          {suggestions.map((token, index) => (
            <li key={token}>
              <button
                type="button"
                className={`block w-full px-3 py-2 text-left text-zinc-800 hover:bg-violet-50 ${
                  index === activeIndex ? "bg-violet-50" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  applyToken(token);
                }}
              >
                {token}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {props.hint !== "" ? (
        <p className="mt-1 text-xs text-zinc-400">
          {props.hint ??
            "Suggestions help with area names — keep typing house/flat details after selecting."}
        </p>
      ) : null}
    </div>
  );
}
