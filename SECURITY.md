# Security policy

## Scope

RestoreContract reads normalized Compose JSON, optional env files, and selected filesystem paths. It does not start containers, upload data, or inspect process environment values.

## Safe use

- Generate Compose JSON with `--no-interpolate` when possible.
- Review `restore-contract.json` and `RESTORE.md` before sharing them.
- Treat image names, paths, ports, and variable names as potentially sensitive metadata.
- Keep actual env files and backup data outside public repositories.

## Reporting

Do not disclose a suspected vulnerability in a public issue. Open a private GitHub security advisory for this repository or contact the maintainer through the GitHub profile. Include reproduction steps, affected versions, and a minimal fixture. Never include secrets.
