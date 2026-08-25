# Contributing to Democracy Alpha Workbench

Thanks for your interest in contributing! We welcome contributions of all kinds — bug reports, feature requests, documentation improvements, and code.

Development setup

1. Clone the repo and create a branch from main:

   git clone https://github.com/owenlippert-stack/democracy-alpha-workbench.git
   cd democracy-alpha-workbench
   git checkout -b feat/your-feature

2. Create and activate a virtualenv:

   python -m venv .venv
   source .venv/bin/activate  # macOS / Linux
   .\.venv\Scripts\activate   # Windows (PowerShell)

3. Install dependencies (if present):

   pip install -r requirements.txt

Testing

- Run the test suite with pytest (if tests are present):

  pytest

Branching & PRs

- Create feature branches from main: feat/..., fix/..., chore/...
- Push your branch and open a pull request against main. Include a clear summary and testing steps.

Code style

- Follow PEP 8. Use linters/formatters such as black/flake8 where appropriate.

Commit messages

- Use concise commit messages. Example: "fix: correct input parsing for X"

Reporting issues

- Use the provided issue templates when opening bug reports or feature requests.

Thanks again — your contributions matter!
