# Verification record

Fresh release verification run: 2026-10-14.

## Required checks

- [x] TDD RED observed before implementation: `ERR_MODULE_NOT_FOUND` for the intentionally absent `src/core.js`.
- [x] Unit/integration tests: `npm test` — **4 passed, 0 failed**.
- [x] Syntax/lint checks: `npm run lint` — passed.
- [x] Build check: `npm run build` — passed for `restorecontract@0.1.0`.
- [x] Package smoke test: packed CLI captured the example contract successfully.
- [x] Dependency audit: `npm audit --omit=dev` — **0 vulnerabilities**.
- [x] `git diff --check` — passed.
- [x] Fixture capture, report, and check — passed; check emitted only the stateful database warning.
- [x] Secret-value scan: no secret values in `examples`, `README.md`, `src`, or `docs`.
- [x] Package SHA-256: `1ed1e13e18b1a16aab902f16626c6988ea5efb352eb0fffb270ef52711cc505d`.
- [ ] Remote CI and release — pending public push.

## Real input to result

Input: `examples/stack/compose.json`, with `examples/stack/.env.example` and an empty `examples/stack/data` bind path.

Observed result: a contract and Markdown checklist that include service dependencies, persistent paths, named volumes, and environment names without any secret values. `check` returned `OK` for the fixture and warned that Postgres needs a logical dump or database-aware snapshot.
