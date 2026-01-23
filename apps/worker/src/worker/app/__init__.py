"""
Application layer - orchestration and use cases.

This layer contains:
- Services: coordinate domain logic with ports
- Feeders: candidate generation strategies
- Use cases: top-level pipeline orchestration

This layer:
- Depends on ports (interfaces), NOT implementations
- Calls domain logic for computations
- Does NOT contain business rules (those belong in domain)
- Does NOT do I/O directly (uses ports)
"""

from .use_cases import (
    run_ingest_pipeline,
    run_snapshot_pipeline,
    run_process_pipeline,
    run_all_pipelines,
)

__all__ = [
    "run_ingest_pipeline",
    "run_snapshot_pipeline",
    "run_process_pipeline",
    "run_all_pipelines",
]
