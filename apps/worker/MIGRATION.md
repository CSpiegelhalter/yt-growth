# Worker Architecture Migration Guide

This document explains the new layered architecture and how to navigate and extend the worker codebase.

## Architecture Overview

The worker is organized into distinct layers with clear responsibilities:

```
worker/
├── domain/           # Pure business logic (no I/O)
│   ├── models/       # Data structures and types
│   ├── scoring/      # Score computation formulas
│   ├── clustering/   # Clustering algorithms
│   ├── labeling/     # Keyword extraction
│   ├── gating/       # Filtering rules
│   └── feeders/      # Seed queries and extraction
│
├── ports/            # Interface definitions (Protocols)
│   ├── youtube.py    # YouTubeClientProtocol
│   ├── repositories.py # Repository protocols
│   ├── embeddings.py # EmbedderProtocol
│   ├── metrics.py    # MetricsCollectorProtocol
│   └── clock.py      # ClockProtocol
│
├── infra/            # External I/O implementations
│   ├── youtube/      # YouTube API client
│   ├── db/           # PostgreSQL repositories
│   ├── embeddings/   # OpenAI embedder
│   └── metrics/      # JSON metrics logger
│
├── app/              # Application orchestration
│   ├── services/     # Domain coordination
│   ├── feeders/      # Candidate generators
│   └── use_cases/    # Pipeline orchestration
│
├── config/           # Configuration management
├── entrypoints/      # CLI and bootstrap
└── common/           # Shared utilities
```

## Layer Responsibilities

### Domain Layer (`domain/`)

**Purpose**: Contains all pure business logic that doesn't depend on external systems.

**Rules**:
- NO database calls
- NO HTTP requests
- NO environment variable access
- NO file I/O
- All functions should be deterministic and side-effect free

**Contents**:
- `models/` - Dataclasses for Video, Channel, Cluster, Score, etc.
- `scoring/` - Velocity, breakout, and opportunity score formulas
- `clustering/` - HDBSCAN/UMAP wrappers, stable ID generation
- `labeling/` - TF-IDF keyword extraction
- `gating/` - Age eligibility, channel caps, deduplication
- `feeders/` - Intent seeds, query extraction

### Ports Layer (`ports/`)

**Purpose**: Defines interfaces (Protocols) that abstract external systems.

**Rules**:
- Only type definitions, no implementations
- Uses `typing.Protocol` for structural subtyping
- Stable interfaces that change rarely

**Contents**:
- `YouTubeClientProtocol` - YouTube API abstraction
- `VideoRepositoryProtocol`, etc. - Database abstractions
- `EmbedderProtocol` - Text embedding abstraction
- `MetricsCollectorProtocol` - Metrics logging abstraction

### Infrastructure Layer (`infra/`)

**Purpose**: Implements the ports with real external systems.

**Rules**:
- ALL external I/O happens here
- Implements one or more Protocol interfaces
- Can be swapped for fakes in tests

**Contents**:
- `youtube/` - Real YouTube API client with quota tracking
- `db/` - PostgreSQL repositories with psycopg
- `embeddings/` - OpenAI embedding client
- `metrics/` - JSON-format metrics logger

### Application Layer (`app/`)

**Purpose**: Orchestrates domain logic and ports to accomplish use cases.

**Rules**:
- Depends on ports (interfaces), NOT implementations
- Coordinates multiple services and repositories
- No business logic (delegates to domain)

**Contents**:
- `services/` - GatingService, EmbeddingService, etc.
- `feeders/` - IntentSeedFeeder, ExpansionFeeder, etc.
- `use_cases/` - run_ingest_pipeline, run_snapshot_pipeline, etc.

### Entrypoints (`entrypoints/`)

**Purpose**: Wire everything together and handle CLI.

**Contents**:
- `main.py` - Composition root, CLI, signal handlers

## How to Add New Features

### Adding a New Score Type

1. Add the formula in `domain/scoring/`:
```python
# domain/scoring/my_score.py
def compute_my_score(param1: float, param2: float) -> float:
    return param1 * param2
```

