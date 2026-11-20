#!/usr/bin/env bash

set -e

python -m venv .venv
.venv/bin/pip install -e .
