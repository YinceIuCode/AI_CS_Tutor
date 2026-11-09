# Web

## Coding Style

* Follow the project's web development conventions.
* Keep the code clean, readable, and maintainable.
* Use consistent formatting and naming conventions.
* Ensure all applicable linting checks pass before submitting changes.

# Python

## Coding Style

Python code must follow the [PEP 8](https://peps.python.org/pep-0008/) style
guide.

* Follow PEP 8 coding conventions.
* Use Ruff for linting and code quality checks.
* Ensure all Ruff checks pass before submitting changes.
* Keep code readable, maintainable, and consistent.
* Use meaningful names for variables, functions, classes, and modules.

## Code Quality

All Python code must pass the following checks:

```bash
ruff check .
```

Code formatting must comply with Ruff's formatter:

```bash
ruff format --check .
```

* Do not introduce linting errors or formatting violations.
* Resolve all reported issues before submitting changes.
* Use project-defined Ruff configuration when available.

# References

* Python Style Guide: https://peps.python.org/pep-0008/
* Ruff Documentation: https://docs.astral.sh/ruff/
