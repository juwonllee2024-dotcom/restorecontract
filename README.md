# RestoreContract 🧯

**A backup you cannot restore is a guess.**

RestoreContract turns a Docker Compose stack into a small, reviewable recovery contract: services, dependencies, persistent paths, named volumes, ports, and required environment *names*. It then checks the contract against a target directory without starting containers or exposing secret values.

Local. Deterministic. Read-only.

## Quick start

Create a normalized Compose JSON file without interpolating secrets:

```powershell
docker compose config --format json --no-interpolate > compose.json
npm install --save-dev github:juwonllee2024-dotcom/restorecontract

npx restorecontract capture --compose compose.json --out restore-contract.json
npx restorecontract report --contract restore-contract.json --out RESTORE.md
npx restorecontract check --contract restore-contract.json --root . --env-path .env.example
```

The runnable fixture is in [`examples/stack`](examples/stack):

```powershell
node src/cli.js capture --compose examples/stack/compose.json --out examples/stack/restore-contract.json
node src/cli.js report --contract examples/stack/restore-contract.json --out examples/stack/RESTORE.md
node src/cli.js check --contract examples/stack/restore-contract.json --root examples/stack --env-path .env.example
```

## What the contract catches

- A service that depends on another service.
- Named volumes that must exist before startup.
- Bind-mounted paths that must be restored on the target host.
- Required environment variable names, without recording their values.
- Stateful images such as Postgres, MySQL, MariaDB, Mongo, Redis, or Elasticsearch that need a logical dump or database-aware snapshot.

The report is a plain Markdown checklist that can sit next to a private backup or recovery repository.

## What it deliberately does not do

RestoreContract is not a backup engine and does not pretend that a backup was restored. It does not start or stop containers, copy volumes, read process environment variables, upload data, or call a cloud service. The MVP accepts normalized Compose JSON; YAML normalization stays with Docker Compose so this tool remains dependency-free and predictable.

## Safety model

- `capture` stores structure and names, never environment values.
- `report` only renders the contract.
- `check` reads the selected root and optional env file; it checks names, not values.
- Missing bind mounts and env names fail the check without printing secrets.
- No automatic repair, deletion, network access, or credential discovery.

## Why this exists

Self-hosters repeatedly describe the gap between “the backup exists” and “the stack can actually be recovered”: [a recent backup discussion](https://www.reddit.com/r/selfhosted/comments/1wn1wfh/backing_up_persistent_data_and_config_of_my/) calls out restore testing, and [another recovery discussion](https://www.reddit.com/r/selfhosted/comments/1rz89tt/good_backup_does_not_mean_good_recovery/) says an untested backup is hope. Existing projects cover full backup, orchestration, or diagrams; RestoreContract is the small, inspectable recovery boundary between a Compose file and a backup drill.

## First-user experiment

The first users are homelab and small-server maintainers with 5–50 Compose services. In seven days, give 10 maintainers the fixture and ask them to generate a contract for one real stack. Measure: missing paths found, missing env names found, time to understand the restore checklist, and whether they run `check` again after a change.

## Business hypothesis

The CLI stays MIT and local. A possible paid layer could add scheduled recovery drills, encrypted remote evidence, or team policy reports; this is a hypothesis, not a promise. The open-source contract must remain useful without an account.

## Development

```powershell
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CHANGELOG.md](CHANGELOG.md), and [docs/decision.md](docs/decision.md).

## License

MIT. See [LICENSE](LICENSE).
