import React, {useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const PAGEFIND_PATH = '/Struct4Search-Docs/pagefind/pagefind.js';

function loadPagefind(): Promise<PagefindModule> {
  const dynamicImport = new Function('path', 'return import(path)') as (
    path: string,
  ) => Promise<PagefindModule>;
  return dynamicImport(PAGEFIND_PATH);
}

type PagefindDocument = {
  url: string;
  excerpt: string;
  meta: {title?: string};
};

type PagefindResult = {
  data: () => Promise<PagefindDocument>;
};

type PagefindModule = {
  init: () => Promise<void> | void;
  search: (query: string) => Promise<{results: PagefindResult[]}>;
};

type SearchResult = {
  url: string;
  title: string;
  excerpt: string;
};

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resultUrl(url: string, baseUrl: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const duplicateBase = `${base.slice(0, -1)}${base}`;

  if (url.startsWith(duplicateBase)) {
    return `${base}${url.slice(duplicateBase.length)}`;
  }
  if (url.startsWith(base)) {
    return url;
  }
  return `${base}${url.replace(/^\/+/, '')}`;
}

export default function SearchBar(): React.JSX.Element {
  const baseUrl = useBaseUrl('/');
  const pagefindRef = useRef<PagefindModule | null>(null);
  const requestRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const term = query.trim();
    const request = ++requestRef.current;

    if (!open || term.length < 2) {
      setResults([]);
      setLoading(false);
      setError(false);
      return undefined;
    }

    setLoading(true);
    setError(false);
    const timer = window.setTimeout(async () => {
      try {
        if (!pagefindRef.current) {
          const pagefind = await loadPagefind();
          await pagefind.init();
          pagefindRef.current = pagefind;
        }

        const response = await pagefindRef.current.search(term);
        const documents = await Promise.all(
          response.results.slice(0, 8).map((result) => result.data()),
        );
        if (request !== requestRef.current) {
          return;
        }
        setResults(
          documents.map((document) => ({
            url: resultUrl(document.url, baseUrl),
            title: document.meta.title ?? '제목 없음',
            excerpt: plainText(document.excerpt),
          })),
        );
      } catch {
        if (request === requestRef.current) {
          setError(true);
          setResults([]);
        }
      } finally {
        if (request === requestRef.current) {
          setLoading(false);
        }
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [baseUrl, open, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="문서 검색"
        aria-expanded={open}
        onClick={() => setOpen(true)}>
        <span aria-hidden="true" className={styles.searchIcon}>⌕</span>
        <span className={styles.triggerText}>검색</span>
        <kbd className={styles.shortcut}>⌘ K</kbd>
      </button>

      {open && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="문서 검색">
            <div className={styles.inputRow}>
              <span aria-hidden="true" className={styles.searchIcon}>⌕</span>
              <input
                autoFocus
                className={styles.input}
                type="search"
                aria-label="검색어"
                placeholder="문서에서 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="button" className={styles.close} onClick={close} aria-label="검색 닫기">
                ESC
              </button>
            </div>

            <div className={styles.results} aria-live="polite">
              {query.trim().length < 2 && (
                <p className={styles.message}>두 글자 이상 입력하세요.</p>
              )}
              {loading && <p className={styles.message}>검색 중...</p>}
              {error && (
                <p className={styles.message}>검색 인덱스를 불러오지 못했습니다.</p>
              )}
              {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
                <p className={styles.message}>검색 결과가 없습니다.</p>
              )}
              {!loading && results.map((result) => (
                <a key={result.url} className={styles.result} href={result.url} onClick={close}>
                  <strong>{result.title}</strong>
                  <span>{result.excerpt}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
