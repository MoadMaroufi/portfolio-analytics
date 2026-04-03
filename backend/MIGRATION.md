# Poetry Migration Guide

This project now uses Poetry for dependency management instead of pip/requirements.txt.

## Why Poetry?
- **Deterministic builds**: `poetry.lock` pins exact versions
- **Automatic resolution**: Handles dependency conflicts automatically
- **Dev/prod separation**: Dev dependencies don't leak into production
- **Better Docker caching**: Lock file changes less frequently

## Installation

### 1. Install Poetry (Local Development)
```bash
curl -sSL https://install.python-poetry.org | python3 -
# Or: pip install poetry
```

### 2. Generate poetry.lock (REQUIRED)
```bash
cd backend
poetry lock
```

**This creates `poetry.lock`** - commit this file! It contains exact versions.

### 3. Install Dependencies Locally
```bash
cd backend
poetry install
```

### 4. Activate Shell
```bash
cd backend
poetry shell
# Now you're in the virtualenv
```

## Development Commands

| Old (pip) | New (Poetry) |
|-----------|--------------|
| `pip install -r requirements.txt` | `poetry install` |
| `pip install -r requirements-dev.txt` | `poetry install --with dev` |
| `pytest tests/ -v` | `poetry run pytest tests/ -v` |
| `python -m uvicorn main:app --reload` | `poetry run uvicorn main:app --reload` |
| `python script.py` | `poetry run python script.py` |

## Adding Dependencies

```bash
# Add production dependency
poetry add package-name

# Add dev dependency
poetry add --group dev package-name

# Add with version constraint
poetry add "package>=1.0.0,<2.0.0"
```

## Updating Dependencies

```bash
# Update single package
poetry update package-name

# Update all packages
poetry update

# Regenerate lock file from scratch
poetry lock --no-cache
```

## Docker

The Dockerfile now uses Poetry:

```bash
# Build
docker build -t portfolio-backend .

# Run
docker run -p 8000:8000 --env-file .env portfolio-backend
```

## Railway Deployment

Railway should auto-detect Poetry:
1. Push code with `pyproject.toml` and `poetry.lock`
2. Railway will run `poetry install` automatically
3. Set `PORTFOLIO_*` environment variables in Railway dashboard

If Railway doesn't auto-detect, add a `nixpacks.toml`:
```toml
[phases.build]
cmds = ["pip install poetry", "poetry install --no-root --without dev --no-interaction --no-ansi"]

[start]
cmd = "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
```

## CI/CD

GitHub Actions is already updated to use Poetry.

## Files Changed

- ✅ `pyproject.toml` - New dependency definition
- ✅ `poetry.lock` - Generated (run `poetry lock`)
- ✅ `Dockerfile` - Uses Poetry
- ✅ `.dockerignore` - Optimized for Poetry
- ✅ `.github/workflows/ci.yml` - Uses Poetry
- ❌ `requirements.txt` - Deprecated (kept for reference)
- ❌ `requirements-dev.txt` - Deprecated (kept for reference)

## Next Steps

1. **Run `poetry lock`** in backend directory
2. **Commit `poetry.lock`** to git
3. **Test locally**: `poetry install && poetry run uvicorn main:app --reload`
4. **Deploy to Railway**
5. **Remove old requirements files** (optional, after confirming everything works)
