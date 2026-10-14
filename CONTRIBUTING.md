# Contributing

Thanks for improving RestoreContract.

1. Create a focused branch.
2. Add a failing test before changing behavior.
3. Keep the core local, deterministic, dependency-free, and secret-value-free.
4. Run `npm ci`, `npm test`, `npm run lint`, `npm run build`, `npm audit --omit=dev`, and `git diff --check`.
5. Add a fixture when changing Compose normalization or report output.
6. Explain whether a change could expose metadata, execute a process, or alter files.

Please do not add automatic backups, container execution, credential discovery, or network uploads without a separate design review.
