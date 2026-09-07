"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import type { SearchResult } from "@/lib/search";

type Kind = "page" | "product" | "map" | "feature" | "answer" | "spec";

export type SearchLabels = {
  placeholder: string;
  open: string;
  close: string;
  hint: string;
  empty: string;
  emptyHint: string;
  seeAll: string;
  kinds: Record<Kind, string>;
  suggestions: string;
  suggestionItems: string[];
};

/**
 * Search anything on the site.
 *
 * The header shows a bar rather than a bare icon, because a bar is the thing
 * people look for; pressing it — or ⌘K, Ctrl+K, or "/" — opens a dialog over the
 * page. Results come from `/api/search`, which indexes the copy modules and the
 * product catalogue, so one query finds pages, products, Maps, band specs,
 * app integrations and support answers alike.
 */
export function SiteSearch({ locale, labels }: { locale: Locale; labels: SearchLabels }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable === true;

      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      // "/" is the other muscle memory, but only when not already in a field.
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button type="button" className="tf-search-trigger" onClick={() => setOpen(true)} aria-label={labels.open}>
        <SearchIcon />
        <span>{labels.placeholder}</span>
        <kbd aria-hidden>{labels.hint}</kbd>
      </button>

      <AnimatePresence>
        {open ? <SearchDialog locale={locale} labels={labels} onClose={() => setOpen(false)} /> : null}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function SearchDialog({
  locale,
  labels,
  onClose,
}: {
  locale: Locale;
  labels: SearchLabels;
  onClose: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Debounced, so a fast typist makes one request rather than eight. The
  // loading flag is set by the keystroke that caused it — setting state in the
  // effect body would be a cascading render.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}&locale=${locale}&limit=16`, {
        signal: controller.signal,
      })
        .then((response) => response.json() as Promise<{ results?: SearchResult[] }>)
        .then((payload) => {
          setResults(payload.results ?? []);
          setActive(0);
          setLoading(false);
        })
        .catch(() => {
          // An aborted request is the normal case here, not a failure.
        });
    }, 140);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, locale]);

  function onQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length === 0) {
      setResults([]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      setActive((index) => (index + (event.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const chosen = results[active];
      if (chosen) go(chosen.href);
      else if (query.trim()) go(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  /**
   * The overlay is rendered into `document.body`, not where it sits in the tree.
   *
   * `SiteSearch` lives inside `TerrifitHeader`, and `.tf-header.is-solid`
   * carries `backdrop-filter: blur(18px)`. An ancestor with a backdrop-filter
   * becomes the *containing block* for `position: fixed` descendants — so the
   * panel's `inset: 0` resolved against the header's 76px-tall box instead of
   * the viewport, and the search panel opened cropped to the height of the
   * header that contained it. The mobile drawer did the same thing.
   *
   * A portal takes it out of that containing block and out of the header's
   * stacking context, so `inset: 0` means the viewport again and the z-index
   * is measured against the page rather than against the header's children.
   */
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!mounted) return null;

  return createPortal(
    <motion.div
      className="tf-search-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
    >
      <motion.div
        className="tf-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label={labels.open}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tf-search-field">
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            value={query}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            placeholder={labels.placeholder}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="button" onClick={onClose} aria-label={labels.close}>
            Esc
          </button>
        </div>

        <div className="tf-search-results" id={listId} role="listbox">
          {query.trim().length === 0 ? (
            <div className="tf-search-suggest">
              <p>{labels.suggestions}</p>
              <div>
                {labels.suggestionItems.map((item) => (
                  <button key={item} type="button" onClick={() => onQueryChange(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="tf-search-empty">
              <p>{loading ? "…" : labels.empty}</p>
              {loading ? null : <span>{labels.emptyHint}</span>}
            </div>
          ) : (
            <>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={index === active ? "is-active" : undefined}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(result.href)}
                >
                  <span className="tf-search-kind">{labels.kinds[result.kind]}</span>
                  <span className="tf-search-text">
                    <strong>{result.title}</strong>
                    {result.subtitle ? <small>{result.subtitle}</small> : null}
                  </span>
                  {result.badge ? <b className="numeric">{result.badge}</b> : null}
                </button>
              ))}
              <a className="tf-search-all" href={`/${locale}/search?q=${encodeURIComponent(query.trim())}`}>
                {labels.seeAll}
              </a>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/** The portal target only exists on the client; nothing to subscribe to. */
const subscribeNoop = () => () => {};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" strokeLinecap="round" />
    </svg>
  );
}
