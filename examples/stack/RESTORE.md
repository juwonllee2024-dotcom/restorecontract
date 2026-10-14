# Restore Contract

> Generated locally by RestoreContract. Secret values are intentionally omitted.

- Contract version: 1
- Services: 2
- Named volumes: 1
- Networks: 0

## Services

| Service | Image | Depends on | Ports | Persistent paths | Environment keys |
| --- | --- | --- | --- | --- | --- |
| db | postgres:16 | — | — | database → /var/lib/postgresql/data | POSTGRES_PASSWORD |
| web | ghcr.io/example/web:1.2.3 | db | 8080:8080 | ./data → /var/lib/web (read-only) | APP_SECRET, TZ |

## Restore checklist

- [ ] Keep the source Compose file and this contract together.
- [ ] Restore db path: database → /var/lib/postgresql/data
- [ ] Provide environment key `POSTGRES_PASSWORD` for db without committing its value.
- [ ] Restore web path: ./data → /var/lib/web (read-only)
- [ ] Provide environment key `APP_SECRET` for web without committing its value.
- [ ] Provide environment key `TZ` for web without committing its value.
- [ ] Restore named volume `database` before starting the stack.

## Stateful service warning

- [ ] Take a logical dump or database-aware snapshot before copying raw volume data.

## Warnings

- db looks stateful: use a logical dump or database-aware snapshot before copying raw data.

## Scope

This contract describes what must exist for a recovery. It does not back up data, copy secrets, start containers, or claim that a backup has been restored successfully.