2. Export from `domain/scoring/__init__.py`

3. Use in `app/services/scoring_service.py`

### Adding a New External Data Source

1. Define the Protocol in `ports/`:
```python
# ports/my_source.py
class MySourceProtocol(Protocol):
    def fetch_data(self, query: str) -> list[dict]: ...
```

2. Implement in `infra/`:
```python
# infra/my_source/client.py
class MySourceClient:
    def fetch_data(self, query: str) -> list[dict]:
        # Real implementation
        pass
```

3. Accept as dependency in services:
```python
# app/services/my_service.py
class MyService:
    def __init__(self, source: MySourceProtocol):
        self.source = source
```

4. Wire in `entrypoints/main.py`:
```python
source = MySourceClient(api_key=config.my_source_api_key)
service = MyService(source=source)
```

### Adding a New Repository

1. Define Protocol in `ports/repositories.py`
2. Implement in `infra/db/my_repo.py`
3. Add to `infra/db/__init__.py` exports
4. Wire in `entrypoints/main.py`

## Testing

### Unit Testing Domain Logic

Domain logic is pure, so tests are straightforward:

```python
# tests/domain/test_my_score.py
def test_compute_my_score():
    result = compute_my_score(2.0, 3.0)
    assert result == 6.0
```

### Testing with Fakes

Use fake implementations for integration testing:

```python
# tests/conftest.py has FakeYouTubeClient, FakeEmbedder, etc.

def test_ingest_pipeline(fake_youtube_client, fake_metrics):
    # Test pipeline with fakes
    pass
```

### Running Tests

```bash
cd apps/worker
python -m pytest tests/ -v
```

## Migration from Old Structure

### Old File → New Location

| Old File | New Location |
|----------|--------------|
| `youtube_client.py` | `infra/youtube/client.py` |
| `db.py` | `infra/db/*.py` (split into repos) |
| `embed.py` | `infra/embeddings/` + `app/services/embedding_service.py` |
| `cluster.py` | `domain/clustering/` + `app/services/clustering_service.py` |
| `score.py` | `domain/scoring/` + `app/services/scoring_service.py` |
| `rank.py` | `domain/scoring/opportunity.py` + `app/services/ranking_service.py` |
| `gating.py` | `domain/gating/` + `app/services/gating_service.py` |
| `label.py` | `domain/labeling/` |
| `discovery_feeders.py` | `domain/feeders/` + `app/feeders/` |
| `snapshot_scheduler.py` | `app/services/snapshot_service.py` |
| `pipeline.py` | `app/use_cases/` |
| `metrics.py` | `ports/metrics.py` + `infra/metrics/` |
| `config.py` | `config/settings.py` |
| `__main__.py` | `entrypoints/main.py` (thin shim remains) |

### Import Changes

Old:
```python
from .config import get_config
from .db import get_connection, upsert_discovered_video
from .youtube_client import YouTubeClient
```

New:
```python
from worker.config import get_config
from worker.infra.db import get_connection, PostgresVideoRepository
from worker.infra.youtube import YouTubeClient
```

## Key Principles

1. **Dependency Inversion**: High-level modules (app) depend on abstractions (ports), not concrete implementations (infra).

2. **Single Responsibility**: Each file has one primary reason to change.

3. **Testability**: Pure domain logic is easy to unit test. Services can be tested with fakes.

4. **Explicit Dependencies**: No global state. Dependencies are passed via constructors.

5. **No Circular Imports**: Clear layer hierarchy prevents import cycles.

## CLI Usage (Unchanged)

The CLI interface is unchanged:

```bash
# New modes
python -m worker --mode all
python -m worker --mode ingest --once
python -m worker --mode snapshot --once
python -m worker --mode process --once

# Legacy commands (still work)
python -m worker embed --window 7d
python -m worker cluster --window 7d
python -m worker score --window 7d
python -m worker rank --window 7d
python -m worker run --window 7d
```
