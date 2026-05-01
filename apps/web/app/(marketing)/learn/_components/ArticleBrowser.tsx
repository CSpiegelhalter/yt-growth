"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LearnArticleListItem } from "../articles";
import s from "../style.module.css";

type Props = {
  articles: LearnArticleListItem[];
  pageSize?: number;
};

export default function ArticleBrowser({ articles, pageSize = 8 }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => {
      const haystack = `${a.title} ${a.label} ${a.description} ${a.category}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [articles, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  const goTo = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    if (typeof window !== "undefined") {
      const grid = document.getElementById("learn-articles-grid");
      grid?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <>
      <div className={s.searchBar}>
        <svg
          className={s.searchIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          className={s.searchInput}
          placeholder="Search guides..."
          value={query}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search learn articles"
        />
        {query && (
          <button
            type="button"
            className={s.searchClear}
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className={s.emptyState}>
          No guides match &ldquo;{query}&rdquo;. Try a different search.
        </p>
      ) : (
        <div id="learn-articles-grid" className={s.articlesGrid}>
          {visible.map((article) => (
            <Link
              key={article.slug}
              href={`/learn/${article.slug}`}
              className={s.articleCard}
            >
              <h2 className={s.articleTitle}>{article.title}</h2>
              <span className={s.articleCategory}>{article.category}</span>
              <p className={s.articleDescription}>{article.description}</p>
              <div className={s.articleMeta}>
                <span className={s.readTime}>{article.readingTime}</span>
                <span className={s.readMore}>
                  {article.ctaLabel}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className={s.pagination} aria-label="Articles pagination">
          <button
            type="button"
            className={s.paginationButton}
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <ul className={s.paginationList}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <li key={p}>
                <button
                  type="button"
                  className={
                    p === currentPage
                      ? `${s.paginationPage} ${s.paginationPageActive}`
                      : s.paginationPage
                  }
                  onClick={() => goTo(p)}
                  aria-current={p === currentPage ? "page" : undefined}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={s.paginationButton}
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next →
          </button>
        </nav>
      )}
    </>
  );
}
