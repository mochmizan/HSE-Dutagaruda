# viaannn — prod build root (new project, OpenCode conventions)

## Scope

Spec-driven rebuild of the HSE Inspection Platform. Spec in `spec/` is binding.
No code until the owner approves the spec.

## Conventions (OpenCode only; ignore Cursor/other-harness specifics)

- Work only inside `D:\dev\viaannn`.
- Indonesian K3 labels in all user-facing UI. `tabular-nums` on numbers/dates.
- TypeScript strict, zero-error builds. `bun run build` at the root builds all
  three: `@viaannn/shared` → `@viaannn/api` → `@viaannn/web`. The web package
  used to be named `preview`, which made the root build skip it entirely and
  ship stale bundles; do not rename it back.
- `bun run test` runs the unit suite (97 tests). `bun run doctor` runs the
  pre-flight. The live integration gate is
  `docker compose -f infra/docker-compose.yml exec -T -e CHECK_BASE=http://caddy:80 api bun run src/check.ts`
  (expect 66/66).
- Performance claims need a before/after measurement, not an opinion:
  `bun scripts/bench/probe.ts` (web payload on the wire + API latency),
  `bun scripts/bench/pdf.ts` (PDF render time and size). The probe must read
  bytes over raw `http`; `fetch` auto-decompresses and silently reports raw size.
- UI refactors are gated by `wiki/artifacts/20261019-kinerja/baseline-ui.json`
  (git-ignored, regenerate with the harness in `scripts/bench/pin-ui.ts`).
  Table column order, cell count, borders and rendered row text must match.
- ctx7 CLI (`npx ctx7@latest docs <id> <query>`) to verify library signatures.
- Modals: Esc + backdrop close. Dark mode everywhere.
- Page edits update the matching `wiki/features/*.md` map file in the same
  task and prove via `wiki/SKILL.md`.
- Workers: `worker`-type subagents briefed with the poteto playbooks
  (`D:\marketplace\pstack-opencode\poteto-mode\SKILL.md`, `agents\poteto-agent.md`)
  minus Cursor-specific tooling. Spec gates in `spec/07-build-order.md` are law:
  no stream starts before its gate is green.

## Layout

`apps/web` (Vite+React) · `apps/api` (Hono+Drizzle+Better Auth) ·
`packages/shared` (DTOs, calculators, dates) · `infra/` (compose) · `spec/` ·
`wiki/` (verification skill `SKILL.md`, feature map `features/`, helpers;
proof `artifacts/` git-ignored) · `scripts/bench/` (performance probes) ·
`scripts/cek-dist.mjs` (stale web build guard).