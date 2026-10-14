# Product decision: RestoreContract

Date: 2026-10-14

## Problem

Self-hosters can have a backup archive, a Compose file, and a secrets file while still lacking a short answer to: “What exactly must exist for this stack to come back?” The failure is often discovered during the restore, not during the backup.

## Four independent invention questions

### 1. RestoreContract — selected

- **Fact:** Recent self-hosting discussions describe restore testing, database-aware dumps, bind mounts, volumes, and missing recovery recipes as recurring pain.
- **Innovation hypothesis:** A local recovery contract can expose missing paths and required secret names before a disaster without becoming another backup platform.
- **One difference:** It proves the *shape of recoverability* while intentionally never copying data or secret values.
- **Smallest seven-day experiment:** Give 10 small-server maintainers one Compose stack fixture, then one real stack, and measure whether the checklist finds a missing path or env key.
- **Score:** pain 5/5, novelty 4/5, build today 5/5, organic shareability 4/5, open-source fit 4/5 — **22/25**.

### 2. PortWitness — rejected

- **Fact:** “Port already in use” is frequent during local development.
- **Innovation hypothesis:** A read-only cross-platform process explanation is more useful than a kill command.
- **One difference:** Parent process and safe restart evidence instead of forced termination.
- **Smallest experiment:** Diagnose 20 real port collisions without killing a process.
- **Score:** 4/5, 2/5, 5/5, 4/5, 4/5 — **19/25**.
- **Why rejected:** `lsof`, `ss`, `netstat`, and kill-port tools make the wedge familiar and crowded.

### 3. SkillLock — rejected

- **Fact:** Agent skills and local instructions are spreading quickly, but compatibility is inconsistent.
- **Innovation hypothesis:** A lockfile could pin the skill inputs and expected tool capabilities.
- **One difference:** Reproducible skill contracts instead of prompt synchronization.
- **Smallest experiment:** Re-run one task with a locked skill set on two machines.
- **Score:** 4/5, 3/5, 4/5, 3/5, 3/5 — **17/25**.
- **Why rejected:** It overlaps this account's rulesync and skillsmith, and the first-user boundary is unclear.

### 4. Screenveil — rejected

- **Fact:** People share demos and screenshots containing accidental secrets.
- **Innovation hypothesis:** A local recorder with reversible redaction could reduce disclosure risk.
- **One difference:** A reviewable redaction manifest instead of a generic screenshot editor.
- **Smallest experiment:** Redact 20 real support screenshots and count manual corrections.
- **Score:** 4/5, 3/5, 3/5, 4/5, 4/5 — **18/25**.
- **Why rejected:** Capture and OS permissions make the MVP less buildable today; it also overlaps pastehalo and evidence-lane.

## Decision

Ship RestoreContract as a separate public repository. It is deliberately smaller than a backup manager: normalized Compose JSON in, redacted recovery contract and read-only readiness check out.

## Evidence and competition

- User pain: [backup and config discussion](https://www.reddit.com/r/selfhosted/comments/1wn1wfh/backing_up_persistent_data_and_config_of_my/), [good backup does not mean good recovery](https://www.reddit.com/r/selfhosted/comments/1rz89tt/good_backup_does_not_mean_good_recovery/).
- Adjacent projects: [unraid-config-guardian](https://github.com/stephondoestech/unraid-config-guardian), [Sencho](https://github.com/Studio-Saelix/sencho), and [Docker Compose Visualizer](https://www.databloom.in/).
- Trend context: [GitHub Trending](https://github.com/trending) and [Claracle weekly trends](https://claracle.com/) show continued interest in local-first and self-hosted tooling.

The product must not claim to replace those tools. Its narrow bet is that a small, diffable recovery contract is useful even when the user already has a backup system.
