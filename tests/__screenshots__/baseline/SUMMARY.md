# PR #0 Baseline Summary

Checked at: 2026-06-11T08:03:03.011Z

Base URL: https://n8n-dashboard-v3.onrender.com

## Route baseline

- /login: status 200, 584ms
- /: status 200, 226ms
- /api/health: status 200, 233ms

## Local checks

- `npm test`: exit 0
- `node scripts/probe-instance.mjs`: exit 0

## n8n probe

See `n8n-probe.json`. It contains only sanitized status/evidence metadata.

## Browser baseline

Playwright is not installed as a project dependency in PR #0; screenshots are deferred to CI/agent browser verification.

## Top issues / follow-ups

- Browser screenshot capture is not yet wired into project dependencies/CI.
