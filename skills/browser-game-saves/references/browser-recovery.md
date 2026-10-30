# Failure and recovery protocol (browser)

| Failure | Expected reaction | Regression test |
|---|---|---|
| Wrong slot/invalid JSON | Reject before transaction | Input validation |
| Browser tab writes stale revision | Fail with ConflictError and preserve current record | Two writes with same expectedRevision |
| Transaction abort / quota | Reject, no false success | Force `transaction.abort` in isolated test |
| Primary payload changed/truncated | Report corruption; verify backup; don't auto-promote | Mutated checksum |
| Unknown future schema | Explicit unsupported-version error, not recovery fallback | Version > supported |
| Browser clears site data | Explain loss; offer import from exported file | Clear-site-data manual test |
| Visibility hidden / mobile kill | Periodic/checkpoint saves already committed | Simulate hidden and force-kill |
| Browser multi-tab conflict | CAS prevents lost update | Two-tabs manual QA |
| IndexedDB unavailable/private policy | Surface a recoverable error and export alternative | Browser matrix |

QA targets must be product-defined. For each supported browser and device measure worst-case save latency, payload size and frequency. Explicitly record known browser behavior rather than assuming all versions have identical persistence.
