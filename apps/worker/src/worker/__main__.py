"""
CLI entry point for the worker.

This is a thin shim that delegates to entrypoints/main.py.

Usage (new modes):
    python -m worker --mode all            # Run all: ingest -> snapshot -> process (long-running)
    python -m worker --mode ingest --once  # One-shot ingestion
    python -m worker --mode snapshot --once # One-shot snapshotting
    python -m worker --mode process --once # One-shot processing (embed/cluster/score/rank)
"""

from .entrypoints.main import main

if __name__ == "__main__":
    main()
