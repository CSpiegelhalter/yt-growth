"""
Database connection management.

Responsibility: Provide database connections.
Depends on: psycopg.
"""

import psycopg
from psycopg.rows import dict_row
from contextlib import contextmanager
from typing import Iterator
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode


def clean_database_url(database_url: str) -> str:
    """
    Remove Prisma-specific query parameters from DATABASE_URL.
    
    Prisma uses ?schema=public which psycopg doesn't understand.
    """
    parsed = urlparse(database_url)
    
    # Parse query params and remove Prisma-specific ones
    params = parse_qs(parsed.query)
    params.pop("schema", None)
    params.pop("pgbouncer", None)
    
    # Rebuild the URL
    clean_query = urlencode(params, doseq=True)
    clean_parsed = parsed._replace(query=clean_query)
    
    return urlunparse(clean_parsed)


@contextmanager
def get_connection(database_url: str) -> Iterator[psycopg.Connection]:
    """Get a database connection context manager."""
    clean_url = clean_database_url(database_url)
    conn = psycopg.connect(clean_url, row_factory=dict_row)
    try:
        yield conn
    finally:
        conn.close()
