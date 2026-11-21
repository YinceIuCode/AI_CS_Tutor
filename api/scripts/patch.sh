#!/usr/bin/env bash

set -e

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  .venv/bin/pip install -e .
fi

.venv/bin/python -m ruff check --fix
